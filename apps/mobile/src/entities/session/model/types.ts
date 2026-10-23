/**
 * The lightweight profile the auth/onboarding guard + session store hold.
 * A trimmed projection of `master_profile` (docs/domain-model.md §2 · Session).
 */
export interface SessionProfile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string | null;
  deactivated_at: string | null;
}
