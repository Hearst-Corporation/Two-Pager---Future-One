// lib/retry-with-backoff.js
// Retry a promise-returning function with exponential backoff.
// Only retries on retryable errors (network, timeout, 429, 500, 502, 503).

const RETRYABLE_ERRORS = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPROTO',
  'ERR_STREAM_DESTROYED',
]);

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function isRetryableError(err) {
  if (!err) return false;

  // Network / system errors
  if (RETRYABLE_ERRORS.has(err.code)) return true;

  // HTTP status codes
  const status = err.status || err.statusCode || err.response?.status;
  if (status && RETRYABLE_STATUS_CODES.has(Number(status))) return true;

  // OpenAI specific error types
  const type = err.type || err.error?.type;
  if (type === 'rate_limit_error' || type === 'api_error' || type === 'timeout') return true;

  // Message-based heuristics
  const msg = String(err.message || err.error?.message || '').toLowerCase();
  if (
    msg.includes('timeout') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('temporary') ||
    msg.includes('overloaded') ||
    msg.includes('internal server error') ||
    msg.includes('bad gateway') ||
    msg.includes('service unavailable')
  ) {
    return true;
  }

  return false;
}

/**
 * Retry an async function with exponential backoff.
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} options
 * @param {number} options.maxRetries - Max retry attempts (default: 3)
 * @param {number} options.baseDelayMs - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelayMs - Max delay in ms (default: 30000)
 * @param {Function} options.onRetry - Callback(err, attempt) called on each retry
 * @param {AbortSignal} options.signal - Abort signal to cancel retries
 * @returns {Promise} - Result of fn
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    onRetry,
    signal,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new Error('Retry aborted');
    }

    try {
      return await fn();
    } catch (err) {
      lastError = err;

      // Don't retry on last attempt
      if (attempt >= maxRetries) break;

      // Don't retry non-retryable errors
      if (!isRetryableError(err)) throw err;

      // Calculate delay: baseDelay * 2^attempt + jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelayMs
      );

      if (onRetry) {
        try { onRetry(err, attempt + 1); } catch { /* noop */ }
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
