import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Tracks the OS "Reduce Transparency" setting (iOS). When enabled, the system
 * strips translucency, so Liquid Glass surfaces should fall back to an opaque
 * material instead of a washed-out glass. On Android/web this resolves to false.
 */
export function useReduceTransparency(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (mounted) setReduce(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
