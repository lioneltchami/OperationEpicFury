/**
 * Parse a timeET string which may be:
 *   - "HH:MM"            (legacy, assumes 2026-02-28)
 *   - "YYYY-MM-DD HH:MM" (new format with date)
 */
export function parseTimeET(timeET: string): { date: string; time: string } {
  const parts = timeET.trim().split(" ");
  if (parts.length === 2) {
    return { date: parts[0], time: parts[1] };
  }
  // Legacy: bare HH:MM — assume 2026-02-28
  return { date: "2026-02-28", time: parts[0] };
}

export function etToTehran(timeET: string): string {
  const { date, time } = parseTimeET(timeET);
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // ET to Tehran: add 8 hours 30 minutes (EST=UTC-5, IRST=UTC+3:30)
  let tehranMinute = minute + 30;
  let tehranHour = hour + 8;
  if (tehranMinute >= 60) {
    tehranMinute -= 60;
    tehranHour += 1;
  }

  // Handle day rollover
  let dayOffset = 0;
  if (tehranHour >= 24) {
    tehranHour -= 24;
    dayOffset = 1;
  }

  // Compute Tehran date
  const [y, m, d] = date.split("-").map(Number);
  const etDate = new Date(y, m - 1, d);
  etDate.setDate(etDate.getDate() + dayOffset);
  const tehranDate = `${etDate.getFullYear()}-${String(etDate.getMonth() + 1).padStart(2, "0")}-${String(etDate.getDate()).padStart(2, "0")}`;

  const tehranTime = `${String(tehranHour).padStart(2, "0")}:${String(tehranMinute).padStart(2, "0")}`;
  return `${tehranDate} ${tehranTime}`;
}

/** Extract just the time portion for compact display */
export function formatTime(timeET: string): string {
  const { time } = parseTimeET(timeET);
  return time;
}

/** Extract just the date portion */
export function formatDate(timeET: string): string {
  const { date } = parseTimeET(timeET);
  return date;
}

/** Format date for display (e.g., "Feb 28" or "Mar 1") */
export function formatDateLabel(timeET: string): string {
  const { date } = parseTimeET(timeET);
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Format Tehran date for display */
export function formatTehranDateLabel(timeET: string): string {
  const tehran = etToTehran(timeET);
  const [date] = tehran.split(" ");
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Convert an ET (America/New_York) time string to a UTC Date object.
 * Handles EST/EDT transitions automatically via the Intl API.
 */
export function etToDate(timeET: string): Date {
  const { date, time } = parseTimeET(timeET);
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);

  // Use the ET values as a UTC probe to discover the NY offset
  const probeUtc = Date.UTC(y, mo - 1, d, h, mi, 0);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(probeUtc));

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");
  const nyMo = get("month");
  const nyD = get("day");
  let nyH = get("hour");
  if (nyH === 24) nyH = 0;
  const nyM = get("minute");

  // Determine day offset between probe UTC date and NY date
  const probeDateNum = mo * 100 + d;
  const nyDateNum = nyMo * 100 + nyD;
  let dayDiff = 0;
  if (nyDateNum > probeDateNum) dayDiff = 1;
  else if (nyDateNum < probeDateNum) dayDiff = -1;

  const offsetMin = (nyH - h) * 60 + (nyM - mi) + dayDiff * 24 * 60;

  return new Date(probeUtc - offsetMin * 60 * 1000);
}
