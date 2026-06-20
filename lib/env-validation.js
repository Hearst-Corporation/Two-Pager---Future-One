// lib/env-validation.js
// Validate required environment variables at boot time.
// Crash early with a clear message if configuration is missing.

// Required server-side env vars.
// OPENAI_API_KEY est REQUIRED car le chat principal du cockpit
// (CockpitShell → /api/cockpit-chat) tourne sur OpenAI GPT (gpt-4.1 / gpt-4o).
// MOONSHOT_API_KEY reste REQUIRED pour le générateur de mémo stratégique (Kimi K2.6).
const REQUIRED_SERVER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'MOONSHOT_API_KEY',
];

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const OPTIONAL = [
  'OPENAI_CHAT_MODEL',
  'MOONSHOT_BASE_URL',
  'KIMI_MODEL',
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
