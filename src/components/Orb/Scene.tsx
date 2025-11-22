import { Canvas } from "@react-three/fiber";
import PlasmaOrb from "../Orb/PlasmaOrb";
import * as THREE from "three";
import { OrbitControls, Environment } from "@react-three/drei";
import { usePersona } from "@/context/PersonaContext";
import { memo, useMemo } from "react";

// Detect if we're in Electron or if WebGL2 is unavailable
const isElectronOrLowSpec = () => {
  if (typeof window === 'undefined') return false;
  
  // Check for Electron
  const isElectron = !!(window as any).electron || 
                     navigator.userAgent.toLowerCase().includes('electron');
  
  // Check WebGL2 support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2');
  const hasWebGL2 = !!gl;
  
  return isElectron || !hasWebGL2;
};

const Scene = memo(() => {
  const { getCurrentPersona, currentPersona: currentPersonaId } = usePersona();
  const currentPersona = getCurrentPersona();

  // Use the persona colors for the orb with fallback values
  const defaultColors = ["#fffacd", "#ffd700"];
  const personaColors = currentPersona?.colors || defaultColors;
  const primaryColor = personaColors[0] || defaultColors[0];
  const secondaryColor = personaColors[1] || personaColors[0] || defaultColors[1];

  // Memoize colors to prevent unnecessary re-renders
  const colors = useMemo(() => ({
    primary: primaryColor,
    secondary: secondaryColor
  }), [primaryColor, secondaryColor]);

  // Only log in development
  if (import.meta.env.DEV) {
    console.log("🎨 Scene rendering with persona:", {
      id: currentPersonaId,
      name: currentPersona?.name || "No Persona",
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
    });
  }

  // Detect environment capabilities
  const useSimpleRendering = isElectronOrLowSpec();

  return (
    <Canvas
      camera={{ position: [0, 0, 4.5], fov: 40 }}
      dpr={[1, 2]} // Cap pixel ratio for performance
      performance={{ min: 0.5 }} // Reduce quality when FPS drops
      gl={{
        alpha: true,
        antialias: !useSimpleRendering, // Disable AA in Electron
        powerPreference: "high-performance",
        stencil: false, // Not needed for this scene
        depth: true,
        preserveDrawingBuffer: false, // Better performance
      }}
      onCreated={({ scene, gl }) => {
        scene.background = new THREE.Color("#ededef");
        
        // Optimize renderer
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.5; // Increased for brighter orb (was 1.2)
        
        // Enable shader caching
        gl.shadowMap.enabled = false; // No shadows needed
      }}
    >
      {/* Brighter lighting to match original scene */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 2, 2]} intensity={1.1} />

      {/* Main orb - memoized with key for persona changes */}
      <PlasmaOrb
        key={currentPersonaId}
        color={colors.primary}
        darkColor={colors.secondary}
      />

      {/* 
        NO POST-PROCESSING - Electron/WebGL issues
        Instead, we compensate with:
        1. Built-in tone mapping (ACESFilmic)
        2. Higher base intensity in PlasmaOrb shader
        3. Environment lighting for ambient glow
      */}

      {/* Lightweight environment - no HDRI loading */}
      <Environment 
        preset="sunset" 
        background={false}
        resolution={256} // Lower resolution for performance
      />

      {/* Orbit controls - minimal settings */}
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        makeDefault
      />
    </Canvas>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if persona actually changed
  return true; // Let usePersona context handle updates
});

Scene.displayName = "Scene";

export default Scene;