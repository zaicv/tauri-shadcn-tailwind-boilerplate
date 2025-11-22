import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { useAuth } from "@/components/auth/AuthContext";
import type { ConsciousnessState } from "@/types/consciousness";
import {
  getCurrentState,
  getUserStates,
  subscribeToStates,
} from "@/services/consciousness";
import {
  generateMockStates,
  generateMockCurrentState,
  simulateStateUpdates,
} from "@/services/mockConsciousness";
import FieldLandscape from "./FieldLandscape";
import ChaosRegions from "./ChaosRegions";
import GlowRegions from "./GlowRegions";
import StateParticles from "./StateParticles";
import IntegrationPoints from "./IntegrationPoints";
import TimelineController from "./TimelineController";
import StateIndicator from "./StateIndicator";

interface GlowFieldProps {
  isVisible: boolean;
  onClose?: () => void;
  mode?: "fullscreen" | "overlay";
}

export default function GlowField({
  isVisible,
  onClose,
  mode = "fullscreen",
}: GlowFieldProps) {
  const { user } = useAuth();
  const [states, setStates] = useState<ConsciousnessState[]>([]);
  const [currentState, setCurrentState] = useState<ConsciousnessState | null>(null);
  const [selectedTimeIndex, setSelectedTimeIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([
    0, 5, 10,
  ]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load initial states
  useEffect(() => {
    if (!isVisible) return;

    const loadStates = async () => {
      setIsLoading(true);
      try {
        let current: ConsciousnessState | null = null;
        let recent: ConsciousnessState[] = [];

        // Try to load real data first
        if (user) {
          try {
            const [realCurrent, realRecent] = await Promise.all([
              getCurrentState(user.id).catch(() => null),
              getUserStates(user.id, 100).catch(() => []),
            ]);

            // If we got real data, use it
            if (realRecent.length > 0 || realCurrent) {
              current = realCurrent;
              recent = realRecent;
              setUseMockData(false);
            } else {
              // No real data, use mock
              throw new Error("No real data available");
            }
          } catch (error) {
            // Fall back to mock data
            console.log("Using mock consciousness data for demo");
            setUseMockData(true);
            const userId = user?.id || "demo-user";
            current = generateMockCurrentState(userId);
            recent = generateMockStates(userId, 7);
          }
        } else {
          // No user, use demo data
          setUseMockData(true);
          const demoUserId = "demo-user";
          current = generateMockCurrentState(demoUserId);
          recent = generateMockStates(demoUserId, 7);
        }

        setCurrentState(current);
        setStates(recent);
        if (current) {
          setSelectedTimeIndex(0);
        }
      } catch (error) {
        console.error("Error loading states:", error);
        // Fallback to mock data
        setUseMockData(true);
        const demoUserId = "demo-user";
        setCurrentState(generateMockCurrentState(demoUserId));
        setStates(generateMockStates(demoUserId, 7));
      } finally {
        setIsLoading(false);
      }
    };

    loadStates();
  }, [user, isVisible]);

  // Separate effect for real-time updates
  useEffect(() => {
    if (!isVisible || isLoading) return;
    
    let unsubscribe: (() => void) | null = null;

    if (useMockData) {
      // Use simulated updates for demo
      unsubscribe = simulateStateUpdates((newState) => {
        setCurrentState(newState);
        setStates((prev) => [newState, ...prev].slice(0, 100));
      }, 8000); // Update every 8 seconds
    } else if (user) {
      // Try real subscription
      try {
        unsubscribe = subscribeToStates(user.id, (newState) => {
          setCurrentState(newState);
          setStates((prev) => [newState, ...prev].slice(0, 100));
        });
      } catch (error) {
        console.error("Error subscribing to states:", error);
        // Fallback to simulation
        unsubscribe = simulateStateUpdates((newState) => {
          setCurrentState(newState);
          setStates((prev) => [newState, ...prev].slice(0, 100));
        }, 8000);
      }
    } else {
      // No user but we have mock data loaded, simulate updates
      unsubscribe = simulateStateUpdates((newState) => {
        setCurrentState(newState);
        setStates((prev) => [newState, ...prev].slice(0, 100));
      }, 8000);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (e) {
          // Ignore unsubscribe errors
        }
      }
    };
  }, [user, isVisible, isLoading, useMockData]);

  // Get the state to visualize
  const displayState = selectedTimeIndex !== null
    ? states[selectedTimeIndex]
    : currentState;

  // Filter states by type for visualization
  const chaosStates = states.filter((s) => s.state_type === "chaos");
  const glowStates = states.filter((s) => s.state_type === "glow");
  const integrationPoints = states.filter(
    (s) => s.state_type === "glow" && s.intensity > 0.7
  );

  if (!isVisible) return null;

  // Show loading or empty state gracefully
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
        <div className="text-white text-lg">Loading consciousness field...</div>
      </div>
    );
  }

  // Show demo indicator if using mock data
  const showDemoBadge = useMockData;
  
  // Show empty state if no data at all
  if (states.length === 0 && !currentState) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg">
        <div className="text-center">
          <div className="text-white text-xl mb-4">No consciousness data yet</div>
          <div className="text-white/70 text-sm">
            Start chatting with GlowGPT to see your consciousness journey visualized
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 ${
          mode === "overlay" ? "pointer-events-none" : ""
        }`}
        style={{
          background:
            mode === "fullscreen"
              ? "linear-gradient(to bottom, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)"
              : "transparent",
        }}
      >
        {/* HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <StateIndicator
            currentState={displayState}
            intensity={displayState?.intensity || 0.5}
            mode={mode}
          />
          
          {/* Demo Badge */}
          {showDemoBadge && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 bg-yellow-500/20 backdrop-blur-lg rounded-lg px-3 py-2 border border-yellow-500/30"
            >
              <div className="text-xs text-yellow-400 font-semibold">DEMO MODE</div>
              <div className="text-xs text-yellow-300/70">Using simulated data</div>
            </motion.div>
          )}
        </div>

        {/* Timeline Controller */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto">
          <TimelineController
            states={states}
            currentIndex={selectedTimeIndex}
            onTimeChange={setSelectedTimeIndex}
            onPlay={() => setSelectedTimeIndex(null)} // Resume real-time
          />
        </div>

        {/* 3D Scene */}
        <div
          className={`${
            mode === "fullscreen" ? "w-full h-full" : "w-96 h-96"
          } relative`}
          style={{ pointerEvents: mode === "overlay" ? "none" : "auto" }}
        >
          <Canvas
            camera={{ position: cameraPosition, fov: 50 }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: "high-performance",
            }}
            onCreated={({ scene, gl }) => {
              scene.background = new THREE.Color("#0a0a0a");
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.2;
            }}
          >
            <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />
            <OrbitControls
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={30}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2}
            />

            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 10, 5]} intensity={0.8} />
            <pointLight position={[0, 0, 0]} intensity={1} color="#ffd700" />

            {/* Field Landscape */}
            <FieldLandscape />

            {/* Chaos Regions */}
            <ChaosRegions states={chaosStates} />

            {/* Glow Regions */}
            <GlowRegions states={glowStates} />

            {/* State Particles */}
            <StateParticles
              currentState={displayState}
              transitionDuration={1000}
            />

            {/* Integration Points */}
            <IntegrationPoints points={integrationPoints} />
          </Canvas>
        </div>

        {/* Close Button (fullscreen mode only) */}
        {mode === "fullscreen" && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

