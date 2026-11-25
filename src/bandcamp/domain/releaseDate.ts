export function isCalendarDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().startsWith(value)
  );
}

export function publishedDay(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  const inputDay = value.slice(0, 10);
  if (
    !Number.isFinite(date.getTime()) ||
    (/^\d{4}-\d{2}-\d{2}$/.test(inputDay) && !isCalendarDay(inputDay))
  )
    return undefined;
  return date.toISOString().slice(0, 10);
}

export function localCalendarDay(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
