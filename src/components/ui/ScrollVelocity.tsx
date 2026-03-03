"use client";

import React, { useRef } from "react";
import {
  m,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";

function wrap(min: number, max: number, v: number) {
  const range = max - min;
  const mod = ((((v - min) % range) + range) % range) + min;
  return mod;
}

export const ScrollVelocity = ({
  children,
  baseVelocity = 5,
  className = "",
}: {
  children: React.ReactNode;
  baseVelocity?: number;
  className?: string;
}) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });
  const prefersReducedMotion = useReducedMotion();

  const isRtl = baseVelocity > 0;
  const x = useTransform(baseX, (v) =>
    `${wrap(isRtl ? -45 : -20, isRtl ? -20 : -45, v)}%`
  );

  const directionFactor = useRef<number>(1);
  useAnimationFrame((_, delta) => {
    if (prefersReducedMotion) return;
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div dir="ltr" className="overflow-hidden whitespace-nowrap flex flex-nowrap">
      <m.div
        className={`flex whitespace-nowrap gap-8 flex-nowrap ${className}`}
        style={{ x }}
      >
        {[...Array(4)].map((_, i) => (
          <span key={i} className="block">
            {children}
          </span>
        ))}
      </m.div>
    </div>
  );
};
