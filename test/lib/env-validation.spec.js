import { describe, it, expect } from 'vitest';
import { validateEnv } from '@/lib/env-validation';

// Required schema (see lib/env-validation.js):
//   server : SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, MOONSHOT_API_KEY
//   public : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
const VALID_ENV = {
  SUPABASE_SERVICE_ROLE_KEY: 'test-srk',
  OPENAI_API_KEY: 'sk-test-openai',
  MOONSHOT_API_KEY: 'sk-test-moonshot',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
};

describe('env-validation', () => {
  it('should pass when all required variables are present', () => {
    expect(() => validateEnv({ ...VALID_ENV })).not.toThrow();
  });

  it('should throw when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    const { SUPABASE_SERVICE_ROLE_KEY, ...env } = VALID_ENV;
    expect(() => validateEnv(env)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('should throw when OPENAI_API_KEY is missing', () => {
    const { OPENAI_API_KEY, ...env } = VALID_ENV;
    expect(() => validateEnv(env)).toThrow(/OPENAI_API_KEY/);
  });

  it('should throw when MOONSHOT_API_KEY is missing', () => {
    const { MOONSHOT_API_KEY, ...env } = VALID_ENV;
    expect(() => validateEnv(env)).toThrow(/MOONSHOT_API_KEY/);
  });

  it('should throw when NEXT_PUBLIC_SUPABASE_URL is not https', () => {
    const env = { ...VALID_ENV, NEXT_PUBLIC_SUPABASE_URL: 'http://insecure.supabase.co' };
    expect(() => validateEnv(env)).toThrow(/https/);
  });

  it('should collect multiple errors', () => {
    expect(() => validateEnv({})).toThrow(/failed \(5\)/);
  });
});
