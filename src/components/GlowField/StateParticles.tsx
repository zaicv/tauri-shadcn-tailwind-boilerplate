import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ConsciousnessState } from "@/types/consciousness";

interface StateParticlesProps {
  currentState: ConsciousnessState | null;
  transitionDuration?: number;
}

export default function StateParticles({
  currentState,
  transitionDuration = 1000,
}: StateParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const prevStateRef = useRef<ConsciousnessState | null>(null);
  const transitionStartRef = useRef<number>(0);

  const count = 200;
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    // Initialize particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Random positions around origin
      positions[i3] = (Math.random() - 0.5) * 10;
      positions[i3 + 1] = (Math.random() - 0.5) * 10;
      positions[i3 + 2] = (Math.random() - 0.5) * 5;

      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }

    return { positions, velocities };
  }, []);

  const colors = useMemo(() => {
    const colorArray = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Initial colors (neutral)
      colorArray[i3] = 0.5;
      colorArray[i3 + 1] = 0.5;
      colorArray[i3 + 2] = 0.5;
    }
    return colorArray;
  }, []);

  // Detect state change and start transition
  if (currentState && currentState !== prevStateRef.current) {
    transitionStartRef.current = Date.now();
    prevStateRef.current = currentState;
  }

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(particles.positions, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geom;
  }, [particles, colors]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useFrame(({ clock }) => {
    if (!particlesRef.current || !currentState) return;

    const elapsed = Date.now() - transitionStartRef.current;
    const progress = Math.min(elapsed / transitionDuration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

    // Get target colors based on state
    let targetColor: [number, number, number];
    if (currentState.state_type === "chaos") {
      targetColor = [0.1, 0.0, 0.2]; // Dark purple
    } else if (currentState.state_type === "glow") {
      targetColor = [1.0, 0.84, 0.0]; // Gold
    } else {
      targetColor = [0.5, 0.5, 0.5]; // Neutral gray
    }

    // Interpolate colors
    const colorAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
    for (let i = 0; i < colorAttr.count; i++) {
      const i3 = i * 3;
      const currentR = colorAttr.array[i3];
      const currentG = colorAttr.array[i3 + 1];
      const currentB = colorAttr.array[i3 + 2];

      colorAttr.array[i3] = currentR + (targetColor[0] - currentR) * easeProgress * 0.1;
      colorAttr.array[i3 + 1] = currentG + (targetColor[1] - currentG) * easeProgress * 0.1;
      colorAttr.array[i3 + 2] = currentB + (targetColor[2] - currentB) * easeProgress * 0.1;
    }
    colorAttr.needsUpdate = true;

    // Update particle positions
    const positionAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < positionAttr.count; i++) {
      const i3 = i * 3;
      
      // Update position based on velocity
      positionAttr.array[i3] += particles.velocities[i3];
      positionAttr.array[i3 + 1] += particles.velocities[i3 + 1];
      positionAttr.array[i3 + 2] += particles.velocities[i3 + 2];

      // Wrap around edges
      if (Math.abs(positionAttr.array[i3]) > 5) {
        positionAttr.array[i3] = -Math.sign(positionAttr.array[i3]) * 5;
      }
      if (Math.abs(positionAttr.array[i3 + 1]) > 5) {
        positionAttr.array[i3 + 1] = -Math.sign(positionAttr.array[i3 + 1]) * 5;
      }
      if (Math.abs(positionAttr.array[i3 + 2]) > 2.5) {
        positionAttr.array[i3 + 2] = -Math.sign(positionAttr.array[i3 + 2]) * 2.5;
      }
    }
    positionAttr.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} geometry={geometry} material={material} />
  );
}

