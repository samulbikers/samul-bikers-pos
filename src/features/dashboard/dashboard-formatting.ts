export function formatKes(value: number) {
  const amount = new Intl.NumberFormat("en-KE", {
    maximumFractionDigits: 0,
  }).format(value);

  return `KES ${amount}`;
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

export function formatKshCompact(value: number) {
  const amount = new Intl.NumberFormat("en-KE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return `KES ${amount}`;
}