import { localCalendarDay } from 'src/bandcamp/domain/releaseDate';

export function watchLocalCalendarDay(onChange: () => void): () => void {
  let day: string | undefined;
  let timer: ReturnType<typeof setTimeout>;
  const checkDate = () => {
    clearTimeout(timer);
    const now = new Date();
    const today = localCalendarDay(now);
    const changed = day !== undefined && today !== day;
    day = today;
    if (changed) onChange();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);
    timer = setTimeout(checkDate, nextDay.getTime() - now.getTime());
  };

  checkDate();
  window.addEventListener('focus', checkDate);
  document.addEventListener('visibilitychange', checkDate);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('focus', checkDate);
    document.removeEventListener('visibilitychange', checkDate);
  };
}
