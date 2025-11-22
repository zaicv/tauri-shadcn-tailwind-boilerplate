import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

type EtherealTypingOrbProps = {
  className?: string;
  color?: string; // Tailwind-style color hex or rgba string
};

export default function EtherealTypingOrb({
  className = '',
  color = 'rgb(48, 48, 48)',
}: EtherealTypingOrbProps) {
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 4,
        ease: 'linear',
      },
    });
  }, [controls]);

  const getRGBA = (opacity: number) => {
    const rgba = color
      .replace('rgb(', '')
      .replace('rgba(', '')
      .replace(')', '')
      .split(',')
      .map((c) => parseFloat(c.trim()));
    return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${opacity})`;
  };

  return (
    <div className={`relative w-4 h-4 ${className}`} style={{ marginLeft: '20px' }}>
      <motion.div
        animate={controls}
        className="absolute top-0 left-0 w-4 h-4 rounded-full"
        style={{
          border: `2px solid ${getRGBA(0.6)}`,
          backgroundColor: getRGBA(0.8),
          boxShadow: 'none',
        }}
      />
    </div>
  );
}