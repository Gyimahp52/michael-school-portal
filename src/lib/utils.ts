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
  const formatted = formatCurrency(amount);
  // Replace common fallbacks (e.g., "GHS" or narrow no-break space variants) with GH₵
  return formatted.replace('GHS', 'GH₵');
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
