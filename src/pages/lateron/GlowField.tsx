import { useState } from "react";
import GlowField from "@/components/GlowField/GlowField";

export default function GlowFieldPage() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="w-full h-screen overflow-hidden">
      <GlowField
        isVisible={isVisible}
        onClose={() => setIsVisible(false)}
        mode="fullscreen"
      />
    </div>
  );
}

