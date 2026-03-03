"use client";

export function ShinyText({
  text,
  className = "",
  speed = 3,
  color = "#71717a",
  shineColor = "#ffffff",
}: {
  text: string;
  className?: string;
  speed?: number;
  color?: string;
  shineColor?: string;
}) {
  return (
    <span
      className={`shiny-text ${className}`}
      style={
        {
          "--shine-speed": `${speed}s`,
          "--shine-color": color,
          "--shine-highlight": shineColor,
        } as React.CSSProperties
      }
    >
      {text}
    </span>
  );
}
