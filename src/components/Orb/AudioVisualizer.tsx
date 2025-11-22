import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ✅ Step 1: Define props
interface AudioVisualizerProps {
  width?: string;
  height?: string;
}

// ✅ Step 2: Make the component accept width and height props
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  width = '100%',
  height = '100vh',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('#ededef'); // 🟡 Soft background color
    mountRef.current.appendChild(renderer.domElement);

    // OrbitControls
    const orbit = new OrbitControls(camera, renderer.domElement);
    camera.position.set(6, 8, 14);
    orbit.update();

    // Shader material
    const uniforms = {
      u_time: { value: 0.0 },
    };

    const mat = new THREE.ShaderMaterial({
      wireframe: true,
      uniforms,
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        void main() {
          gl_FragColor = vec4(0.145, 0.408, 0.807, 1.0); // #2568ce
        }
      `,
    });

    // Geometry and mesh
    const geo = new THREE.IcosahedronGeometry(4, 30);
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
      uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();

    // Resize handling
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // ✅ Step 3: Use the passed-in width and height
  return <div ref={mountRef} style={{ width, height }} />;
};

export default AudioVisualizer;