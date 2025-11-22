/**
 * Consciousness Types
 * Type definitions for consciousness state tracking
 */

export interface ConsciousnessState {
  id: string;
  user_id: string;
  thread_id?: string;
  message_id?: string;
  timestamp: string;
  state_type: "chaos" | "glow" | "neutral";
  intensity: number;
  sentiment_score?: number;
  context?: string;
  chaos_indicators?: string[];
  glow_indicators?: string[];
  created_at: string;
}

export interface ConsciousnessStatistics {
  total_states: number;
  chaos_count: number;
  glow_count: number;
  neutral_count: number;
  avg_intensity: number;
  avg_sentiment: number;
  chaos_percentage: number;
  glow_percentage: number;
}

export interface TimelineDataPoint {
  timestamp: string;
  avg_intensity: number;
  avg_sentiment: number;
  chaos_count: number;
  glow_count: number;
  neutral_count: number;
  total_count: number;
}

