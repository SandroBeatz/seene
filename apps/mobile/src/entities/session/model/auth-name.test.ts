import { describe, expect, it } from '@jest/globals';
import type { Session } from '../api/session.api';
import { nameFromUser } from './auth-name';

const user = (meta: Record<string, unknown>) => ({ user_metadata: meta }) as unknown as Session['user'];

describe('nameFromUser', () => {
  it('prefers given/family name', () => {
    expect(nameFromUser(user({ given_name: 'Карина', family_name: 'Михайлова', full_name: 'x' }))).toEqual({
      firstName: 'Карина',
      lastName: 'Михайлова',
    });
  });
  it('splits the full name once', () => {
    expect(nameFromUser(user({ full_name: 'Anna Maria Lopez' }))).toEqual({
      firstName: 'Anna',
      lastName: 'Maria Lopez',
    });
  });
  it('is empty without metadata (email sign-in)', () => {
    expect(nameFromUser(user({}))).toEqual({ firstName: '', lastName: '' });
    expect(nameFromUser(undefined)).toEqual({ firstName: '', lastName: '' });
  });
});
