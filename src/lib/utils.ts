import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format amount in Ghana Cedis (GHS)
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "GH₵ 1,234.56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    currencyDisplay: 'symbol'
  }).format(amount);
}

// Ensures the Ghana cedi symbol appears as GH₵ even when environments fall back to "GHS"
export function formatCurrencyGh(amount: number): string {
  let formatted = formatCurrency(amount);
  // Normalize any Ghana currency prefixes to the cedi sign only
  // Replace "GHS" and "GH₵" and any spaced variants with "₵"
  formatted = formatted.replace(/GHS\s*/g, '₵');
  formatted = formatted.replace(/GH₵\s*/g, '₵');
  // Some environments insert a non-breaking space between currency and amount; keep spacing as is after the symbol
  // Ensure the symbol is the first non-space character
  return formatted.replace(/^\s*/, '').replace(/^₵\s*/, '₵');
}

/**
 * Count weekdays (Monday-Friday) between two dates, inclusive
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Number of weekdays between the dates
 */
export function countWeekdays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}
