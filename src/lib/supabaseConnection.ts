/**
 * Simplified Supabase connection utilities
 * All operations are non-blocking and fail gracefully
 */

import { supabase } from "@/integrations/supabase/client";

interface ConnectionState {
  isConnected: boolean;
  lastCheck: number;
}

const state: ConnectionState = {
  isConnected: false,
  lastCheck: 0,
};

/**
 * Mark connection as active (call after successful Supabase operation)
 */
export function markConnectionActive(): void {
  state.isConnected = true;
  state.lastCheck = Date.now();
}

/**
 * Get current connection state (informational only, does not block)
 */
export function getConnectionState(): ConnectionState {
  return { ...state };
}

/**
 * Quick non-blocking health check
 * Returns immediately with best-effort result
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const timeout = new Promise<false>(resolve => 
      setTimeout(() => resolve(false), 3000)
    );
    
    const check = supabase.auth.getSession().then(() => {
      markConnectionActive();
      return true;
    });
    
    return await Promise.race([check, timeout]);
  } catch {
    return false;
  }
}

/**
 * Clear local auth state
 */
export async function clearAuthState(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore errors
  }
  
  try {
    localStorage.removeItem('sb-zowvdfoqarppwqvsvcjk-auth-token');
  } catch {
    // Ignore storage errors
  }
}
