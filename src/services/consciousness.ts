/**
 * Consciousness Service
 * Handles fetching and streaming consciousness state data from the API
 */

import { supabase } from "@/lib/supabaseClient";
// Re-export types for convenience
export type { ConsciousnessState, ConsciousnessStatistics, TimelineDataPoint } from "@/types/consciousness";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Analyze a message for consciousness state
 */
export async function analyzeConsciousnessState(
  message: string,
  userId: string,
  threadId?: string,
  messageId?: string,
  context?: string
): Promise<ConsciousnessState | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/consciousness/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        user_id: userId,
        thread_id: threadId,
        message_id: messageId,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.state || null;
  } catch (error) {
    console.error("Error analyzing consciousness state:", error);
    return null;
  }
}

/**
 * Get consciousness states for a user
 */
export async function getUserStates(
  userId: string,
  limit: number = 100,
  startTime?: string,
  stateType?: "chaos" | "glow" | "neutral"
): Promise<ConsciousnessState[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(startTime && { start_time: startTime }),
      ...(stateType && { state_type: stateType }),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/consciousness/states/${userId}?${params}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.states || [];
  } catch (error) {
    console.error("Error fetching user states:", error);
    return [];
  }
}

/**
 * Get current consciousness state for a user
 */
export async function getCurrentState(
  userId: string
): Promise<ConsciousnessState | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/consciousness/current/${userId}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.state || null;
  } catch (error) {
    console.error("Error fetching current state:", error);
    return null;
  }
}

/**
 * Get consciousness statistics for a user
 */
export async function getStatistics(
  userId: string,
  days: number = 30
): Promise<ConsciousnessStatistics | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/consciousness/statistics/${userId}?days=${days}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.statistics || null;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return null;
  }
}

/**
 * Get timeline data for visualization
 */
export async function getTimeline(
  userId: string,
  days: number = 7,
  interval: "hour" | "day" | "week" = "hour"
): Promise<TimelineDataPoint[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/consciousness/timeline/${userId}?days=${days}&interval=${interval}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.timeline || [];
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return [];
  }
}

/**
 * Subscribe to real-time consciousness state updates via Supabase
 */
export function subscribeToStates(
  userId: string,
  callback: (state: ConsciousnessState) => void
) {
  try {
    const channel = supabase
      .channel(`consciousness_states:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consciousness_states",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as ConsciousnessState);
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error("Error unsubscribing from states:", error);
      }
    };
  } catch (error) {
    console.error("Error setting up state subscription:", error);
    // Return a no-op cleanup function
    return () => {};
  }
}
