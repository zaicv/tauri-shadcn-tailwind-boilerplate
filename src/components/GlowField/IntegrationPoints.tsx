import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ConsciousnessState } from "@/types/consciousness";

interface IntegrationPointsProps {
  points: ConsciousnessState[];
}

export default function IntegrationPoints({ points }: IntegrationPointsProps) {
  const groupRef = useRef<THREE.Group>(null);

  const meshes = useMemo(() => {
    return points.slice(0, 10).map((point, index) => {
      const geometry = new THREE.RingGeometry(0.2, 0.4, 32);
      
      const material = new THREE.MeshBasicMaterial({
        color: "#ffd700",
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });

      // Position based on timestamp
      const angle = (index / points.length) * Math.PI * 2;
      const radius = 3 + (index % 2) * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = 1.0; // Above the surface

      return {
        geometry,
        material,
        position: [x, y, z] as [number, number, number],
        point,
        index,
      };
    });
  }, [points]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    meshes.forEach((mesh, index) => {
      const meshObj = groupRef.current?.children[index] as THREE.Mesh;
      if (meshObj) {
        // Rotate slowly
        meshObj.rotation.z = clock.getElapsedTime() * 0.5 + index;
        
        // Pulsing scale
        const scale = 1 + Math.sin(clock.getElapsedTime() * 2 + index) * 0.2;
        meshObj.scale.set(scale, scale, 1);
        
        // Fade in/out
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = 0.6 + Math.sin(clock.getElapsedTime() * 1.5 + index) * 0.3;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {meshes.map((mesh, index) => (
        <mesh
          key={mesh.point.id || index}
          geometry={mesh.geometry}
          material={mesh.material}
          position={mesh.position}
          rotation={[Math.PI / 2, 0, 0]}
        />
      ))}
    </group>
  );
}

