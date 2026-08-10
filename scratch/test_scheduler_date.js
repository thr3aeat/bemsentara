function parseTimeToDate(timeVal) {
  if (!timeVal) return null;
  if (timeVal instanceof Date) return timeVal;
  if (typeof timeVal !== "string") return null;

  const str = timeVal.trim();
  if (!str) return null;

  // 1. Time only: "20:00" or "20.00"
  const timeOnlyMatch = str.match(/^(\d{1,2})[:.](\d{2})$/);
  if (timeOnlyMatch) {
    const hours = parseInt(timeOnlyMatch[1], 10);
    const minutes = parseInt(timeOnlyMatch[2], 10);
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    return target;
  }

  // 2. Turkish Date Format: "11.08.2026 20:00" or "11/08/2026 20:00" or "11.08.2026 20.00"
  const trMatch = str.match(/^(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})\s+(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/);
  if (trMatch) {
    const day = parseInt(trMatch[1], 10);
    const month = parseInt(trMatch[2], 10) - 1;
    const year = parseInt(trMatch[3], 10);
    const hours = parseInt(trMatch[4], 10);
    const minutes = parseInt(trMatch[5], 10);
    const seconds = trMatch[6] ? parseInt(trMatch[6], 10) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }

  // 3. Standard ISO / YYYY-MM-DD HH:mm: "2026-08-11 20:00" or "2026-08-11T20:00"
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[\sT](\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const hours = parseInt(isoMatch[4], 10);
    const minutes = parseInt(isoMatch[5], 10);
    const seconds = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
    return new Date(year, month, day, hours, minutes, seconds);
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  return null;
}

const tests = [
  "2026-08-11 20:00",
  "11.08.2026 20:00",
  "11/08/2026 20.00",
  "20:00",
  "20.30"
];

for (const t of tests) {
  console.log(t, "=>", parseTimeToDate(t)?.toLocaleString("tr-TR"));
}
