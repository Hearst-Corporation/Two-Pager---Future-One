# Testing — Prese Hub

## Where tests live

| Kind           | Path                                  | Runner     |
| -------------- | ------------------------------------- | ---------- |
| Unit / integration (no browser) | `test/**/*.spec.{js,jsx}` | Vitest |
| End-to-end (real browser)       | `tests/e2e/**/*.spec.ts`  | Playwright |

The split keeps fast pure-logic tests separate from slow browser tests so `npm test` stays under a few seconds during normal dev.

## Running

```bash
npm test                 # vitest run — full unit suite, exits when done
npm run test:watch       # vitest in watch mode
npm run test:coverage    # vitest with v8 coverage (html report in ./coverage/)
npm run test:e2e         # playwright — boots dev server on :5005 then runs specs
npm run test:e2e:ui      # playwright UI mode (manual debugging)
```

`npm run test:e2e` starts the Next.js dev server automatically (`reuseExistingServer` is on outside of CI, so if you already have `npm run dev` running it will be reused).

## Conventions

- **Filename suffix**: `.spec.js` for unit, `.spec.ts` for E2E. Stick to `.spec` (not `.test`) so suite intent is uniform.
- **One file per module**: `lib/foo.js` → `test/lib/foo.spec.js`. Mirror the source tree.
- **No globals**: `vitest.config.js` sets `globals: false`. Import `describe`, `it`, `expect`, `vi` explicitly.
- **Pure first**: prefer tests on pure functions (no Supabase, no `fetch`). Hit I/O only when you can mock cleanly.
- **`@/` alias** resolves to repo root in both Vitest and Next, so `import x from '@/lib/foo'` works in tests.

## Vitest vs Playwright — when to use which

| Question                                                      | Tool       |
| ------------------------------------------------------------- | ---------- |
| Does this formula compute the right number?                   | Vitest     |
| Does this Zod schema reject bad input?                        | Vitest     |
| Does this React component render the right text given props?  | Vitest + `@testing-library/react` (set `environment: 'jsdom'` per-file via `// @vitest-environment jsdom`) |
| Does navigating from / to /admin/login work in a real browser? | Playwright |
| Does the cockpit show the right chart after user clicks X?    | Playwright |

If a test needs to hit `/api/...` and exercise routing + middleware end-to-end, it's Playwright. If it can be unit-tested by importing the route handler and calling it with a mocked `NextRequest`, it's Vitest.

## Mocking Supabase

Mock the admin client at the module boundary so route handlers and lib functions remain unmodified:

```js
import { vi } from 'vitest';

vi.mock('@/lib/supabase-admin', () => ({
  getAdminClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: '1', name: 'fixture' }, error: null }),
    }),
  }),
}));
```

For the server-side helper:

```js
vi.mock('@/lib/supabase-server', () => ({
  getServerClient: () => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  }),
}));
```

## Mocking the OpenAI / Anthropic SDK

The advisor route (A4) will need this pattern. Mock the constructor so no network call ever fires:

```js
import { vi } from 'vitest';

vi.mock('openai', () => {
  const create = vi.fn().mockResolvedValue({
    choices: [{ message: { role: 'assistant', content: 'mocked' } }],
    usage: { prompt_tokens: 10, completion_tokens: 5 },
  });
  return {
    default: class OpenAI {
      chat = { completions: { create } };
    },
    // exposed for assertions: imported as `import { __create } from 'openai'` in tests
    __create: create,
  };
});

// For streaming, return an async iterable:
//   create.mockResolvedValue({ [Symbol.asyncIterator]: async function* () { yield chunk; } });
```

Same shape for `@anthropic-ai/sdk` — mock the `messages.create` method on the default export.

## Coverage thresholds — aspirational

Not enforced in CI yet. Aim for, over time:

| Layer                  | Target |
| ---------------------- | ------ |
| `lib/hearst-calculations.js` | 95% line / 90% branch |
| `lib/**` (other)       | 80% line |
| `app/api/**`           | 70% line (route handlers, after Supabase mocks land) |
| `middleware.js`        | 100% branch (small surface, every redirect path) |

`npm run test:coverage` writes an HTML report to `./coverage/index.html`.

## Test ownership map (current sprint)

| File                                  | Owner | Notes |
| ------------------------------------- | ----- | ----- |
| `test/lib/hearst-calculations.spec.js` | A8   | Pure math, foundational |
| `test/middleware.spec.js`              | A2   | Auth + redirect paths   |
| `test/validators/hearst.spec.js`       | A3   | Zod schemas             |
| `test/api/advisor.spec.js`             | A4   | Needs the OpenAI mock above |
| `tests/e2e/login.spec.ts`              | A8   | Smoke for / and /admin  |

Other agents add their files into the listed paths; the plumbing is already configured.
