const TZ = "Asia/Manila";

export function formatPHFull(d: string | Date): string {
  const date = new Date(d);
  const datePart = date.toLocaleDateString("en-PH", { timeZone: TZ, year: "numeric", month: "short", day: "numeric" });
  const timePart = date.toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart} · ${timePart}`;
}

export function formatPHShort(d: string | Date): string {
  const date = new Date(d);
  const datePart = date.toLocaleDateString("en-PH", { timeZone: TZ, month: "short", day: "numeric" });
  const timePart = date.toLocaleTimeString("en-PH", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true });
  return `${datePart} · ${timePart}`;
}

export function formatPHDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-PH", {
    timeZone: TZ,
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function formatPHDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-PH", {
    timeZone: TZ,
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatPHMonthDay(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-PH", {
    timeZone: TZ,
    month: "short", day: "2-digit",
  });
}

export function formatPHDateSearch(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-PH", {
    timeZone: TZ,
    year: "numeric", month: "short", day: "2-digit",
  }).toLowerCase();
}

export function getPHMonthLabel(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-PH", {
    timeZone: TZ,
    year: "numeric", month: "short",
  });
}

export function getPHMonthTimestamp(d: string | Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric", month: "2-digit",
  }).formatToParts(new Date(d));
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1;
  return new Date(year, month, 1).getTime();
}
