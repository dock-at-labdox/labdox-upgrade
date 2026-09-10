"use client";

import { motion } from "framer-motion";
import { useMotionSafe } from "@/lib/motion/useMotionSafe";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
          show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] as const } },
};

export function PopulateGrid({ children }: { children: React.ReactNode }) {
  const motionSafe = useMotionSafe();
  if (!motionSafe) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="show"
      className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.li key={index} variants={item}>
            {child}
          </motion.li>
        ))
      ) : (
        <motion.li variants={item}>{children}</motion.li>
      )}
    </motion.ul>
  );
}
