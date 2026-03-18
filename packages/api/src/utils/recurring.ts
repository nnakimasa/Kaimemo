/**
 * Recurring list schedule calculation utilities
 * weekday: 0=Mon, 1=Tue, ..., 5=Sat, 6=Sun  (same as Prisma model)
 * JS Date.getDay(): 0=Sun, 1=Mon, ..., 6=Sat
 */

function toJsWeekday(weekday: number): number {
  // 0=Mon→1, 1=Tue→2, ..., 5=Sat→6, 6=Sun→0
  return (weekday + 1) % 7;
}

/**
 * Find the next date where the weekday matches, starting from `from` (exclusive if same day)
 * If sameDay=true, returns `from` itself if it matches.
 */
function nextWeekdayFrom(jsWeekday: number, from: Date, sameDay = false): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const cur = d.getDay();
  let diff = (jsWeekday - cur + 7) % 7;
  if (diff === 0 && !sameDay) diff = 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Find the Nth occurrence of a weekday in a given month/year.
 * Returns null if Nth occurrence doesn't exist (e.g., 5th Friday in a short month).
 */
function nthWeekdayOfMonth(year: number, month: number, jsWeekday: number, nth: number): Date | null {
  const d = new Date(year, month, 1);
  let count = 0;
  while (d.getMonth() === month) {
    if (d.getDay() === jsWeekday) {
      count++;
      if (count === nth) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
  }
  return null; // Nth doesn't exist this month
}

/**
 * Calculate the next shopping date based on the schedule.
 * `after`: shopping date must be strictly after this date (default: now)
 */
export function calcNextShoppingDate(
  frequency: string,
  weekday: number,
  monthlyWeek: number,
  after: Date = new Date()
): Date {
  const jsWd = toJsWeekday(weekday);
  const afterDay = new Date(after);
  afterDay.setHours(0, 0, 0, 0);

  if (frequency === 'weekly') {
    return nextWeekdayFrom(jsWd, afterDay, false);
  }

  if (frequency === 'biweekly') {
    // Find the next occurrence (nearest), not caring about which week exactly.
    // For true bi-weekly, we'd need lastGeneratedAt, but approximate is fine.
    return nextWeekdayFrom(jsWd, afterDay, false);
  }

  // monthly: find next Nth weekday of month
  for (let monthOffset = 0; monthOffset <= 2; monthOffset++) {
    const yr = afterDay.getFullYear();
    const mo = afterDay.getMonth() + monthOffset;
    const candidate = nthWeekdayOfMonth(yr + Math.floor(mo / 12), mo % 12, jsWd, monthlyWeek);
    if (candidate && candidate > afterDay) return candidate;
  }

  // Fallback: 1 month from now
  const fallback = new Date(afterDay);
  fallback.setMonth(fallback.getMonth() + 1);
  return fallback;
}

/**
 * Calculate the generation date = shoppingDate - daysBefore days.
 * daysBefore=0 means 1 month before.
 */
export function calcNextGenerationDate(
  frequency: string,
  weekday: number,
  monthlyWeek: number,
  daysBefore: number,
  after: Date = new Date()
): Date {
  // We need the shopping date to be > (after + daysBefore)
  // So find a shopping date such that shoppingDate - daysBefore > after
  let shoppingDate = calcNextShoppingDate(frequency, weekday, monthlyWeek, after);

  const offsetDays = daysBefore === 0 ? 30 : daysBefore;
  let genDate = new Date(shoppingDate);
  genDate.setDate(genDate.getDate() - offsetDays);

  // If generation date is already past, find the next shopping date
  if (genDate <= after) {
    shoppingDate = calcNextShoppingDate(frequency, weekday, monthlyWeek, shoppingDate);
    genDate = new Date(shoppingDate);
    genDate.setDate(genDate.getDate() - offsetDays);
  }

  return genDate;
}

/**
 * Human-readable schedule label (Japanese)
 */
export function scheduleLabel(
  frequency: string,
  weekday: number,
  monthlyWeek: number,
  daysBefore: number,
  reminderTime: string | null
): string {
  const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
  const NTH = ['第1', '第2', '第3', '第4', '第5'];

  let shoppingDay: string;
  if (frequency === 'weekly') shoppingDay = `毎週${WEEKDAYS[weekday]}曜`;
  else if (frequency === 'biweekly') shoppingDay = `隔週${WEEKDAYS[weekday]}曜`;
  else shoppingDay = `毎月${NTH[monthlyWeek - 1]}${WEEKDAYS[weekday]}曜`;

  const gen = daysBefore === 0 ? '1ヶ月前' : `${daysBefore}日前`;
  const reminder = reminderTime ? `${reminderTime} リマインド` : 'リマインドなし';
  return `${shoppingDay} ／ ${gen}に生成 ／ ${reminder}`;
}
