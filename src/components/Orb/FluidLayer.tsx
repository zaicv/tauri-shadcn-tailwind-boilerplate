import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

type FluidLayerProps = {
  size: number;
  baseFrequency: number;
  amplitude: number;
  scale: number;
  colors: string[];
  shape?: "circle" | "ellipse" | "polygon";
  phaseOffset?: number;
  animationDuration?: number;
};

export default function FluidLayer({
  size,
  baseFrequency,
  amplitude,
  scale,
  colors,
  shape = "circle",
  phaseOffset = 0,
  animationDuration = 6,
}: FluidLayerProps) {
  const turbulenceRef = useRef<SVGFEImageElement | null>(null);

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
        fill={`url(#gradient-${scale})`}
        filter={`url(#fluid-filter-${scale})`}
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
        fill={`url(#gradient-${scale})`}
        filter={`url(#fluid-filter-${scale})`}
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
        fill={`url(#gradient-${scale})`}
        filter={`url(#fluid-filter-${scale})`}
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
          id={`fluid-filter-${scale}`}
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

        <radialGradient id={`gradient-${scale}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </radialGradient>
      </defs>

      {shapes[shape]}
    </>
  );
}