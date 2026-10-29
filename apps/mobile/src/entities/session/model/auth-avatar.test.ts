import { describe, expect, it } from '@jest/globals';
import type { Session } from '../api/session.api';
import { avatarFromUser } from './auth-avatar';

const user = (meta: Record<string, unknown>) =>
  ({ user_metadata: meta }) as unknown as Session['user'];

describe('avatarFromUser', () => {
  it('takes the Google photo at a larger size', () => {
    expect(
      avatarFromUser(user({ avatar_url: 'https://lh3.googleusercontent.com/a/x=s96-c' })),
    ).toBe('https://lh3.googleusercontent.com/a/x=s512-c');
  });

  it('falls back to picture and keeps other URLs as they are', () => {
    expect(avatarFromUser(user({ picture: 'https://example.com/me.jpg' }))).toBe(
      'https://example.com/me.jpg',
    );
  });

  it('is null without a photo (Apple, email)', () => {
    expect(avatarFromUser(user({ full_name: 'Anna' }))).toBeNull();
    expect(avatarFromUser(undefined)).toBeNull();
  });
});
