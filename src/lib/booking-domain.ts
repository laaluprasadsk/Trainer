// All marketplace wall-clock dates use Asia/Kolkata (UTC+05:30, no DST).
export const TIME_ZONE = "Asia/Kolkata";
export function todayInKolkata(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function slotInstant(date: Date | string, time: string) {
  return new Date(
    `${typeof date === "string" ? date.slice(0, 10) : date.toISOString().slice(0, 10)}T${time.slice(0, 5)}:00+05:30`,
  );
}
export function validWindow(
  date: string,
  start: string,
  end: string,
  now = new Date(),
) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(new Date(date).getTime()) &&
    new Date(date).toISOString().slice(0, 10) === date &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(start) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(end) &&
    start < end &&
    slotInstant(date, start) > now
  );
}
export function overlaps(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}
export function pricing(
  rate: number,
  start: string,
  end: string,
  commissionBps = 1500,
) {
  const minutes = (t: string) =>
    Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const grossPaise = Math.round(
    (rate * 100 * (minutes(end) - minutes(start))) / 60,
  );
  const feePaise = Math.round((grossPaise * commissionBps) / 10000);
  return {
    totalAmount: grossPaise / 100,
    platformFee: feePaise / 100,
    trainerPayout: (grossPaise - feePaise) / 100,
  };
}
