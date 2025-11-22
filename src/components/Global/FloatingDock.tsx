// no change to imports
import { cn } from "../../lib/utils";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useRef, useState } from "react";

export const FloatingDock = ({
  items,
  className,
  theme,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
  theme: "light" | "dark" | "system";
}) => {
  const mouseX = useMotionValue(Infinity);

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) mouseX.set(touch.clientX);
  };

  const handleTouchEnd = () => {
    mouseX.set(Infinity);
  };

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        `fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 flex h-14 items-end gap-3 rounded-full px-3 pb-2 ${
          theme === "dark" ? "bg-[#1a1a1a]" : "bg-[#ffffff]"
        }`,
        className
      )}
    >
      {items.map((item) => (
        <IconContainer
          mouseX={mouseX}
          key={item.title}
          {...item}
          theme={theme}
        />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  theme,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  theme: "light" | "dark" | "system";
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // 👇 scaled down: [32, 64, 32] instead of [40, 80, 40]
  const widthTransform = useTransform(distance, [-150, 0, 150], [32, 64, 32]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [32, 64, 32]);
  const widthIcon = useTransform(distance, [-150, 0, 150], [16, 32, 16]);
  const heightIcon = useTransform(distance, [-150, 0, 150], [16, 32, 16]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const widthIconSpring = useSpring(widthIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const heightIconSpring = useSpring(heightIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <a href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex aspect-square items-center mb-1 justify-center rounded-full transition-colors duration-300 ${
          theme === "dark" ? "bg-[#3a3a3a]" : "bg-blue-600"
        }`}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className={`absolute -top-7 left-1/2 w-fit whitespace-pre rounded-md border px-2 py-0.5 text-[10px] transition-colors duration-300 ${
                theme === "dark"
                  ? "border-neutral-900 bg-neutral-800 text-white"
                  : "border-gray-200 bg-gray-100 text-neutral-700"
              }`}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{
            width: widthIconSpring,
            height: heightIconSpring,
            transform: "translateY(-2px)", // Move icon up 4px
          }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
}
