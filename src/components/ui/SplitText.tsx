import React from "react";

export const SplitText = ({
  text,
  className = "",
  delay = 0,
  splitBy = "letter",
}: {
  text: string;
  className?: string;
  delay?: number;
  splitBy?: "letter" | "word";
}) => {
  if (splitBy === "word") {
    const words = text.split(" ");
    return (
      <span className={className} aria-label={text}>
        {words.map((word, i) => (
          <span
            key={i}
            className="inline-block"
            style={{
              animation: `split-text-in 0.4s ease-out ${delay + i * 0.08}s both`,
            }}
          >
            {word}
            {i < words.length - 1 && "\u00A0"}
          </span>
        ))}
      </span>
    );
  }

  const letters = text.split("");
  return (
    <span className={className} aria-label={text}>
      {letters.map((letter, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            animation: `split-text-in 0.4s ease-out ${delay + i * 0.03}s both`,
            whiteSpace: letter === " " ? "pre" : undefined,
          }}
        >
          {letter}
        </span>
      ))}
    </span>
  );
};
