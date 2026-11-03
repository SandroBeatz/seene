/**
 * False until the screen's push animation has ended. Native stacks start the animation only once
 * React has committed the new screen, so what is slow to mount holds the tap back: such parts
 * wait for this and show a light version first. The timer covers a screen with no transition.
 */
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

const FALLBACK_MS = 700;

export function useTransitionDone(): boolean {
  const navigation = useNavigation();
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), FALLBACK_MS);
    const unsubscribe = (
      navigation as unknown as {
        addListener: (event: 'transitionEnd', listener: () => void) => () => void;
      }
    ).addListener('transitionEnd', () => setDone(true));
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigation]);
  return done;
}
