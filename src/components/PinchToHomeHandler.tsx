// src/components/PinchToHomeHandler.tsx
import { useFourFingerPinchToHome } from "@/hooks/useFourFingerPinchToHome";

export function PinchToHomeHandler() {
  useFourFingerPinchToHome();
  return null; // no UI, just logic
}