/**
 * Theme-mode store (auto/light/dark). Drives Unistyles' adaptive theme.
 * `auto` follows the OS; explicit modes pin the theme. Persisted to MMKV so the
 * choice survives restarts and applies before first paint. See docs/state-management.md §3.
 */
import { UnistylesRuntime } from 'react-native-unistyles';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvSyncStorage } from '@/shared/api/storage';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export function applyThemeMode(mode: ThemeMode): void {
  if (mode === 'auto') {
    UnistylesRuntime.setAdaptiveThemes(true);
    return;
  }
  UnistylesRuntime.setAdaptiveThemes(false);
  UnistylesRuntime.setTheme(mode);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'auto',
      setMode: (mode) => {
        applyThemeMode(mode);
        set({ mode });
      },
    }),
    {
      name: 'seene.theme',
      storage: createJSONStorage(() => mmkvSyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeMode(state.mode);
      },
    },
  ),
);
