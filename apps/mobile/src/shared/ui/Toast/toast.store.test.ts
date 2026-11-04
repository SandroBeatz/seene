import { afterEach, describe, expect, it } from '@jest/globals';

import { dismissToast, showToast, toastDuration, useToastStore } from './toast.store';

const action = { label: 'Отменить', onPress: () => {} };

describe('toastDuration', () => {
  it('gives a wide button 6 seconds', () => {
    expect(toastDuration({ cta: action })).toBe(6_000);
  });

  it('gives a word in the row 5 seconds', () => {
    expect(toastDuration({ action })).toBe(5_000);
  });

  it('gives a plain toast 3 seconds', () => {
    expect(toastDuration({})).toBe(3_000);
  });
});

describe('the toast store', () => {
  afterEach(dismissToast);

  it('replaces the shown toast with a new one', () => {
    showToast({ title: 'Первый' });
    showToast({ title: 'Второй' });
    expect(useToastStore.getState().toast?.title).toBe('Второй');
  });

  it('gives the same text a new id, so its timer starts over', () => {
    showToast({ title: 'Сохранено' });
    const first = useToastStore.getState().toast?.id;
    showToast({ title: 'Сохранено' });
    expect(useToastStore.getState().toast?.id).not.toBe(first);
  });

  it('dismisses', () => {
    showToast({ title: 'Сохранено' });
    dismissToast();
    expect(useToastStore.getState().toast).toBeNull();
  });
});
