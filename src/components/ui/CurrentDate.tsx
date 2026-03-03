"use client";

import { useState, useEffect } from "react";

export function CurrentDate() {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(
      new Date()
        .toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    );
  }, []);

  return <>{date}</>;
}
