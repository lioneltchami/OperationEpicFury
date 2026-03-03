"use client";

import { useEffect, useState } from "react";

export function CurrentDate() {
  const [date, setDate] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: avoids hydration mismatch by setting client-only date after mount
    setDate(
      new Date()
        .toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase(),
    );
  }, []);

  return <>{date}</>;
}
