/** A row of chips that scrolls past the screen's side padding (design AppSvcList). */
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.scroll}
      contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { marginHorizontal: -theme.layout.gutter, flexGrow: 0 },
  content: { paddingHorizontal: theme.layout.gutter, gap: 6 },
}));
