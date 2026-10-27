/** Session entity — public barrel. Auth state, guard store, and auth mutations. */
export { useSessionStore } from './model/session.store';
export {
  useAuthName,
  useSendEmailCode,
  useSignInWithGoogle,
  useUserId,
  useVerifyEmailCode,
} from './model/queries';
export type { AuthName } from './model/auth-name';
export type { SessionProfile } from './model/types';
