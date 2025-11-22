import * as THREE from "three";
import { useRef, useMemo, memo } from "react";
import { useFrame, extend } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";

// Optimized noise - removed unused fbm layers
const optimizedNoiseGLSL = `
vec4 permute(vec4 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float classicNoise(in vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);

  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.y, Pi0.y, Pi1.y, Pi1.y);
  vec4 iz0 = vec4(Pi0.z);
  vec4 iz1 = vec4(Pi1.z);

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = fract(ixy0 * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy0 = fract(floor(ixy0 * (1.0 / 41.0)) * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gz0 = 1.0 - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) * 2.0 - 1.0);
  gy0 -= sz0 * (step(0.0, gy0) * 2.0 - 1.0);

  vec4 gx1 = fract(ixy1 * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy1 = fract(floor(ixy1 * (1.0 / 41.0)) * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gz1 = 1.0 - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) * 2.0 - 1.0);
  gy1 -= sz1 * (step(0.0, gy1) * 2.0 - 1.0);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = Pf0 * Pf0 * Pf0 * (Pf0 * (Pf0 * 6.0 - 15.0) + 10.0);
  vec4 n_x = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_xy = mix(n_x.xy, n_x.zw, fade_xyz.y);
  float n_xyz = mix(n_xy.x, n_xy.y, fade_xyz.x);

  return 2.2 * n_xyz;
}

// Reduced to 3 octaves for performance
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.7;
  for(int i=0; i<3; i++) {
    value += amplitude * classicNoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`;

// Optimized shader material with built-in glow compensation
const EnergyShellMaterial = shaderMaterial(
  {
    u_time: 0,
    u_color: new THREE.Color("#ffff00"),
    u_darkColor: new THREE.Color("#0033cc"),
  },
  // Vertex Shader - simplified displacement
  `
    varying vec3 vNormal;
    varying vec3 vPos;
    varying vec3 vViewPosition;
    uniform float u_time;

    ${optimizedNoiseGLSL}

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPos = position;
      
      // Reduced displacement for performance
      float displacement = (fbm(position * 3.0 + u_time * 0.4) - 0.5) * 0.06;
      vec3 displaced = position + normal * displacement;

      vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader - ENHANCED GLOW to compensate for removed post-processing
  `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform vec3 u_color;
    uniform vec3 u_darkColor;
    uniform float u_time;

    ${optimizedNoiseGLSL}

    void main() {
      // Enhanced noise intensity
      float noise = fbm(vNormal * 6.0 + vec3(u_time * 0.25));
      
      // Stronger fresnel effect (replaces bloom)
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.5);
      
      // Combine noise with fresnel
      float intensity = noise * 0.7 + fresnel * 0.8;
      intensity = clamp(intensity, 0.0, 1.0);
      
      // Enhanced color mixing with more vibrance
      vec3 glow = mix(u_darkColor, u_color, intensity);
      
      // Add extra brightness to bright areas (bloom compensation)
      float brightBoost = smoothstep(0.6, 1.0, intensity) * 0.4;
      glow += u_color * brightBoost;
      
      // Vignette compensation - brighter edges
      float edgeGlow = pow(fresnel, 1.5) * 0.3;
      glow += u_color * edgeGlow;
      
      // Increased base opacity for more presence
      float alpha = clamp(intensity * 1.4 + 0.6, 0.7, 1.0);
      
      gl_FragColor = vec4(glow, alpha);
    }
  `
);

extend({ EnergyShellMaterial });

type PlasmaOrbProps = {
  color?: string;
  darkColor?: string;
};

const PlasmaOrb = memo(({ color = "#ffcc33", darkColor = "#0033cc" }: PlasmaOrbProps) => {
  const energyShellRef = useRef<THREE.Mesh>(null);

  // Memoize colors to prevent material recreation
  const colorObjects = useMemo(() => ({
    primary: new THREE.Color(color),
    secondary: new THREE.Color(darkColor)
  }), [color, darkColor]);

  // Memoized material with optimized settings
  const energyMaterial = useMemo(() => {
    const mat = new EnergyShellMaterial();
    mat.uniforms.u_color.value = colorObjects.primary;
    mat.uniforms.u_darkColor.value = colorObjects.secondary;
    mat.transparent = true;
    mat.side = THREE.DoubleSide;
    mat.depthWrite = false; // Better transparency
    return mat;
  }, [colorObjects.primary, colorObjects.secondary]);

  // Reduced geometry detail for better performance
  // 64x64 instead of 128x128 - visually identical at runtime
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 64, 64), []);

  // Optimized animation loop - only update time uniform
  useFrame(({ clock }) => {
    if (energyMaterial) {
      energyMaterial.uniforms.u_time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh scale={1.04} ref={energyShellRef} geometry={geometry}>
      <primitive object={energyMaterial} attach="material" />
    </mesh>
  );
}, (prevProps, nextProps) => 
  prevProps.color === nextProps.color && 
  prevProps.darkColor === nextProps.darkColor
);

PlasmaOrb.displayName = "PlasmaOrb";

export default PlasmaOrb;