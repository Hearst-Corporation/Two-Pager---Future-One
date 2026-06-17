import 'server-only';

// Distributed sliding-window rate limiter.
//
// PROBLÈME RÉSOLU (P1) : les routes utilisaient un `new Map()` in-memory qui se
// réinitialise à chaque cold start Vercel. Un attaquant déclenchant des cold
// starts pouvait donc remettre son compteur à zéro et bypasser le cap (5/min sur
// strategic-memo → appels GPT-4.1 illimités → dépenses OpenAI non bornées).
//
// SOLUTION : compteur partagé dans Upstash Redis (REST API, `fetch()` natif, zéro
// dépendance npm). Le sliding window est implémenté avec un sorted-set par clé :
//   ZREMRANGEBYSCORE  → purge les hits hors fenêtre
//   ZADD              → enregistre le hit courant (score = timestamp ms)
//   ZCARD             → compte les hits dans la fenêtre
//   PEXPIRE           → TTL = la fenêtre (auto-cleanup des clés inactives)
// le tout en une seule requête pipeline atomique côté Redis.
//
// FALLBACK GRACIEUX : si les env vars Upstash sont absentes (dev local) ou si
// l'appel REST échoue (Redis indispo), on retombe sur le rate-limiter in-memory
// — exactement le comportement historique des routes. On ne casse jamais une
// requête à cause de l'infra de rate-limit (fail-open), on log juste un warning
// (une seule fois pour la config manquante, pour ne pas spammer les logs).

const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = Boolean(REST_URL && REST_TOKEN);

// In-memory fallback : `key` → { count, resetAt }. Survit le temps d'une instance
// (donc bypassable via cold starts — c'est précisément pourquoi Redis existe — mais
// suffisant en dev et comme filet de sécurité si Redis tombe).
const memBuckets = new Map();

let warnedNoRedis = false;
function warnOnceNoRedis() {
  if (warnedNoRedis) return;
  warnedNoRedis = true;
  // eslint-disable-next-line no-console
  console.warn(
    '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN absents — ' +
      'fallback rate-limit in-memory (bypassable via cold starts). ' +
      'Configurer Upstash en production pour un cap distribué fiable.',
  );
}

function memoryRateLimit(key, limit, windowSec) {
  const windowMs = windowSec * 1000;
  const now = Date.now();
  const b = memBuckets.get(key);
  if (!b || now >= b.resetAt) {
    memBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), resetSec: windowSec };
  }
  const resetSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  if (b.count >= limit) {
    return { ok: false, remaining: 0, resetSec };
  }
  b.count += 1;
  return { ok: true, remaining: Math.max(0, limit - b.count), resetSec };
}

// Exécute une suite de commandes Redis en un seul round-trip via l'endpoint
// /pipeline d'Upstash. Retourne le tableau des résultats (un par commande).
async function upstashPipeline(commands, signal) {
  const res = await fetch(`${REST_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
    signal,
    // Ne jamais mettre en cache une commande de rate-limit.
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Upstash pipeline HTTP ${res.status}`);
  }
  const json = await res.json();
  // Format pipeline : [{ result }, { result }, ...] ou [{ error }, ...].
  if (!Array.isArray(json)) {
    throw new Error('Upstash pipeline: unexpected response shape');
  }
  return json.map((entry) => {
    if (entry && typeof entry === 'object' && 'error' in entry && entry.error) {
      throw new Error(`Upstash command error: ${entry.error}`);
    }
    return entry?.result;
  });
}

async function redisRateLimit(key, limit, windowSec) {
  const windowMs = windowSec * 1000;
  const now = Date.now();
  const cutoff = now - windowMs;
  const redisKey = `rl:${key}`;
  // Membre unique par hit (timestamp + suffixe aléatoire) pour éviter les
  // collisions de score quand plusieurs hits tombent sur la même ms.
  const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;

  // Abort si Upstash traîne — on ne bloque pas la requête sur le rate-limit.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const results = await upstashPipeline(
      [
        // 1. Purge les hits hors fenêtre (scores <= cutoff).
        ['ZREMRANGEBYSCORE', redisKey, 0, cutoff],
        // 2. Enregistre le hit courant (score = timestamp ms).
        ['ZADD', redisKey, now, member],
        // 3. Compte les hits dans la fenêtre (inclut celui qu'on vient d'ajouter).
        ['ZCARD', redisKey],
        // 4. Score du plus ancien hit encore dans la fenêtre (pour resetSec).
        ['ZRANGE', redisKey, 0, 0, 'WITHSCORES'],
        // 5. TTL = la fenêtre — auto-cleanup des clés inactives.
        ['PEXPIRE', redisKey, windowMs],
      ],
      controller.signal,
    );

    const count = Number(results[2]) || 0;
    const oldest = Array.isArray(results[3]) && results[3].length >= 2
      ? Number(results[3][1])
      : now;
    const resetSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));

    if (count > limit) {
      return { ok: false, remaining: 0, resetSec };
    }
    return { ok: true, remaining: Math.max(0, limit - count), resetSec };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sliding-window rate limit, distribué (Upstash Redis) avec fallback in-memory.
 *
 * @param {string} key  Identité du caller (ex: IP ou actorId). Sera préfixée `rl:`.
 * @param {{ limit: number, windowSec: number }} opts
 * @returns {Promise<{ ok: boolean, remaining: number, resetSec: number }>}
 *   ok        — true si la requête est autorisée, false si le cap est atteint.
 *   remaining — requêtes restantes dans la fenêtre courante.
 *   resetSec  — secondes avant que la fenêtre ne libère de la capacité (Retry-After).
 */
export async function rateLimit(key, { limit, windowSec }) {
  if (!REDIS_ENABLED) {
    warnOnceNoRedis();
    return memoryRateLimit(key, limit, windowSec);
  }
  try {
    return await redisRateLimit(key, limit, windowSec);
  } catch (e) {
    // Fail-open : Redis indispo (réseau, timeout, 5xx) ne doit JAMAIS faire échouer
    // la route. On retombe sur l'in-memory pour conserver un minimum de protection.
    // eslint-disable-next-line no-console
    console.warn(`[rate-limit] Upstash indispo (${e?.message}) — fallback in-memory`);
    return memoryRateLimit(key, limit, windowSec);
  }
}
