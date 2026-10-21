const WORDS_PER_MINUTE = 230;

const formatter = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });

const dayMonth = formatter({ month: "short", day: "numeric" });
const dayMonthYear = formatter({ month: "short", day: "numeric", year: "numeric" });
const fullDate = formatter({ month: "long", day: "numeric", year: "numeric" });

export const formatDayMonth = (date: Date) => dayMonth.format(date);
export const formatDayMonthYear = (date: Date) => dayMonthYear.format(date);
export const formatFullDate = (date: Date) => fullDate.format(date);
export const formatIsoDate = (date: Date) => date.toISOString().slice(0, 10);
export const yearOf = (date: Date) => date.getUTCFullYear();

export function readingMinutes(markdown: string) {
  const words = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export const pluralize = (count: number, singular: string) => `${count} ${singular}${count === 1 ? "" : "s"}`;
