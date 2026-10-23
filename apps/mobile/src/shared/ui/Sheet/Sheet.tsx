/**
 * Bottom-sheet wrapper (the primary overlay for previews, pickers, confirmations).
 * Wraps @gorhom/bottom-sheet once so the app has a single Sheet API with a standard
 * grabber + scrim. Requires BottomSheetModalProvider at the root (see app/_layout).
 * docs/design-system.md §4.2.
 */
import { forwardRef, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export type SheetRef = BottomSheetModal;

export interface SheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
  onChange?: (index: number) => void;
  enablePanDownToClose?: boolean;
}

export const Sheet = forwardRef<BottomSheetModal, SheetProps>(function Sheet(
  { children, snapPoints, onDismiss, onChange, enablePanDownToClose = true },
  forwardedRef,
) {
  const { theme } = useUnistyles();
  const sheetRef = useRef<BottomSheetModal | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const setRef = useCallback(
    (instance: BottomSheetModal | null) => {
      sheetRef.current = instance;
      if (typeof forwardedRef === 'function') forwardedRef(instance);
      else if (forwardedRef) forwardedRef.current = instance;
    },
    [forwardedRef],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  const handleChange = useCallback(
    (index: number) => {
      setIsOpen(index >= 0);
      onChange?.(index);
    },
    [onChange],
  );

  useEffect(() => {
    if (Platform.OS !== 'android' || !isOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      sheetRef.current?.dismiss();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen]);

  return (
    <BottomSheetModal
      ref={setRef}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose={enablePanDownToClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onChange={handleChange}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border.strong }}
      backgroundStyle={{ backgroundColor: theme.colors.bg.elevated }}>
      <BottomSheetView
        style={[styles.content, snapPoints?.length ? styles.fixedHeight : undefined]}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create((theme) => ({
  content: {
    paddingHorizontal: theme.space[4],
    paddingBottom: theme.space[8],
  },
  // A fixed-detent sheet must constrain its content. Without this, a nested
  // BottomSheetScrollView grows to its full content height and never becomes scrollable.
  fixedHeight: { flex: 1 },
}));
