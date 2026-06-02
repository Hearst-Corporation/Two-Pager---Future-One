import { describe, it, expect } from 'vitest';
import { validateEnv } from '@/lib/env-validation';

// Required schema (see lib/env-validation.js):
//   server : SUPABASE_SERVICE_ROLE_KEY, HYPERCLI_API_KEY
//   public : NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
const VALID_ENV = {
  SUPABASE_SERVICE_ROLE_KEY: 'test-srk',
  HYPERCLI_API_KEY: 'hyper_api_test',
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

  it('should throw when HYPERCLI_API_KEY is missing', () => {
    const { HYPERCLI_API_KEY, ...env } = VALID_ENV;
    expect(() => validateEnv(env)).toThrow(/HYPERCLI_API_KEY/);
  });

  it('should throw when NEXT_PUBLIC_SUPABASE_URL is not https', () => {
    const env = { ...VALID_ENV, NEXT_PUBLIC_SUPABASE_URL: 'http://insecure.supabase.co' };
    expect(() => validateEnv(env)).toThrow(/https/);
  });

  it('should collect multiple errors', () => {
    expect(() => validateEnv({})).toThrow(/failed \(4\)/);
  });
});
