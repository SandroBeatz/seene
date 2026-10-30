/**
 * Countries the phone field offers next to the number (design "Новый клиент":
 * «KG +996 ⌄»), named in the app's three languages. Any other country still works:
 * a number typed with "+" picks its country from the calling code.
 */
import type { AppLocale } from '@/shared/lib/i18n';

export interface CountryEntry {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: Record<AppLocale, string>;
}

const c = (code: string, ru: string, en: string, fr: string): CountryEntry => ({
  code,
  name: { ru, en, fr },
});

export const PHONE_COUNTRIES: readonly CountryEntry[] = [
  c('KG', 'Кыргызстан', 'Kyrgyzstan', 'Kirghizistan'),
  c('KZ', 'Казахстан', 'Kazakhstan', 'Kazakhstan'),
  c('UZ', 'Узбекистан', 'Uzbekistan', 'Ouzbékistan'),
  c('TJ', 'Таджикистан', 'Tajikistan', 'Tadjikistan'),
  c('TM', 'Туркменистан', 'Turkmenistan', 'Turkménistan'),
  c('RU', 'Россия', 'Russia', 'Russie'),
  c('BY', 'Беларусь', 'Belarus', 'Biélorussie'),
  c('UA', 'Украина', 'Ukraine', 'Ukraine'),
  c('MD', 'Молдова', 'Moldova', 'Moldavie'),
  c('GE', 'Грузия', 'Georgia', 'Géorgie'),
  c('AM', 'Армения', 'Armenia', 'Arménie'),
  c('AZ', 'Азербайджан', 'Azerbaijan', 'Azerbaïdjan'),
  c('TR', 'Турция', 'Türkiye', 'Turquie'),
  c('AE', 'ОАЭ', 'United Arab Emirates', 'Émirats arabes unis'),
  c('SA', 'Саудовская Аравия', 'Saudi Arabia', 'Arabie saoudite'),
  c('QA', 'Катар', 'Qatar', 'Qatar'),
  c('IL', 'Израиль', 'Israel', 'Israël'),
  c('CY', 'Кипр', 'Cyprus', 'Chypre'),
  c('DE', 'Германия', 'Germany', 'Allemagne'),
  c('FR', 'Франция', 'France', 'France'),
  c('IT', 'Италия', 'Italy', 'Italie'),
  c('ES', 'Испания', 'Spain', 'Espagne'),
  c('PT', 'Португалия', 'Portugal', 'Portugal'),
  c('NL', 'Нидерланды', 'Netherlands', 'Pays-Bas'),
  c('BE', 'Бельгия', 'Belgium', 'Belgique'),
  c('CH', 'Швейцария', 'Switzerland', 'Suisse'),
  c('AT', 'Австрия', 'Austria', 'Autriche'),
  c('PL', 'Польша', 'Poland', 'Pologne'),
  c('CZ', 'Чехия', 'Czechia', 'Tchéquie'),
  c('GB', 'Великобритания', 'United Kingdom', 'Royaume-Uni'),
  c('IE', 'Ирландия', 'Ireland', 'Irlande'),
  c('SE', 'Швеция', 'Sweden', 'Suède'),
  c('NO', 'Норвегия', 'Norway', 'Norvège'),
  c('FI', 'Финляндия', 'Finland', 'Finlande'),
  c('DK', 'Дания', 'Denmark', 'Danemark'),
  c('GR', 'Греция', 'Greece', 'Grèce'),
  c('RS', 'Сербия', 'Serbia', 'Serbie'),
  c('ME', 'Черногория', 'Montenegro', 'Monténégro'),
  c('LT', 'Литва', 'Lithuania', 'Lituanie'),
  c('LV', 'Латвия', 'Latvia', 'Lettonie'),
  c('EE', 'Эстония', 'Estonia', 'Estonie'),
  c('US', 'США', 'United States', 'États-Unis'),
  c('CA', 'Канада', 'Canada', 'Canada'),
  c('MX', 'Мексика', 'Mexico', 'Mexique'),
  c('BR', 'Бразилия', 'Brazil', 'Brésil'),
  c('AR', 'Аргентина', 'Argentina', 'Argentine'),
  c('AU', 'Австралия', 'Australia', 'Australie'),
  c('NZ', 'Новая Зеландия', 'New Zealand', 'Nouvelle-Zélande'),
  c('CN', 'Китай', 'China', 'Chine'),
  c('KR', 'Южная Корея', 'South Korea', 'Corée du Sud'),
  c('JP', 'Япония', 'Japan', 'Japon'),
  c('TH', 'Таиланд', 'Thailand', 'Thaïlande'),
  c('VN', 'Вьетнам', 'Vietnam', 'Viêt Nam'),
  c('ID', 'Индонезия', 'Indonesia', 'Indonésie'),
  c('MY', 'Малайзия', 'Malaysia', 'Malaisie'),
  c('SG', 'Сингапур', 'Singapore', 'Singapour'),
  c('IN', 'Индия', 'India', 'Inde'),
  c('EG', 'Египет', 'Egypt', 'Égypte'),
  c('MA', 'Марокко', 'Morocco', 'Maroc'),
  c('MN', 'Монголия', 'Mongolia', 'Mongolie'),
];

const BY_CODE = new Map(PHONE_COUNTRIES.map((entry) => [entry.code, entry]));

/** The country's name, or its code when it is not in the list. */
export function countryName(code: string, locale: AppLocale): string {
  return BY_CODE.get(code)?.name[locale] ?? code;
}
