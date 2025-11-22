import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FieldLandscape() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create a plane geometry for the field
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(20, 20, 64, 64);
    return plane;
  }, []);

  // Create a shader material for the field
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color("#0a0a0a") },
        color2: { value: new THREE.Color("#1a1a1a") },
      },
      vertexShader: `
        uniform float time;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          
          // Add subtle wave animation
          vec3 pos = position;
          pos.z += sin(pos.x * 0.5 + time * 0.5) * 0.1;
          pos.z += cos(pos.y * 0.5 + time * 0.3) * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        void main() {
          // Create subtle gradient pattern
          float pattern = sin(vPosition.x * 0.5) * cos(vPosition.y * 0.5) * 0.5 + 0.5;
          vec3 color = mix(color1, color2, pattern);
          
          // Add subtle glow
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          color += fresnel * 0.1;
          
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, []);

  // Animate time uniform
  useFrame(({ clock }) => {
    if (material.uniforms) {
      material.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
    />
  );
}

