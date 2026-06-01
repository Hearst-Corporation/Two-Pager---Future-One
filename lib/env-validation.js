// lib/env-validation.js
// Validate required environment variables at boot time.
// Crash early with a clear message if configuration is missing.

// Required server-side env vars.
// HYPERCLI_API_KEY est désormais REQUIRED car le chat principal du cockpit
// (CockpitShell → /api/cockpit-chat) utilise Hypercli/Kimi K2.6 par défaut.
// ANTHROPIC_API_KEY est passée OPTIONAL : seul /api/admin/hearst/advisor
// (mode "Advisor" Claude, non actif dans le chat natif) en a encore besoin.
const REQUIRED_SERVER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'HYPERCLI_API_KEY',
];

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const OPTIONAL = [
  'ANTHROPIC_API_KEY',
  'HYPERCLI_BASE_URL',
  'HYPERCLI_DEFAULT_MODEL',
  'SENTRY_DSN',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'SENTRY_AUTH_TOKEN',
  'ADMIN_DEV_AUTOLOGIN_EMAIL',
];

function validateEnv(env = process.env) {
  const errors = [];

  for (const key of REQUIRED_SERVER) {
    if (!env[key]) {
      errors.push(`Missing required server environment variable: ${key}`);
    }
  }

  for (const key of REQUIRED_PUBLIC) {
    if (!env[key]) {
      errors.push(`Missing required public environment variable: ${key}`);
    }
  }

  // Validate ANTHROPIC_API_KEY format (basic check)
  const anthropicKey = env.ANTHROPIC_API_KEY;
  if (anthropicKey && !anthropicKey.startsWith('sk-ant-')) {
    errors.push('ANTHROPIC_API_KEY does not look like an Anthropic key (should start with "sk-ant-")');
  }

  // Validate Supabase URL format
  const supaUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (supaUrl && !supaUrl.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL should start with https://');
  }

  if (errors.length > 0) {
    console.error('\n❌ ENVIRONMENT CONFIGURATION ERRORS:\n');
    errors.forEach((e) => console.error(`   • ${e}`));
    console.error('\nPlease check your .env.local file against .env.example\n');
    throw new Error(`Environment validation failed (${errors.length}): ${errors.join('; ')}`);
  }

  // Log optional variables status
  for (const key of OPTIONAL) {
    if (!env[key]) {
      console.warn(`⚠️  Optional environment variable not set: ${key}`);
    }
  }

  console.log('✅ Environment variables validated');
}

module.exports = { validateEnv };
