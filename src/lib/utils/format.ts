import { formatDistanceToNow, format, parseISO } from 'date-fns';

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

/**
 * Format a date to a standard display format
 */
export function formatDate(
  date: string | Date,
  formatStr = 'MMM d, yyyy'
): string {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
}

/**
 * Format currency with proper locale
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  // Preserve the established display convention for EUR callers that omit a
  // locale, while explicit locale selection (including Arabic UI surfaces)
  // remains authoritative.
  const resolvedLocale = locale === 'en-US' && currency === 'EUR' ? 'de-DE' : locale;
  return new Intl.NumberFormat(resolvedLocale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a number with locale
 */
export function formatNumber(num: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}
