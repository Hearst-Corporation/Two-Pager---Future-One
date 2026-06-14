// lib/env-validation.js
// Validate required environment variables at boot time.

const REQUIRED_SERVER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

const REQUIRED_PUBLIC = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const OPTIONAL = [
  'OPENAI_BASE_URL',
  'OPENAI_CHAT_MODEL',
  'OPENAI_MEMO_MODEL',
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

  for (const key of OPTIONAL) {
    if (!env[key]) {
      console.warn(`⚠️  Optional environment variable not set: ${key}`);
    }
  }

  console.log('✅ Environment variables validated');
}

module.exports = { validateEnv, REQUIRED_SERVER, REQUIRED_PUBLIC, OPTIONAL };
