import { useCallback, useRef, useEffect } from "react";

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

export function useSwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  velocityThreshold = 0.3,
}: SwipeGestureOptions) {
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(
    null
  );
  const touchEnd = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      touchEnd.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      const deltaX = touchEnd.current.x - touchStart.current.x;
      const deltaY = touchEnd.current.y - touchStart.current.y;
      const deltaTime = touchEnd.current.time - touchStart.current.time;
      const velocity = Math.abs(deltaX) / deltaTime;

      // Check if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && velocity > velocityThreshold) {
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      touchStart.current = null;
      touchEnd.current = null;
    },
    [threshold, velocityThreshold, onSwipeLeft, onSwipeRight]
  );

  const attachGestures = useCallback(
    (element: HTMLElement) => {
      element.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      element.addEventListener("touchend", handleTouchEnd, { passive: true });

      return () => {
        element.removeEventListener("touchstart", handleTouchStart);
        element.removeEventListener("touchend", handleTouchEnd);
      };
    },
    [handleTouchStart, handleTouchEnd]
  );

  return { attachGestures };
}
