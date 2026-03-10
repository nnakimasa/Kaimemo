/**
 * Convert Date to ISO 8601 string
 */
export const toISO = (date: Date): string => date.toISOString();

/**
 * Convert ISO 8601 string to Date
 */
export const fromISO = (str: string): Date => new Date(str);

/**
 * Get current timestamp as ISO 8601 string
 */
export const nowISO = (): string => new Date().toISOString();

/**
 * Get current timestamp as Unix milliseconds
 */
export const nowUnix = (): number => Date.now();

/**
 * Check if a date string is expired
 */
export const isExpired = (dateStr: string): boolean => {
  return new Date(dateStr).getTime() < Date.now();
};

/**
 * Add duration to a date
 */
export const addDuration = (
  date: Date,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days'
): Date => {
  const ms = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
  }[unit];

  return new Date(date.getTime() + amount * ms);
};

/**
 * Format date for display (simple format)
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time for display
 */
export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
