// components/Orb/OrbBackdrop.tsx
import React from "react";
import { FluidGlowingOrb } from "./FluidGlowingOrb"; // adjust path if needed

type OrbBackdropProps = {
  size?: number;
  colors?: string[];
  className?: string;
};

const OrbBackdrop: React.FC<OrbBackdropProps> = ({
  size = 240,
  colors = ["#fffacd", "#ffd700"],
  className = "",
}) => {
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-0 bg-transparent ${className}`}
      style={{ filter: "blur(4px)" }}
    >
      <FluidGlowingOrb
        className="transition duration-300 hover:scale-105 dimensional-fade"
        size={size}
        colors={colors}
      />
    </div>
  );
};

export default OrbBackdrop;
