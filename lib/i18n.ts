import { en } from '../translations/en';
import { hi } from '../translations/hi';
import { Dictionary } from '../translations/en';

export type Locale = 'en' | 'hi';

export function getDictionary(locale: Locale): Dictionary {
  return locale === 'hi' ? hi : en;
}
