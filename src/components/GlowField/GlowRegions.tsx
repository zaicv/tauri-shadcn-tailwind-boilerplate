import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ConsciousnessState } from "@/types/consciousness";

interface GlowRegionsProps {
  states: ConsciousnessState[];
}

export default function GlowRegions({ states }: GlowRegionsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Create mesh instances for each glow state
  const meshes = useMemo(() => {
    return states.slice(0, 20).map((state, index) => {
      const geometry = new THREE.SphereGeometry(
        0.5 + state.intensity * 1.0,
        32,
        32
      );
      
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          intensity: { value: state.intensity },
          color1: { value: new THREE.Color("#ffd700") }, // Warm gold
          color2: { value: new THREE.Color("#fffacd") }, // Light yellow
          color3: { value: new THREE.Color("#ffffff") }, // White light
        },
        vertexShader: `
          uniform float time;
          uniform float intensity;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          
          void main() {
            vPosition = position;
            vNormal = normal;
            vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            
            // Expanding effect
            vec3 pos = position;
            float expansion = sin(time * 1.5 + intensity * 3.14) * 0.1 + 1.0;
            pos *= mix(1.0, 1.2, expansion); // Expand outward
            
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
          varying vec3 vViewPosition;
          
          void main() {
            // Bright, luminous appearance
            float noise = sin(vPosition.x * 3.0 + time) * cos(vPosition.y * 3.0 + time) * 0.3 + 0.7;
            vec3 color = mix(color1, color2, noise);
            
            // Add white light based on intensity
            color = mix(color, color3, intensity * 0.5);
            
            // Strong fresnel for edge glow (bright)
            vec3 viewDir = normalize(-vViewPosition);
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
            color += color3 * fresnel * intensity * 0.8;
            
            // Radial gradient from center
            float dist = length(vPosition);
            float radial = 1.0 - smoothstep(0.0, 1.0, dist);
            color += color3 * radial * intensity * 0.3;
            
            // Alpha based on intensity with glow
            float alpha = 0.7 + intensity * 0.3;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });

      // Position based on state timestamp (spread out)
      const angle = (index / states.length) * Math.PI * 2 + Math.PI / 4;
      const radius = 2 + (index % 3) * 0.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = 0.5 + state.intensity * 0.5; // Above the surface

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

