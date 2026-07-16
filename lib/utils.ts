import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses GPMS Date string (dd/MM/yyyy HH:mm:ss) into a JS Date object safely.
 * If the string doesn't match this format, falls back to standard JS parsing.
 */
export function parseGPMSDate(dateStr: string): Date {
  if (!dateStr) return new Date();

  // GPMS Format from Apps Script: "16/07/2026 20:30:45"
  const parts = dateStr.split(' ');
  if (parts.length === 2) {
    const [datePart, timePart] = parts;
    const dateParts = datePart.split('/');
    
    if (dateParts.length === 3) {
      const [day, month, year] = dateParts;
      const timeParts = timePart.split(':');
      
      const hours = timeParts[0] ? Number(timeParts[0]) : 0;
      const minutes = timeParts[1] ? Number(timeParts[1]) : 0;
      const seconds = timeParts[2] ? Number(timeParts[2]) : 0;

      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        hours,
        minutes,
        seconds
      );
    }
  }

  // Fallback for standard ISO dates or other formats
  return new Date(dateStr);
}
