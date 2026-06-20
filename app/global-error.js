'use client';

import './globals.css';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'var(--font-sans)',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--color-error-bg)',
          color: 'var(--color-error-text)',
          minHeight: '100dvh',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-error-text)' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--color-error-text-muted)', marginBottom: '1.5rem' }}>
          An unexpected error occurred. The team has been notified.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--color-error-accent)',
            color: 'var(--color-error-accent-ink)',
            fontWeight: 600,
            border: 'none',
            borderRadius: 'var(--color-error-radius)',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
