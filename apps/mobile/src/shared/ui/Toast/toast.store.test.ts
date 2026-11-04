import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  dismissToast,
  pressToastAction,
  showToast,
  toastDuration,
  useToastStore,
} from './toast.store';

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

  it('runs onLeave when dismissed, once', () => {
    const onLeave = jest.fn();
    showToast({ title: 'Удалено', onLeave });
    dismissToast();
    dismissToast();
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('runs onLeave when another toast takes its place', () => {
    const onLeave = jest.fn();
    showToast({ title: 'Удалено', onLeave });
    showToast({ title: 'Сохранено' });
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(useToastStore.getState().toast?.title).toBe('Сохранено');
  });

  it('skips onLeave when its button is pressed', () => {
    const onLeave = jest.fn();
    const onPress = jest.fn();
    const action = { label: 'Отменить', onPress };
    showToast({ title: 'Удалено', action, onLeave });
    pressToastAction(action);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onLeave).not.toHaveBeenCalled();
    expect(useToastStore.getState().toast).toBeNull();
  });
});
