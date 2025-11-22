// =======================================================
// 🎭 STAGE MANAGER'S CONTROL PANEL - Orb Interaction Logic
// =======================================================
// The stage manager controls all the special effects and interactions
// with the magical orb on stage - clicks, holds, dictation triggers

import { useState, useRef } from 'react';
import { useDictation } from '@/services/dictation';

interface UseOrbHandlersProps {
  setShowCarousel: (show: boolean) => void;
  setInput: (input: string) => void;
}

export const useOrbHandlers = ({ setShowCarousel, setInput }: UseOrbHandlersProps) => {
  // -----------------------------
  // 🎭 Stage Manager's Notes - Orb State
  // -----------------------------
  const [isOrbHolding, setIsOrbHolding] = useState(false);
  const orbHoldTimeout = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------
  // 🎭 Stenographer Integration - Voice Dictation
  // -----------------------------
  const { isDictating, isListening, startDictation, stopDictation } = useDictation({ setInput });

  // -----------------------------
  // 🎭 Orb Control Functions
  // -----------------------------
  const handleOrbMouseDown = () => {
    orbHoldTimeout.current = setTimeout(() => {
      // Long hold detected → open carousel
      setIsOrbHolding(true);
      setShowCarousel(true);
      orbHoldTimeout.current = null;
    }, 600);
  };

  const handleOrbMouseUp = () => {
    if (orbHoldTimeout.current) {
      clearTimeout(orbHoldTimeout.current);
      orbHoldTimeout.current = null;

      // Short click detected → trigger dictation
      if (!isDictating) {
        startDictation();
      } else {
        stopDictation();
      }
    }
    setIsOrbHolding(false);
  };

  // -----------------------------
  // 🎭 Return Control Panel
  // -----------------------------
  return {
    // State
    isOrbHolding,
    isDictating,
    isListening,
    
    // Handlers
    handleOrbMouseDown,
    handleOrbMouseUp,
    
    // Direct dictation controls (if needed elsewhere)
    startDictation,
    stopDictation,
  };
};