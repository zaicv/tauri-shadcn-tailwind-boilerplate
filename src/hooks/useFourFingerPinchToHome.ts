import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useFourFingerPinchToHome() {
  const navigate = useNavigate();

  useEffect(() => {
    let initialDistance = 0;
    let gestureStarted = false;

    const getAverageDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      let totalDist = 0;
      for (let i = 0; i < touches.length; i++) {
        for (let j = i + 1; j < touches.length; j++) {
          const dx = touches[i].clientX - touches[j].clientX;
          const dy = touches[i].clientY - touches[j].clientY;
          totalDist += Math.sqrt(dx * dx + dy * dy);
        }
      }
      const pairCount = (touches.length * (touches.length - 1)) / 2;
      return totalDist / pairCount;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 4) {
        gestureStarted = true;
        initialDistance = getAverageDistance(e.touches);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!gestureStarted || e.touches.length < 4) return;
      const currentDistance = getAverageDistance(e.touches);
      if (initialDistance - currentDistance > 50) {
        gestureStarted = false;
        navigate("/");
      }
    };

    const handleTouchEnd = () => {
      gestureStarted = false;
      initialDistance = 0;
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate]);
}
