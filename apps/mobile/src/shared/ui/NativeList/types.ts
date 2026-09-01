/**
 * NativeList — public API for the app's grouped list. The widget layer describes a list
 * with these platform-neutral descriptors; the implementation (NativeList.tsx) renders the
 * app's inset-grouped Card idiom, themed through Unistyles. Keeping widgets on this
 * descriptor API (rather than raw rows) leaves room to swap in a native implementation
 * later without touching callers — the Expo UI SwiftUI variant was piloted here and pulled.
 */
import type { ReactNode } from 'react';

export interface NativeListRow {
  key: string;
  title: string;
  subtitle?: string;
  /** Node shown before the text (e.g. Avatar). */
  leading?: ReactNode;
  /** Node shown after the text (e.g. a favourite IconButton or Switch). */
  trailing?: ReactNode;
  onPress?: () => void;
}

export interface NativeListSection {
  key: string;
  /** Rendered as a subhead label above the section's card. */
  title?: string;
  rows: NativeListRow[];
}

export interface NativeListProps {
  sections: NativeListSection[];
  /** Pull-to-refresh handler; drives a RefreshControl on the scroll view. */
  onRefresh?: () => Promise<void>;
  testID?: string;
}
