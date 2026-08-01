import { operatorArabic } from './ar';
import { operatorEnglish } from './en';

export const operatorTranslations = {
  ar: operatorArabic,
  en: operatorEnglish,
} as const;

export type OperatorLocale = keyof typeof operatorTranslations;
