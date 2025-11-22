import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

interface OrbitingEnergyProps {
  radius?: number;
  speed?: number;
  color?: string;
}

function SingleEnergyRing({
  radius = 1.2,
  speed = 1,
  color = "#ffec33",
}: OrbitingEnergyProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const points = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.sin(angle * 2.0) * 0.25; // Adds some wave depth
      points.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(points, true);
  }, [radius]);

  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 200, 0.015, 8, true),
    [curve]
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * speed;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

export default function OrbitingEnergyRings() {
  return (
    <group>
      <SingleEnergyRing radius={1.25} speed={0.5} color="#ffcc33" />
      <SingleEnergyRing radius={1.3} speed={-0.35} color="#ffe066" />
      <SingleEnergyRing radius={1.35} speed={0.65} color="#ffaa33" />
    </group>
  );
}
