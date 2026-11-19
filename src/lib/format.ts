const kesFormatter = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

export function formatKes(value: number) {
  return `KES ${kesFormatter.format(value)}`;
}

export function formatKesCompact(value: number) {
  const amount = new Intl.NumberFormat("en-KE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return `KES ${amount}`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function formatPercent(value: number, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`;
}

const nairobiDateFormatter = new Intl.DateTimeFormat("en-KE", {
  timeZone: "Africa/Nairobi",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatNairobiDate(date: Date) {
  return nairobiDateFormatter.format(date);
}

const shortDateFormatter = new Intl.DateTimeFormat("en-KE", {
  timeZone: "Africa/Nairobi",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(date: Date | string) {
  return shortDateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
