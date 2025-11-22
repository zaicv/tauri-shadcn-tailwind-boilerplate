import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, ShaderMaterial } from "three";
import { Float } from "@react-three/drei";

const vertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec3 u_color;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;

  void main() {
    // Simple lighting calculation
    vec3 lightDir = normalize(vec3(2.0, 2.0, 2.0));
    float lightIntensity = max(dot(vNormal, lightDir), 0.0);

    // Pulse effect based on time
    float pulse = 0.3 + 0.2 * sin(u_time * 2.0 + length(vWorldPosition) * 5.0);

    vec3 color = u_color * (lightIntensity + pulse);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function GlowOrb() {
  const materialRef = useRef<ShaderMaterial>(null);
  const meshRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = clock.getElapsedTime();
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.2}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            u_time: { value: 0 },
            u_color: { value: new THREE.Color("#FFD700") }, // Yellow
          }}
          transparent={false}
          depthWrite={true}
          side={THREE.FrontSide}
        />
      </mesh>
    </Float>
  );
}
