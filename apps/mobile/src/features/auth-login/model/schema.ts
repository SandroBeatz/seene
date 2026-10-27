/** Email-step validation (Zod doubles as the DTO validator — docs/state-management.md §4). */
import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email();

/** The normalized email, or null when it is not a valid address. */
export function parseEmail(value: string): string | null {
  const result = emailSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** Length of the emailed one-time code (Supabase → Auth → Email OTP Length). */
export const EMAIL_CODE_LENGTH = 6;
