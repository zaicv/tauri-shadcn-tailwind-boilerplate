// components/FluidGlowingOrb.tsx
import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

// Helper function to validate and normalize colors
const normalizeColors = (colors: string[] | undefined | null): string[] => {
  if (!colors || !Array.isArray(colors) || colors.length === 0) {
    console.warn("⚠️ Invalid colors array, using defaults");
    return ["#8b5cf6", "#6366f1"]; // Default purple gradient
  }

  // Ensure we have at least 2 colors
  const validColors = colors
    .filter((c) => c && typeof c === "string" && c.trim().length > 0)
    .map((c) => c.trim());

  if (validColors.length === 0) {
    console.warn("⚠️ No valid colors found, using defaults");
    return ["#8b5cf6", "#6366f1"];
  }

  if (validColors.length === 1) {
    // If only one color, duplicate it for gradient
    return [validColors[0], validColors[0]];
  }

  return validColors.slice(0, 2); // Take first 2 colors
};

export function FluidGlowingOrb({
  colors,
  size,
  className = "",
}: {
  colors: string[];
  size: number;
  className?: string;
}) {
  const padding = 60;
  
  // Normalize and validate colors
  const normalizedColors = useMemo(() => {
    const norm = normalizeColors(colors);
    console.log("🎨 FluidGlowingOrb colors:", { input: colors, normalized: norm });
    return norm;
  }, [colors]);

  // Generate a unique ID for this SVG instance
  const svgId = useMemo(() => `orb-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <svg
      className={className}
      width={size + padding * 2}
      height={size + padding * 2}
      viewBox={`-${padding} -${padding} ${size + padding * 2} ${size + padding * 2}`}
      style={{ display: "block", overflow: "visible" }}
    >
      <FluidLayer
        svgId={svgId}
        size={size}
        baseFrequency={0.025}
        amplitude={0.015}
        scale={25}
        colors={normalizedColors}
        shape="circle"
        phaseOffset={0}
        animationDuration={7}
      />
      <FluidLayer
        svgId={svgId}
        size={size}
        baseFrequency={0.03}
        amplitude={0.02}
        scale={15}
        colors={normalizedColors}
        shape="ellipse"
        phaseOffset={10}
        animationDuration={6}
      />
      <FluidLayer
        svgId={svgId}
        size={size}
        baseFrequency={0.04}
        amplitude={0.025}
        scale={10}
        colors={normalizedColors}
        shape="polygon"
        phaseOffset={20}
        animationDuration={5}
      />
    </svg>
  );
}

function FluidLayer({
  svgId,
  size,
  baseFrequency,
  amplitude,
  scale,
  colors,
  shape = "circle",
  phaseOffset = 0,
  animationDuration = 6,
}: {
  svgId: string;
  size: number;
  baseFrequency: number;
  amplitude: number;
  scale: number;
  colors: string[];
  shape?: "circle" | "ellipse" | "polygon";
  phaseOffset?: number;
  animationDuration?: number;
}) {
  const turbulenceRef = useRef<SVGFEImageElement | null>(null);
  
  // Ensure colors are valid
  const safeColors = useMemo(() => {
    if (!colors || colors.length < 2) {
      return ["#8b5cf6", "#6366f1"];
    }
    return colors.map((c) => c || "#8b5cf6");
  }, [colors]);
  
  // Create unique IDs for this SVG instance
  const filterId = `${svgId}-filter-${scale}`;
  const gradientId = `${svgId}-gradient-${scale}`;

  useEffect(() => {
    let frameId: number;
    let phase = phaseOffset;

    const animateTurbulence = () => {
      phase += 0.02;
      const freqX = baseFrequency + amplitude * Math.sin(phase);
      const freqY = baseFrequency + amplitude * Math.cos(phase);

      if (turbulenceRef.current) {
        turbulenceRef.current.setAttribute("baseFrequency", `${freqX} ${freqY}`);
      }

      frameId = requestAnimationFrame(animateTurbulence);
    };

    animateTurbulence();
    return () => cancelAnimationFrame(frameId);
  }, [baseFrequency, amplitude, phaseOffset]);

  const center = size / 2;
  const radius = center - 20;

  const shapes = {
    circle: (
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill={`url(#${gradientId})`}
        filter={`url(#${filterId})`}
        initial={{ scale: 0.95, opacity: 0.85 }}
        animate={{
          scale: [1, 1 + amplitude * 10, 1],
          opacity: [1, 0.85, 1],
          rotate: [0, 3, 0],
        }}
        transition={{
          duration: animationDuration,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    ),
    ellipse: (
      <motion.ellipse
        cx={center}
        cy={center}
        rx={radius * 0.85}
        ry={radius * 0.65}
        fill={`url(#${gradientId})`}
        filter={`url(#${filterId})`}
        initial={{ scale: 0.9, opacity: 0.75 }}
        animate={{
          scale: [1, 1 + amplitude * 12, 1],
          opacity: [1, 0.7, 1],
          rotate: [0, -4, 0],
        }}
        transition={{
          duration: animationDuration * 0.9,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    ),
    polygon: (
      <motion.polygon
        points={`
          ${center},${center - radius}
          ${center + radius * 0.87},${center - radius * 0.5}
          ${center + radius * 0.87},${center + radius * 0.5}
          ${center},${center + radius}
          ${center - radius * 0.87},${center + radius * 0.5}
          ${center - radius * 0.87},${center - radius * 0.5}
        `}
        fill={`url(#${gradientId})`}
        filter={`url(#${filterId})`}
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{
          scale: [1, 1 + amplitude * 8, 1],
          opacity: [1, 0.6, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: animationDuration * 1.2,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    ),
  };

  return (
    <>
      <defs>
        <filter
          id={filterId}
          x="0"
          y="0"
          width="100%"
          height="100%"
          primitiveUnits="userSpaceOnUse"
        >
          <feTurbulence
            ref={turbulenceRef}
            type="fractalNoise"
            baseFrequency={`${baseFrequency} ${baseFrequency}`}
            numOctaves="2"
            result="turbulence"
          />
          <feDisplacementMap
            in2="turbulence"
            in="SourceGraphic"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="30%" stopColor={safeColors[0]} stopOpacity="1" />
          <stop offset="70%" stopColor={safeColors[1]} stopOpacity="1" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>

      {shapes[shape]}
    </>
  );
}