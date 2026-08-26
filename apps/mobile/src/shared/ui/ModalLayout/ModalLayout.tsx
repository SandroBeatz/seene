/**
 * The modal/sheet wrapper. Same chrome vocabulary as PageLayout — header slots, an
 * edge-fade scrim, footer actions — but drawn as *body* content (no native Stack
 * header) so the exact same component works in two places:
 *
 *  - `variant="modal"` — the content of an Expo Router route with
 *    `presentation: 'modal' | 'formSheet'` (reference IMG_1016-1018: ✕ top-left, centered
 *    title). Owns its scroll view, platform-aware header spacing, and canvas background.
 *  - `variant="sheet"` — the content of a gorhom bottom sheet. Uses BottomSheetScrollView
 *    so the sheet's pan gesture and the inner scroll cooperate, drops the screen-top inset,
 *    and stays transparent (the Sheet paints its own background). Place it as the sheet's
 *    scroll content; if you nest it inside the existing `<Sheet>` (which already pads),
 *    pass `padded={false}`.
 *
 * Reuses ScreenHeader (Task app.master.seene-qlu) and ScrollFade
 * (Task app.master.seene-r0b). The transparent header overlays the scroll area while a
 * full-header-height fade keeps scrolling content legible beneath its slots.
 */
import type { ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Footer, type FooterBackground } from '@/shared/ui/Footer';
import { ScreenHeader, type HeaderBackground } from '@/shared/ui/Header';
import { IconButton } from '@/shared/ui/IconButton';
import { ScrollFade } from '@/shared/ui/ScrollFade';
import { useScrollFade } from '@/shared/ui/hooks/useScrollFade';

const HEADER_BAR_HEIGHT = 44;

export type ModalVariant = 'modal' | 'sheet';

export interface ModalLayoutProps {
  children: ReactNode;
  title?: string;
  /** `modal` = route modal (own scroll + safe-area top). `sheet` = inside a gorhom Sheet. @default 'modal' */
  variant?: ModalVariant;
  /** Renders a default ✕ close in the left slot (unless `headerLeft` is given). */
  onClose?: () => void;
  /** Overrides the default close slot. */
  headerLeft?: ReactNode;
  /** Right header slot (extra actions). */
  headerRight?: ReactNode;
  /** Header background. @default 'transparent' */
  headerBackground?: HeaderBackground;
  headerColor?: string;
  /**
   * Reserve the device top safe area inside the custom header. Native iOS modal cards
   * use the standard 16pt modal padding by default instead; pass true to force safe area
   * or false to remove all top spacing.
   */
  headerTopInset?: boolean;
  /** Footer action content, laid out in-flow at the bottom (not floating). */
  footer?: ReactNode;
  /** Footer background. @default 'transparent' */
  footerBackground?: FooterBackground;
  footerColor?: string;
  /** Which content edges dissolve. @default 'both' */
  fade?: 'top' | 'bottom' | 'both' | 'none';
  fadeColor?: string;
  /** Scroll the content. @default true */
  scrollable?: boolean;
  /** Horizontal content padding. @default true */
  padded?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ModalLayout({
  children,
  title,
  variant = 'modal',
  onClose,
  headerLeft,
  headerRight,
  headerBackground,
  headerColor,
  headerTopInset,
  footer,
  footerBackground = 'transparent',
  footerColor,
  fade = 'both',
  fadeColor,
  scrollable = true,
  padded = true,
  contentContainerStyle,
}: ModalLayoutProps) {
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();

  const inSheet = variant === 'sheet';
  const usesTopInset = headerTopInset ?? (!inSheet && Platform.OS !== 'ios');
  const standardModalTopPadding =
    !inSheet && headerTopInset === undefined && Platform.OS === 'ios' ? theme.space[4] : 0;
  const headerTopSpacing = (usesTopInset ? insets.top : 0) + standardModalTopPadding;
  const headerFadeHeight = HEADER_BAR_HEIGHT + headerTopSpacing;
  const { onScroll, scrollY, topFade, bottomFade } = useScrollFade();
  const resolvedHeaderBackground = headerBackground ?? 'transparent';
  const close =
    headerLeft ??
    (onClose ? (
      <IconButton icon="close" accessibilityLabel="Close" variant="glass" onPress={onClose} />
    ) : undefined);

  const contentPadding: ViewStyle = {
    // Initial content clears the overlay header, then scrolls through its full-height fade.
    paddingTop: headerFadeHeight + theme.space[2],
    paddingBottom: (footer ? theme.space[4] : theme.space[8]) + (inSheet ? 0 : insets.bottom),
    paddingHorizontal: padded ? theme.space[4] : 0,
  };

  // In a sheet gorhom owns the scroll gesture, so the scrim stays static (no shared
  // values) to avoid overriding its onScroll; a route modal gets a scroll-driven scrim.
  const scrim =
    fade !== 'none' ? (
      <ScrollFade
        topFade={!inSheet && scrollable ? topFade : undefined}
        bottomFade={!inSheet && scrollable ? bottomFade : undefined}
        color={fadeColor ?? (inSheet ? theme.colors.bg.elevated : theme.colors.bg.canvas)}
        height={headerFadeHeight}
        edges={fade}
      />
    ) : null;

  const body = scrollable ? (
    inSheet ? (
      <BottomSheetScrollView
        contentContainerStyle={[contentPadding, contentContainerStyle]}
        showsVerticalScrollIndicator={false}>
        {children}
      </BottomSheetScrollView>
    ) : (
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={[contentPadding, contentContainerStyle]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        {children}
      </Animated.ScrollView>
    )
  ) : (
    <View style={[styles.scroll, contentPadding, contentContainerStyle]}>{children}</View>
  );

  return (
    <View
      style={[styles.root, { backgroundColor: inSheet ? 'transparent' : theme.colors.bg.canvas }]}>
      <View style={styles.body}>
        {body}
        {scrim}
      </View>

      {footer !== undefined ? (
        <Footer floating={false} background={footerBackground} color={footerColor}>
          {footer}
        </Footer>
      ) : null}

      <View
        pointerEvents="box-none"
        style={[
          styles.header,
          standardModalTopPadding ? { paddingTop: standardModalTopPadding } : undefined,
        ]}>
        <ScreenHeader
          title={title}
          titleMode="static"
          scrollY={!inSheet && scrollable ? scrollY : undefined}
          background={resolvedHeaderBackground}
          color={headerColor}
          topInset={usesTopInset}
          left={close}
          right={headerRight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create(() => ({
  root: { flex: 1 },
  // Relative wrapper so the ScrollFade scrim overlays only the scroll area (not header/footer).
  body: { flex: 1, position: 'relative' },
  scroll: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
}));
