import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeJsGlowingOrb({
  colors,
  size,
  className = "",
}: {
  colors: string[];
  size: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    particles?: THREE.Points;
    glowSphere?: THREE.Mesh;
    animationId?: number;
  }>({});

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = size * 0.015;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Particle system for stars/sparkles
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color1 = new THREE.Color(colors[0]);
    const color2 = new THREE.Color(colors[1]);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles in a sphere
      const radius = (Math.random() * 0.5 + 0.5) * (size * 0.008);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Color mixing
      const mixFactor = Math.random();
      const mixedColor = color1.clone().lerp(color2, mixFactor);
      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3)
    );
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          vec3 pos = position;
          
          // Pulsing effect
          float pulse = sin(time * 2.0 + length(position) * 0.5) * 0.1 + 1.0;
          pos *= pulse;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * pulse;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - (dist * 2.0);
          alpha = pow(alpha, 2.0);
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Core glowing sphere
    const sphereGeometry = new THREE.SphereGeometry(size * 0.006, 32, 32);
    const sphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(colors[0]) },
        color2: { value: new THREE.Color(colors[1]) },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 color = mix(color1, color2, sin(time + vPosition.y) * 0.5 + 0.5);
          
          float alpha = fresnel * 0.8;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });

    const glowSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(glowSphere);

    // Store references
    sceneRef.current = { scene, camera, renderer, particles, glowSphere };

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.01;

      // Rotate particles
      if (particles) {
        particles.rotation.y = time * 0.1;
        particles.rotation.x = time * 0.05;
        (particleMaterial.uniforms.time as any).value = time;
      }

      // Animate sphere
      if (glowSphere) {
        glowSphere.rotation.y = time * 0.15;
        (sphereMaterial.uniforms.time as any).value = time;
      }

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (sceneRef.current.animationId) {
        cancelAnimationFrame(sceneRef.current.animationId);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      particleGeometry.dispose();
      particleMaterial.dispose();
      sphereGeometry.dispose();
      sphereMaterial.dispose();
      renderer.dispose();
    };
  }, [colors, size]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
