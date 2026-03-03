"use client";

import React, { useEffect, useRef, useState } from "react";
import { m, useInView, useReducedMotion } from "framer-motion";

export const CountUp = ({
  end,
  duration = 2,
  suffix = "",
  prefix = "",
  className = "",
}: {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) return;

    let start = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * end);

      if (current !== start) {
        start = current;
        setCount(current);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, end, duration, prefersReducedMotion]);

  // Show final value when reduced motion is preferred or animation hasn't started
  const displayValue = prefersReducedMotion ? end : count;

  return (
    <m.span
      ref={ref}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
      className={className}
    >
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </m.span>
  );
};
