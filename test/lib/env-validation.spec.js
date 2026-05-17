import { describe, it, expect } from 'vitest';
import { validateEnv } from '@/lib/env-validation';

describe('env-validation', () => {
  it('should pass when all required variables are present', () => {
    const env = {
      SUPABASE_SERVICE_ROLE_KEY: 'test-srk',
      ANTHROPIC_API_KEY: 'sk-ant-test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    };
    expect(() => validateEnv(env)).not.toThrow();
  });

  it('should throw when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    const env = {
      ANTHROPIC_API_KEY: 'sk-ant-test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    };
    expect(() => validateEnv(env)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it('should throw when ANTHROPIC_API_KEY is missing', () => {
    const env = {
      SUPABASE_SERVICE_ROLE_KEY: 'test-srk',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    };
    expect(() => validateEnv(env)).toThrow(/ANTHROPIC_API_KEY/);
  });

  it('should throw when ANTHROPIC_API_KEY has wrong format', () => {
    const env = {
      SUPABASE_SERVICE_ROLE_KEY: 'test-srk',
      ANTHROPIC_API_KEY: 'not_an_anthropic_key',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    };
    expect(() => validateEnv(env)).toThrow(/sk-ant-/);
  });

  it('should throw when NEXT_PUBLIC_SUPABASE_URL is not https', () => {
    const env = {
      SUPABASE_SERVICE_ROLE_KEY: 'test-srk',
      ANTHROPIC_API_KEY: 'sk-ant-test',
      NEXT_PUBLIC_SUPABASE_URL: 'http://insecure.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    };
    expect(() => validateEnv(env)).toThrow(/https/);
  });

  it('should collect multiple errors', () => {
    expect(() => validateEnv({})).toThrow(/failed \(4\)/);
  });
});
