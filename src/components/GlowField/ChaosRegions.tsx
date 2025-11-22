import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ConsciousnessState } from "@/types/consciousness";

interface ChaosRegionsProps {
  states: ConsciousnessState[];
}

export default function ChaosRegions({ states }: ChaosRegionsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Create mesh instances for each chaos state
  const meshes = useMemo(() => {
    return states.slice(0, 20).map((state, index) => {
      const geometry = new THREE.SphereGeometry(
        0.3 + state.intensity * 0.5,
        16,
        16
      );
      
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          intensity: { value: state.intensity },
          color1: { value: new THREE.Color("#1a0033") }, // Deep purple
          color2: { value: new THREE.Color("#2d1b3d") }, // Dark purple-blue
          color3: { value: new THREE.Color("#8b0000") }, // Dark red accent
        },
        vertexShader: `
          uniform float time;
          uniform float intensity;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            vPosition = position;
            vNormal = normal;
            
            // Pulsing/contracting effect
            vec3 pos = position;
            float pulse = sin(time * 2.0 + intensity * 3.14) * 0.1 + 1.0;
            pos *= mix(0.8, 1.0, pulse); // Contract and expand
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float intensity;
          uniform vec3 color1;
          uniform vec3 color2;
          uniform vec3 color3;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            // Dark, contracted appearance
            float noise = sin(vPosition.x * 5.0 + time) * cos(vPosition.y * 5.0 + time) * 0.5 + 0.5;
            vec3 color = mix(color1, color2, noise);
            
            // Add red accent based on intensity
            color = mix(color, color3, intensity * 0.3);
            
            // Fresnel for edge glow (dark)
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            color += color3 * fresnel * intensity * 0.2;
            
            // Alpha based on intensity
            float alpha = 0.6 + intensity * 0.4;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });

      // Position based on state timestamp (spread out)
      const angle = (index / states.length) * Math.PI * 2;
      const radius = 2 + (index % 3) * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = -0.5 - state.intensity * 0.3; // Below the surface

      return { geometry, material, position: [x, y, z] as [number, number, number], state };
    });
  }, [states]);

  // Animate all meshes
  useFrame(({ clock }) => {
    meshes.forEach((mesh) => {
      if (mesh.material.uniforms) {
        mesh.material.uniforms.time.value = clock.getElapsedTime();
      }
    });
  });

  return (
    <group ref={groupRef}>
      {meshes.map((mesh, index) => (
        <mesh
          key={mesh.state.id || index}
          geometry={mesh.geometry}
          material={mesh.material}
          position={mesh.position}
        />
      ))}
    </group>
  );
}

