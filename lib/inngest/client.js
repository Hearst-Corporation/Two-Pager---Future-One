/**
 * lib/inngest/client.js
 *
 * Inngest client bootstrap for the Hearst Oracle project.
 * Loaded lazily — safe to import in any server context.
 *
 * If the `inngest` package is not installed, this module will throw at import
 * time; callers (oracle-refresh.js, route.js) catch this and degrade gracefully.
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id:         'hearst-oracle',
  signingKey: process.env.INNGEST_SIGNING_KEY,
});
