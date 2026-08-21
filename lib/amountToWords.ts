/**
 * Converts a numeric amount to Indian English words format.
 * e.g. 501  → "Rupees five hundred one only"
 * e.g. 1001 → "Rupees one thousand one only"
 * Supports amounts up to 99,99,99,999.
 */

const ones = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const tens = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

function convertHundreds(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) {
    const t = tens[Math.floor(n / 10)];
    const o = ones[n % 10];
    return o ? `${t} ${o}` : t;
  }
  const h = ones[Math.floor(n / 100)];
  const rest = n % 100;
  const restStr = convertHundreds(rest);
  return restStr ? `${h} hundred ${restStr}` : `${h} hundred`;
}

function convertBelowLakh(n: number): string {
  if (n < 1000) return convertHundreds(n);
  const thousands = Math.floor(n / 1000);
  const remainder = n % 1000;
  const thousandsStr = convertHundreds(thousands);
  const remainderStr = convertHundreds(remainder);
  return remainderStr
    ? `${thousandsStr} thousand ${remainderStr}`
    : `${thousandsStr} thousand`;
}

/**
 * Converts a whole number to Indian English words.
 * Handles crores, lakhs, thousands, hundreds.
 */
function numberToWords(n: number): string {
  if (n === 0) return 'zero';

  let result = '';

  if (n >= 10_000_000) {
    const crores = Math.floor(n / 10_000_000);
    result += convertHundreds(crores) + ' crore ';
    n = n % 10_000_000;
  }

  if (n >= 100_000) {
    const lakhs = Math.floor(n / 100_000);
    result += convertHundreds(lakhs) + ' lakh ';
    n = n % 100_000;
  }

  if (n > 0) {
    result += convertBelowLakh(n);
  }

  return result.trim();
}

/**
 * Formats an amount as a complete donation receipt phrase.
 * amountToWords(501)  → "Rupees five hundred one only"
 * amountToWords(1001) → "Rupees one thousand one only"
 */
export function amountToWords(amount: number | string): string {
  const num = Math.floor(Number(amount));
  if (isNaN(num) || num < 0) return '';
  if (num === 0) return 'Rupees zero only';
  const words = numberToWords(num);
  // Capitalize first letter
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `Rupees ${capitalized} only`;
}
