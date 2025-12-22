import { useState, useCallback, useRef } from "react";

interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  timeoutMs?: number;
}

interface RetryState {
  isRetrying: boolean;
  attempt: number;
  message: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 2000,
  timeoutMs: 10000,
};

/**
 * Hook for handling backend cold start retries with "Waking up server" feedback.
 * Implements automatic retry logic with soft loading messages.
 */
export function useRetryWithWakeup() {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attempt: 0,
    message: "",
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Execute an async operation with automatic retry on failure.
   * Shows "Waking up server..." message during retries instead of errors.
   */
  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options: RetryOptions = {}
    ): Promise<{ data: T | null; error: Error | null; wasRetried: boolean }> => {
      const { maxAttempts, delayMs, timeoutMs } = { ...DEFAULT_OPTIONS, ...options };

      let lastError: Error | null = null;
      let wasRetried = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        // Create abort controller for timeout
        abortControllerRef.current = new AbortController();

        // Show waking up message on retry attempts
        if (attempt > 1) {
          wasRetried = true;
          setRetryState({
            isRetrying: true,
            attempt,
            message: "Waking up server… please wait",
          });
        }

        try {
          // Race between operation and timeout
          const result = await Promise.race([
            operation(),
            new Promise<never>((_, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error("Request timeout"));
              }, timeoutMs);

              // Clean up timeout if abort is called
              abortControllerRef.current?.signal.addEventListener("abort", () => {
                clearTimeout(timeoutId);
              });
            }),
          ]);

          // Success - clear retry state
          setRetryState({
            isRetrying: false,
            attempt: 0,
            message: "",
          });

          return { data: result, error: null, wasRetried };
        } catch (error: any) {
          lastError = error;
          console.log(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);

          // If this isn't the last attempt, wait before retrying
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
        }
      }

      // All retries failed
      setRetryState({
        isRetrying: false,
        attempt: 0,
        message: "",
      });

      return { data: null, error: lastError, wasRetried };
    },
    []
  );

  /**
   * Cancel any pending retry operation
   */
  const cancelRetry = useCallback(() => {
    abortControllerRef.current?.abort();
    setRetryState({
      isRetrying: false,
      attempt: 0,
      message: "",
    });
  }, []);

  return {
    retryState,
    executeWithRetry,
    cancelRetry,
  };
}

/**
 * Standalone function for one-off retry operations (useful in useEffect)
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: Error | null }> {
  const { maxAttempts = 3, delayMs = 2000, timeoutMs = 10000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
        }),
      ]);

      return { data: result, error: null };
    } catch (error: any) {
      lastError = error;
      console.log(`Retry attempt ${attempt}/${maxAttempts} failed:`, error.message);

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return { data: null, error: lastError };
}
