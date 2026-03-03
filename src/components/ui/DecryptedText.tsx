"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = true,
  revealDirection = "start" as "start" | "end" | "center",
  className = "",
  encryptedClassName = "",
  animateOn = "view" as "hover" | "view" | "both",
}: {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  className?: string;
  encryptedClassName?: string;
  animateOn?: "hover" | "view" | "both";
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set<number>());
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const getNextIndex = useCallback(
    (revealedSet: Set<number>) => {
      const len = text.length;
      switch (revealDirection) {
        case "end":
          return len - 1 - revealedSet.size;
        case "center": {
          const mid = Math.floor(len / 2);
          const offset = Math.floor(revealedSet.size / 2);
          const next =
            revealedSet.size % 2 === 0 ? mid + offset : mid - offset - 1;
          if (next >= 0 && next < len && !revealedSet.has(next)) return next;
          for (let i = 0; i < len; i++) if (!revealedSet.has(i)) return i;
          return 0;
        }
        default:
          return revealedSet.size;
      }
    },
    [text, revealDirection],
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let iteration = 0;

    if (isHovering) {
      setIsScrambling(true);
      interval = setInterval(() => {
        setRevealedIndices((prev) => {
          if (sequential) {
            if (prev.size < text.length) {
              const next = new Set(prev);
              next.add(getNextIndex(prev));
              setDisplayText(
                text
                  .split("")
                  .map((ch, i) =>
                    ch === " "
                      ? " "
                      : next.has(i)
                        ? text[i]
                        : CHARS[Math.floor(Math.random() * CHARS.length)],
                  )
                  .join(""),
              );
              return next;
            }
            clearInterval(interval);
            setIsScrambling(false);
            return prev;
          }
          setDisplayText(
            text
              .split("")
              .map((ch, i) =>
                ch === " "
                  ? " "
                  : prev.has(i)
                    ? text[i]
                    : CHARS[Math.floor(Math.random() * CHARS.length)],
              )
              .join(""),
          );
          iteration++;
          if (iteration >= maxIterations) {
            clearInterval(interval);
            setIsScrambling(false);
            setDisplayText(text);
          }
          return prev;
        });
      }, speed);
    } else {
      setDisplayText(text);
      setRevealedIndices(new Set());
      setIsScrambling(false);
    }

    return () => clearInterval(interval);
  }, [isHovering, text, speed, maxIterations, sequential, getNextIndex]);

  useEffect(() => {
    if (animateOn !== "view" && animateOn !== "both") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsHovering(true);
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1 },
    );
    const el = containerRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [animateOn, hasAnimated]);

  const hoverProps =
    animateOn === "hover" || animateOn === "both"
      ? {
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => setIsHovering(false),
        }
      : {};

  return (
    <span
      ref={containerRef}
      className="inline-block whitespace-pre-wrap"
      {...hoverProps}
    >
      <span className="sr-only">{displayText}</span>
      <span aria-hidden="true">
        {displayText.split("").map((char, i) => {
          const isRevealed =
            revealedIndices.has(i) || !isScrambling || !isHovering;
          return (
            <span
              key={i}
              className={isRevealed ? className : encryptedClassName || "opacity-50"}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
