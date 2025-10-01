// Date utility functions for consistent date handling

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get current date and time in ISO string format
 */
export const getCurrentDateTime = (): string => {
  return new Date().toISOString();
};

/**
 * Convert date to YYYY-MM-DD format
 */
export const formatDateOnly = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Get month string in YYYY-MM format
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
};

/**
 * Parse date string and return Date object
 */
export const parseDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Check if two dates are on the same day
 */
export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

  return formatDateOnly(d1) === formatDateOnly(d2);
};

/**
 * Get date range for a specific month
 */
export const getMonthRange = (year: number, month: number) => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return { monthStart, monthEnd };
};