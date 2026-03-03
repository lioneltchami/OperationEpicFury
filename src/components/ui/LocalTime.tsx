"use client";

import { useEffect, useState } from "react";
import { etToDate, parseTimeET, formatDateLabel } from "@/lib/time-utils";

type Props = {
  timeET: string;
  showDate?: boolean;
};

function computeLocalDisplay(timeET: string, showDate: boolean): string {
  if (!timeET || !timeET.includes(":")) return timeET || "—";
  const date = etToDate(timeET);
  if (isNaN(date.getTime())) return timeET;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    ...(showDate ? { month: "short", day: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  let result = "";
  if (showDate) {
    result += `${get("month")} ${get("day")} `;
  }
  let hour = get("hour");
  if (hour === "24") hour = "00";
  result += `${hour}:${get("minute")} ${get("timeZoneName")}`;
  return result;
}

function ssrFallback(timeET: string, showDate: boolean): string {
  if (!timeET || !timeET.includes(":")) return timeET || "—";
  const { time } = parseTimeET(timeET);
  const dateLabel = showDate ? formatDateLabel(timeET) + " " : "";
  return `${dateLabel}${time} ET`;
}

export function LocalTime({ timeET, showDate = true }: Props) {
  const [display, setDisplay] = useState(() => ssrFallback(timeET, showDate));

  useEffect(() => {
    setDisplay(computeLocalDisplay(timeET, showDate));
  }, [timeET, showDate]);

  return <>{display}</>;
}
