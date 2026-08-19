/**
 * Bottom-sheet wrapper (the primary overlay for previews, pickers, confirmations).
 * Wraps @gorhom/bottom-sheet once so the app has a single Sheet API with a standard
 * grabber + scrim. Requires BottomSheetModalProvider at the root (see app/_layout).
 * docs/design-system.md §4.2.
 */
import { forwardRef, type ReactNode, useCallback } from 'react';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useUnistyles } from 'react-native-unistyles';

export type SheetRef = BottomSheetModal;

export interface SheetProps {
  children: ReactNode;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
}

export const Sheet = forwardRef<BottomSheetModal, SheetProps>(function Sheet(
  { children, snapPoints, onDismiss },
  ref,
) {
  const { theme } = useUnistyles();

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: theme.colors.border.strong }}
      backgroundStyle={{ backgroundColor: theme.colors.bg.elevated }}>
      <BottomSheetView
        style={{ paddingHorizontal: theme.space[4], paddingBottom: theme.space[8] }}>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});
