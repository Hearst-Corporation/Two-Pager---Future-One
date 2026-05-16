// lib/validators/withValidation.js
// Thin Next.js App Router wrapper around a Zod schema.
//
// Usage:
//   import { withValidation } from '@/lib/validators/withValidation';
//   import { ScenarioCreateSchema } from '@/lib/validators/hearst';
//
//   export const POST = withValidation(ScenarioCreateSchema, async (req, parsed, context) => {
//     // parsed === the validated body
//     // context === the original Next.js route handler context (e.g. { params })
//     ...
//   });
//
// For PATCH handlers that accept a partial subset of the same schema:
//   export const PATCH = withValidationPartial(ScenarioCreateSchema, async (req, parsed, context) => { ... });
//
// On failure the wrapper short-circuits with a 400 JSON response:
//   { error: 'invalid_json' }                          -> body was not valid JSON
//   { error: 'validation_failed', issues: [...] }      -> body failed schema validation
//
// GET handlers (no body) are NOT wrapped — leave them as-is.

import { NextResponse } from 'next/server';

function jsonError(status, payload) {
  return NextResponse.json(payload, { status });
}

async function parseJsonBody(req) {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return { ok: false };
  }
}

function makeWrapper(getSchema) {
  return function withValidationInner(schema, handler) {
    const effective = getSchema(schema);
    return async function wrapped(req, context) {
      const parsedJson = await parseJsonBody(req);
      if (!parsedJson.ok) {
        return jsonError(400, { error: 'invalid_json' });
      }
      const result = effective.safeParse(parsedJson.body);
      if (!result.success) {
        return jsonError(400, {
          error: 'validation_failed',
          issues: result.error.issues,
        });
      }
      return handler(req, result.data, context);
    };
  };
}

// Full-body validation: required fields must be present.
export const withValidation = makeWrapper((schema) => schema);

// Partial-body validation: every field becomes optional (.partial()).
// Strict-mode behaviour from the underlying object schema is preserved by
// .partial() — unknown keys still fail.
export const withValidationPartial = makeWrapper((schema) => {
  if (typeof schema?.partial !== 'function') {
    throw new Error('withValidationPartial requires a Zod object schema');
  }
  return schema.partial();
});
