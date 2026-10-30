/**
 * "Первые шаги" on a fresh "Сегодня" (design "Сегодня · первый день"): three setup
 * steps, each done once the data shows it. Pure; the block hides when all are done.
 */

export type FirstStepId = 'prices' | 'clients' | 'profile';

export interface FirstStep {
  id: FirstStepId;
  done: boolean;
  /** Prices: active services still at 0 (onboarding stores "no price" as 0). */
  unpriced?: number;
}

export interface FirstStepsInput {
  services: readonly { is_active: boolean; price: number }[];
  clientCount: number;
  profile: { avatar_url: string | null; cover_url: string | null; bio: string | null } | null;
}

export interface FirstStepsState {
  steps: FirstStep[];
  doneCount: number;
  /** All done: the block is not shown. */
  complete: boolean;
}

export function firstSteps({ services, clientCount, profile }: FirstStepsInput): FirstStepsState {
  const unpriced = services.filter((s) => s.is_active && s.price <= 0).length;
  const steps: FirstStep[] = [
    { id: 'prices', done: unpriced === 0, unpriced },
    { id: 'clients', done: clientCount > 0 },
    {
      id: 'profile',
      done: !!profile?.avatar_url && !!profile.cover_url && !!profile.bio?.trim(),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return { steps, doneCount, complete: doneCount === steps.length };
}

export type GreetingPeriod = 'morning' | 'day' | 'evening' | 'night';

/** "Доброе утро / Добрый день / Добрый вечер / Доброй ночи" by the master's local hour. */
export function greetingPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 23) return 'evening';
  return 'night';
}
