/**
 * Database connection retry utility with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Check if error is a retryable database error
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const retryableMessages = [
    'connection',
    'timeout',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'database',
    'pool',
    'socket',
  ];
  
  const message = error.message.toLowerCase();
  return retryableMessages.some((msg) => message.includes(msg.toLowerCase()));
}

/**
 * Execute a database operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }
      
      // Don't retry if we've exhausted all attempts
      if (attempt >= opts.maxRetries) {
        break;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier
      );
      
      console.warn(
        `Database operation failed (attempt ${attempt + 1}/${opts.maxRetries + 1}). ` +
        `Retrying in ${delay}ms...`,
        lastError.message
      );
      
      await sleep(delay);
    }
  }

  // All retries exhausted
  throw new Error(
    `Database operation failed after ${opts.maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Create a retry wrapper for a specific operation
 */
export function createRetryWrapper(options?: RetryOptions) {
  return <T>(operation: () => Promise<T>): Promise<T> => {
    return withRetry(operation, options);
  };
}

/**
 * Decorator-style retry for class methods
 */
export function withRetryDecorator(options?: RetryOptions) {
  return function <T>(
    target: unknown,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<T>>
  ) {
    const originalMethod = descriptor.value;
    
    if (originalMethod) {
      descriptor.value = async function (...args: unknown[]): Promise<T> {
        return withRetry(() => originalMethod.apply(this, args), options);
      };
    }
    
    return descriptor;
  };
}
