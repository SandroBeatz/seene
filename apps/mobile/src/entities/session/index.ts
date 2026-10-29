/** Session entity — public barrel. Auth state, guard store, and auth mutations. */
export { useSessionStore } from './model/session.store';
export {
  useAuthAvatar,
  useAuthName,
  useSendEmailCode,
  useSignInWithGoogle,
  useUserId,
  useVerifyEmailCode,
} from './model/queries';
export { avatarFromUser } from './model/auth-avatar';
export type { AuthName } from './model/auth-name';
export type { SessionProfile } from './model/types';
