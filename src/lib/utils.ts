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
