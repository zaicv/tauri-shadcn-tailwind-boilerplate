// components/WhispyEnergyLine.tsx
import * as THREE from "three";
import { useRef, useMemo, useEffect } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

// Custom glowing trail shader
const WhispTrailMaterial = shaderMaterial(
  {
    u_time: 0,
    u_color: new THREE.Color("#ffcc33"),
  },
  // vertex
  `
    uniform float u_time;
    varying float vProgress;
    varying vec3 vPosition;

    void main() {
      vPosition = position;
      vProgress = position.y; // used to fade ends
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  `
    uniform vec3 u_color;
    uniform float u_time;
    varying float vProgress;
    varying vec3 vPosition;

    void main() {
      float fade = smoothstep(-0.5, 0.0, vProgress) * smoothstep(0.5, 0.0, vProgress);
      float pulse = 0.6 + 0.4 * sin(length(vPosition) * 20.0 - u_time * 4.0);
      gl_FragColor = vec4(u_color * pulse, fade * pulse);
    }
  `
);
extend({ WhispTrailMaterial });

function WhispyEnergyLine({
  radius = 1.25,
  color = "#ffcc33",
  segments = 100,
  speed = 1,
}: {
  radius?: number;
  color?: string;
  segments?: number;
  speed?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    const points = [];
    const baseR = radius;
    for (let i = 0; i < 5; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = baseR + Math.random() * 0.2;
      points.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }
    return new THREE.CatmullRomCurve3(points, false);
  }, [radius]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, segments, 0.01, 8, false);
  }, [curve]);

  const material = useMemo(
    () => new WhispTrailMaterial({ u_color: new THREE.Color(color) }),
    [color]
  );

  useFrame(({ clock }) => {
    if (mesh.current) {
      mesh.current.rotation.y = clock.getElapsedTime() * speed;
      mesh.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.2) * 0.1;
      mesh.current.rotation.z = Math.cos(clock.getElapsedTime() * 0.3) * 0.2;
    }
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  return <mesh ref={mesh} geometry={geometry} material={material} />;
}

export default WhispyEnergyLine;
