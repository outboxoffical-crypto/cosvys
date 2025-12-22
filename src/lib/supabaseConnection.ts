import { supabase } from "@/integrations/supabase/client";

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastCheck: number;
}

const state: ConnectionState = {
  isConnected: false,
  isReconnecting: false,
  lastCheck: 0,
};

const CHECK_INTERVAL = 30000; // 30 seconds minimum between checks
const HEALTH_TIMEOUT = 10000; // 10 seconds timeout for health check

/**
 * Check if Supabase backend is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    // Create a simple timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), HEALTH_TIMEOUT);
    });

    // Use auth.getSession as a lightweight health check
    const sessionPromise = supabase.auth.getSession();
    
    // Race between session check and timeout
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    
    // If we got here, connection is healthy (even if session is null)
    state.isConnected = true;
    state.lastCheck = Date.now();
    return true;
  } catch (err: any) {
    console.warn("Backend health check failed:", err?.message || err);
    state.isConnected = false;
    return false;
  }
}

/**
 * Ensure backend is ready before making queries
 * Returns true if ready, false if not reachable after retries
 */
export async function ensureBackendReady(
  onReconnecting?: (message: string) => void
): Promise<boolean> {
  // Skip if recently checked and connected
  if (state.isConnected && Date.now() - state.lastCheck < CHECK_INTERVAL) {
    return true;
  }

  // Prevent concurrent reconnection attempts
  if (state.isReconnecting) {
    // Wait for ongoing reconnection
    await new Promise(resolve => setTimeout(resolve, 1000));
    return state.isConnected;
  }

  state.isReconnecting = true;

  const maxAttempts = 4;
  const delayMs = 2500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onReconnecting?.(`Connecting to server (attempt ${attempt}/${maxAttempts})…`);

    const isHealthy = await checkBackendHealth();
    
    if (isHealthy) {
      state.isReconnecting = false;
      onReconnecting?.("Connected!");
      return true;
    }

    if (attempt < maxAttempts) {
      onReconnecting?.(`Retrying in ${delayMs / 1000}s…`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  state.isReconnecting = false;
  return false;
}

/**
 * Force refresh the auth session
 * Call this on app load to ensure fresh tokens
 */
export async function refreshSession(): Promise<{
  success: boolean;
  hasSession: boolean;
  error?: string;
}> {
  try {
    // First check if we have a session
    const { data: { session }, error: getError } = await supabase.auth.getSession();

    if (getError) {
      console.error("Error getting session:", getError);
      return { success: false, hasSession: false, error: getError.message };
    }

    if (!session) {
      return { success: true, hasSession: false };
    }

    // Try to refresh the session
    const { data, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.error("Error refreshing session:", refreshError);
      // If refresh fails, sign out to force clean state
      await supabase.auth.signOut();
      return { success: false, hasSession: false, error: refreshError.message };
    }

    return { success: true, hasSession: !!data.session };
  } catch (err: any) {
    console.error("Session refresh exception:", err);
    return { success: false, hasSession: false, error: err.message };
  }
}

/**
 * Clear all local auth state and force fresh login
 */
export async function clearAuthState(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore errors during sign out
  }
  
  // Clear any cached storage
  try {
    localStorage.removeItem('sb-zowvdfoqarppwqvsvcjk-auth-token');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Initialize connection on app load
 * Should be called once when the app starts
 */
export async function initializeConnection(
  onStatus?: (message: string) => void
): Promise<{
  backendReady: boolean;
  hasSession: boolean;
}> {
  onStatus?.("Checking connection…");

  // Check backend health first
  const backendReady = await ensureBackendReady(onStatus);
  
  if (!backendReady) {
    return { backendReady: false, hasSession: false };
  }

  onStatus?.("Refreshing session…");
  
  // Refresh session to ensure fresh tokens
  const { hasSession } = await refreshSession();

  return { backendReady: true, hasSession };
}

/**
 * Get connection state
 */
export function getConnectionState(): ConnectionState {
  return { ...state };
}

/**
 * Mark connection as active (call after successful query)
 */
export function markConnectionActive(): void {
  state.isConnected = true;
  state.lastCheck = Date.now();
}
