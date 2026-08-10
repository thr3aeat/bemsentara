function parseTurkeyTimeToDate(timeVal) {
  if (!timeVal) return null;
  if (timeVal instanceof Date) return timeVal;
  if (typeof timeVal !== "string") return null;

  const str = timeVal.trim();
  if (!str) return null;

  const now = new Date();

  // 1. Check for full date + time TR: e.g. "10.08.2026 - 20:00", "10/08/2026 20:00"
  let match = str.match(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{4}).*?(\d{1,2})[:.](\d{2})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    return new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0));
  }

  // 2. ISO format: "2026-08-10 20:00"
  match = str.match(/(\d{4})[\.\/\-](\d{1,2})[\.\/\-](\d{1,2}).*?(\d{1,2})[:.](\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const hours = parseInt(match[4], 10);
    const minutes = parseInt(match[5], 10);
    return new Date(Date.UTC(year, month - 1, day, hours - 3, minutes, 0));
  }

  // 3. Time only: e.g. "20:00", "20.00", "Saat 20:00", "20:00'da"
  match = str.match(/(\d{1,2})[:.](\d{2})/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    // Get current Turkey date (UTC + 3)
    const nowTrMs = now.getTime() + (3 * 3600 * 1000);
    const trNowDate = new Date(nowTrMs);
    const year = trNowDate.getUTCFullYear();
    const month = trNowDate.getUTCMonth();
    const day = trNowDate.getUTCDate();

    return new Date(Date.UTC(year, month, day, hours - 3, minutes, 0));
  }

  return null;
}

const samples = [
  "20:00",
  "Saat 20:00",
  "20:00'da",
  "10.08.2026 20:00",
  "10.08.2026 - 20:00",
  "2026-08-10 20:00"
];

for (const s of samples) {
  const d = parseTurkeyTimeToDate(s);
  const diffMin = d ? Math.round((d.getTime() - Date.now()) / 60000) : null;
  console.log(s, "=> UTC ISO:", d ? d.toISOString() : "NULL", "| diffMin:", diffMin);
}
