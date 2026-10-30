/**
 * The client card: name, messengers, birthday. Pure; the database enforces the same
 * shapes (migration 20261030220000_client_card).
 */
import type { Client } from '../model/types';

type Named = Pick<Client, 'first_name' | 'last_name'>;

export function clientName(client: Named): string {
  return [client.first_name, client.last_name].filter(Boolean).join(' ');
}

const TELEGRAM = /^[A-Za-z0-9_]{5,32}$/;
const INSTAGRAM = /^[A-Za-z0-9._]{1,30}$/;

/** A pasted handle or profile link → the bare username ('@anna', 't.me/anna' → 'anna'). */
function bareHandle(input: string, hosts: readonly string[]): string {
  let value = input.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  for (const host of hosts) {
    if (value.toLowerCase().startsWith(`${host}/`)) value = value.slice(host.length + 1);
  }
  return value.replace(/^@/, '').replace(/[/?#].*$/, '');
}

/** Telegram username or null when it can't be one (5–32 letters, digits, "_"). */
export function normalizeTelegram(input: string): string | null {
  const value = bareHandle(input, ['t.me', 'telegram.me']);
  return TELEGRAM.test(value) ? value : null;
}

/** Instagram username or null (1–30 letters, digits, "." and "_"). */
export function normalizeInstagram(input: string): string | null {
  const value = bareHandle(input, ['instagram.com']).toLowerCase();
  return INSTAGRAM.test(value) ? value : null;
}

export function telegramUrl(username: string): string {
  return `https://t.me/${username}`;
}

export function instagramUrl(username: string): string {
  return `https://instagram.com/${username}`;
}

const MONTH_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Day of a month, any year (29 February allowed). */
export function isValidBirthday(day: number, month: number): boolean {
  return month >= 1 && month <= 12 && day >= 1 && day <= MONTH_DAYS[month - 1];
}

export function daysInBirthMonth(month: number): number {
  return MONTH_DAYS[month - 1] ?? 31;
}
