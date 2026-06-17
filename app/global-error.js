'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          textAlign: 'center',
          background: '#0A0A0A',
          color: '#F5F5F5',
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#F5F5F5' }}>
          Something went wrong
        </h1>
        <p style={{ color: 'rgba(245, 245, 245, 0.6)', marginBottom: '1.5rem' }}>
          An unexpected error occurred. The team has been notified.
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#D4AF37',
            color: '#0A0A0A',
            fontWeight: 600,
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
