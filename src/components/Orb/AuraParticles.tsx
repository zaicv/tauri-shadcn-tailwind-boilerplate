import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Points, PointMaterial } from "@react-three/drei";

export default function AuraParticles({ count = 300 }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const r = 1.8 + Math.random() * 0.6;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      temp.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    return new Float32Array(temp);
  }, [count]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.001;
    }
  });

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial
        transparent
        color="#ffffcc"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}
