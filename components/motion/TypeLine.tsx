"use client";

import { useEffect, useState } from "react";
import { useMotionSafe } from "@/lib/motion/useMotionSafe";

export function TypeLine({ text, cps = 30 }: { text: string; cps?: number }) {
  const motionSafe = useMotionSafe();
  const [n, setN] = useState(motionSafe ? 0 : text.length);

  useEffect(() => {
    if (!motionSafe) return setN(text.length);
    setN(0);
    const id = setInterval(() => {
      setN((value) => {
        if (value >= text.length) {
          clearInterval(id);
          return value;
        }
        return value + 1;
      });
    }, 1000 / cps);
    return () => clearInterval(id);
  }, [text, cps, motionSafe]);

  return (
    <span className="font-mono">
      <span className="sr-only">{text}</span>
      <span aria-hidden>{text.slice(0, n)}</span>
    </span>
  );
}
