import { motion } from "framer-motion";
import GPTCarousel from "@/components/Orb/GPTCarousel";

export default function CarouselPage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center justify-center min-h-screen"
      >
        <GPTCarousel theme="dark" />
      </motion.div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
