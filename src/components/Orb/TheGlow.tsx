import { motion } from "framer-motion";
import star from "@/assets/TheGlow-removebg-preview.png";

export default function GodTierGlow() {
  return (
    <div className="">
      {/* Layered background glows */}
      <div
        className="absolute w-[1200px] h-[1200px] rounded-full 
                      bg-gradient-radial from-yellow-400/15 via-yellow-200/5 to-transparent 
                      blur-[250px] mix-blend-screen pointer-events-none"
      />

      <div
        className="absolute w-[900px] h-[900px] rounded-full 
                      bg-gradient-radial from-yellow-300/20 via-yellow-200/5 to-transparent 
                      blur-[200px] mix-blend-screen pointer-events-none"
      />

      <div
        className="absolute w-[700px] h-[700px] rounded-full 
                      bg-gradient-radial from-yellow-200/30 to-transparent 
                      blur-[150px] mix-blend-screen pointer-events-none"
      />

      {/* Core Star */}
      <motion.img
        src={star}
        alt="Glow"
        className="w-72 h-72 relative z-10"
        animate={{
          scale: [1, 1.07, 1],
          filter: [
            "drop-shadow(0 0 20px #ffd700)",
            "drop-shadow(0 0 50px #fff176)",
            "drop-shadow(0 0 30px #ffecb3)",
            "drop-shadow(0 0 20px #ffd700)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Aura shimmer */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl mix-blend-screen"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Random flare burst */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-yellow-100/20 blur-3xl mix-blend-screen"
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 10 }}
      />
    </div>
  );
}
