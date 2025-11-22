/**
 * Mock Consciousness Data Generator
 * Generates realistic sample data for testing/demo purposes
 */

import type { ConsciousnessState } from "@/types/consciousness";

// Generate mock states over the last 7 days
export function generateMockStates(userId: string, days: number = 7): ConsciousnessState[] {
  const states: ConsciousnessState[] = [];
  const now = new Date();
  
  // Generate states over the time period
  const statesPerDay = 8; // ~8 states per day (every 3 hours)
  const totalStates = days * statesPerDay;
  
  for (let i = 0; i < totalStates; i++) {
    const hoursAgo = (totalStates - i) * 3; // 3 hours apart
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    
    // Create a pattern: more chaos in morning/evening, more glow during midday
    const hourOfDay = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // Determine base state type
    let stateType: "chaos" | "glow" | "neutral";
    let intensity: number;
    let sentimentScore: number;
    
    // Pattern: Weekends tend to have more glow, weekdays more chaos
    // Morning (6-9) and evening (18-21) tend to have more chaos
    // Midday (10-15) tends to have more glow
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend - more glow
      if (hourOfDay >= 10 && hourOfDay <= 15) {
        stateType = "glow";
        intensity = 0.6 + Math.random() * 0.3;
        sentimentScore = 0.4 + Math.random() * 0.4;
      } else if (hourOfDay >= 6 && hourOfDay <= 9) {
        stateType = "neutral";
        intensity = 0.4 + Math.random() * 0.2;
        sentimentScore = -0.1 + Math.random() * 0.2;
      } else {
        stateType = Math.random() > 0.6 ? "glow" : "neutral";
        intensity = 0.5 + Math.random() * 0.3;
        sentimentScore = 0.2 + Math.random() * 0.3;
      }
    } else {
      // Weekday - more chaos during stressful times
      if (hourOfDay >= 6 && hourOfDay <= 9) {
        // Morning rush - chaos
        stateType = "chaos";
        intensity = 0.5 + Math.random() * 0.3;
        sentimentScore = -0.4 - Math.random() * 0.3;
      } else if (hourOfDay >= 18 && hourOfDay <= 21) {
        // Evening - mix of chaos and neutral
        stateType = Math.random() > 0.5 ? "chaos" : "neutral";
        intensity = 0.4 + Math.random() * 0.3;
        sentimentScore = -0.2 + Math.random() * 0.2;
      } else if (hourOfDay >= 10 && hourOfDay <= 15) {
        // Midday - more glow
        stateType = Math.random() > 0.4 ? "glow" : "neutral";
        intensity = 0.5 + Math.random() * 0.3;
        sentimentScore = 0.2 + Math.random() * 0.4;
      } else {
        // Night/early morning - neutral
        stateType = "neutral";
        intensity = 0.3 + Math.random() * 0.3;
        sentimentScore = -0.1 + Math.random() * 0.2;
      }
    }
    
    // Add some variation
    if (Math.random() > 0.85) {
      // Occasional strong states
      intensity = Math.min(1.0, intensity + 0.2);
      if (stateType === "glow") {
        sentimentScore = Math.min(1.0, sentimentScore + 0.3);
      } else if (stateType === "chaos") {
        sentimentScore = Math.max(-1.0, sentimentScore - 0.3);
      }
    }
    
    // Generate appropriate indicators
    const chaosIndicators = stateType === "chaos" 
      ? ["anxious", "worried", "stress", "overwhelmed"].slice(0, Math.floor(Math.random() * 3) + 1)
      : [];
    const glowIndicators = stateType === "glow"
      ? ["present", "aware", "peace", "calm", "grounded"].slice(0, Math.floor(Math.random() * 3) + 1)
      : [];
    
    states.push({
      id: `mock-state-${i}`,
      user_id: userId,
      timestamp: timestamp.toISOString(),
      state_type: stateType,
      intensity: Math.round(intensity * 100) / 100,
      sentiment_score: Math.round(sentimentScore * 100) / 100,
      context: `Mock state ${i + 1}`,
      chaos_indicators: chaosIndicators,
      glow_indicators: glowIndicators,
      created_at: timestamp.toISOString(),
    });
  }
  
  return states.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Generate a current state based on time of day
export function generateMockCurrentState(userId: string): ConsciousnessState {
  const now = new Date();
  const hour = now.getHours();
  
  let stateType: "chaos" | "glow" | "neutral";
  let intensity: number;
  let sentimentScore: number;
  
  if (hour >= 6 && hour <= 9) {
    stateType = Math.random() > 0.4 ? "chaos" : "neutral";
    intensity = 0.5 + Math.random() * 0.3;
    sentimentScore = -0.2 + Math.random() * 0.2;
  } else if (hour >= 10 && hour <= 15) {
    stateType = Math.random() > 0.5 ? "glow" : "neutral";
    intensity = 0.6 + Math.random() * 0.3;
    sentimentScore = 0.3 + Math.random() * 0.4;
  } else {
    stateType = "neutral";
    intensity = 0.4 + Math.random() * 0.3;
    sentimentScore = -0.1 + Math.random() * 0.3;
  }
  
  return {
    id: `mock-current-${Date.now()}`,
    user_id: userId,
    timestamp: now.toISOString(),
    state_type: stateType,
    intensity: Math.round(intensity * 100) / 100,
    sentiment_score: Math.round(sentimentScore * 100) / 100,
    context: "Current state",
    chaos_indicators: stateType === "chaos" ? ["anxious", "stress"] : [],
    glow_indicators: stateType === "glow" ? ["present", "calm"] : [],
    created_at: now.toISOString(),
  };
}

// Simulate real-time state updates
export function simulateStateUpdates(
  callback: (state: ConsciousnessState) => void,
  interval: number = 5000
): () => void {
  const states: ConsciousnessState[] = [];
  let currentIndex = 0;
  
  // Generate a sequence of states that transition smoothly
  const stateSequence: Array<{type: "chaos" | "glow" | "neutral", intensity: number}> = [
    { type: "neutral", intensity: 0.5 },
    { type: "chaos", intensity: 0.6 },
    { type: "chaos", intensity: 0.7 },
    { type: "neutral", intensity: 0.5 },
    { type: "glow", intensity: 0.6 },
    { type: "glow", intensity: 0.8 },
    { type: "glow", intensity: 0.7 },
    { type: "neutral", intensity: 0.5 },
  ];
  
  const intervalId = setInterval(() => {
    const current = stateSequence[currentIndex % stateSequence.length];
    const now = new Date();
    
    const state: ConsciousnessState = {
      id: `simulated-${Date.now()}`,
      user_id: "demo-user",
      timestamp: now.toISOString(),
      state_type: current.type,
      intensity: current.intensity + (Math.random() - 0.5) * 0.1, // Add slight variation
      sentiment_score: current.type === "chaos" 
        ? -0.5 - Math.random() * 0.3
        : current.type === "glow"
        ? 0.5 + Math.random() * 0.3
        : -0.1 + Math.random() * 0.2,
      context: `Simulated update ${currentIndex + 1}`,
      chaos_indicators: current.type === "chaos" ? ["anxious", "worried"] : [],
      glow_indicators: current.type === "glow" ? ["present", "peace"] : [],
      created_at: now.toISOString(),
    };
    
    callback(state);
    currentIndex++;
  }, interval);
  
  return () => clearInterval(intervalId);
}

