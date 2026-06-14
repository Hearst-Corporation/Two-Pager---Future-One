// lib/api-errors.js
// Generic API error helpers — prevent raw DB error messages from leaking to clients.

import { NextResponse } from 'next/server';

/**
 * Returns a generic 500 database_error response.
 * Logs the real error server-side (without sensitive data).
 */
export function dbErrorResponse(error, logLabel) {
  // eslint-disable-next-line no-console
  console.warn(logLabel, error?.message || error);
  return NextResponse.json({ error: 'database_error' }, { status: 500 });
}

/**
 * Returns a generic 404 not_found response.
 */
export function notFoundResponse() {
  return NextResponse.json({ error: 'not_found' }, { status: 404 });
}
