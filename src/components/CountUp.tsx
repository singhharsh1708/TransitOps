"use client";

import { useEffect, useState } from "react";
import { animate } from "framer-motion";

// Animates a number from 0 to `value` on mount.
export default function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className="tabular-nums">
      {Math.round(display)}
      {suffix}
    </span>
  );
}
