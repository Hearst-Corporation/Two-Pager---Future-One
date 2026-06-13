// test/lib/env-validation.spec.js
import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../lib/env-validation.js';

const VALID_ENV = {
  SUPABASE_SERVICE_ROLE_KEY: 'sk-test-service',
  OPENAI_API_KEY: 'sk-test-openai',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-test',
};

describe('validateEnv', () => {
  it('should pass with all required vars', () => {
    expect(() => validateEnv(VALID_ENV)).not.toThrow();
  });

  it('should throw when OPENAI_API_KEY is missing', () => {
    const { OPENAI_API_KEY, ...env } = VALID_ENV;
    expect(() => validateEnv(env)).toThrow(/OPENAI_API_KEY/);
  });

  it('should throw when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    const { SUPABASE_SERVICE_ROLE_KEY, ...env } = VALID_ENV;
    expect(() => validateEnv(env)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});
