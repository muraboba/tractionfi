import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as USD currency
 * @param value The number to format
 * @param options Optional configuration options
 * @returns Formatted currency string with $ symbol and commas
 */
export function formatCurrency(value: number | null | undefined, options?: {
  showCents?: boolean;
  showNegativeParentheses?: boolean;
}): string {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return '$0.00';
  }

  const showCents = options?.showCents ?? true;
  const showNegativeParentheses = options?.showNegativeParentheses ?? false;
  
  // Format with Intl.NumberFormat for proper thousands separators
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  });
  
  // Handle negative numbers with parentheses if requested
  if (showNegativeParentheses && value < 0) {
    return `(${formatter.format(Math.abs(value))})`;
  }
  
  return formatter.format(value);
}

/**
 * Format a number as USD currency for input fields
 * @param value The number to format
 * @returns Formatted currency string without $ symbol but with commas
 */
export function formatCurrencyInput(value: number | string | null | undefined): string {
  // Handle empty, null, or undefined values
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  // Convert string to number if needed
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN
  if (isNaN(numValue)) {
    return '';
  }
  
  // Format with Intl.NumberFormat for proper thousands separators, but without currency symbol
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Parse a formatted currency string back to a number
 * @param value The formatted currency string to parse
 * @returns The parsed number value
 */
export function parseCurrencyInput(value: string): number {
  // Remove all non-numeric characters except decimal point and minus sign
  const cleanedValue = value.replace(/[^0-9.-]/g, '');
  
  // Parse the cleaned value to a float
  const parsedValue = parseFloat(cleanedValue);
  
  // Return 0 if the result is NaN
  return isNaN(parsedValue) ? 0 : parsedValue;
}
