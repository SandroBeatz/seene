/** Auth form schema (Zod doubles as the DTO validator — docs/state-management.md §4). */
import { z } from 'zod';

export type AuthMode = 'signIn' | 'signUp';

export const authSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8),
    confirm: z.string().optional(),
    mode: z.enum(['signIn', 'signUp']),
  })
  .refine((v) => v.mode === 'signIn' || v.password === v.confirm, {
    path: ['confirm'],
    message: 'passwords_mismatch',
  });

export type AuthFormValues = z.infer<typeof authSchema>;
