/**
 * The page wrapper. Composes the layout primitives into one scaffold so screens get
 * consistent chrome without re-wiring it each time:
 *
 *  - a native Stack header (ScreenHeader via `<Stack.Header asChild>`) with left/center/
 *    right slots and a static or scroll-collapsing title;
 *  - a Reanimated scroll area whose offset drives both the collapse and the edge fade;
 *  - a ScrollFade scrim so content dissolves at the top/bottom edges (reference IMG_1014);
 *  - an optional floating Footer for page actions.
 *
 * It also sets the screen's header options itself, so a caller only writes:
 *
 *   <PageLayout title="Settings" headerLeft={<IconButton icon="close" .../>}>
 *     ...rows
 *   </PageLayout>
 *
 * For overlay/modal contexts use ModalLayout (app.master.seene-2vg) instead.
 */
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Stack } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Footer, type FooterBackground } from '@/shared/ui/Footer';
import { ScreenHeader, type HeaderBackground } from '@/shared/ui/Header';
import { ScrollFade } from '@/shared/ui/ScrollFade';
import { Text } from '@/shared/ui/Text';
import { useScrollFade } from '@/shared/ui/hooks/useScrollFade';

// Matches ScreenHeader's bar height; used to inset content below the transparent header.
const HEADER_BAR_HEIGHT = 44;

export interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  /** `static` = title always in the bar; `collapse` = large in-content title that folds into the bar. @default 'static' */
  titleMode?: 'static' | 'collapse';
  /** Scroll distance at which the collapsed title reaches full opacity. @default 80 */
  collapseThreshold?: number;
  /** Render the native header. @default true */
  header?: boolean;
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  /** Header background. Defaults to `scrim` in collapse mode, `transparent` otherwise. */
  headerBackground?: HeaderBackground;
  headerColor?: string;
  /** Full footer content override. Takes precedence over the footer slots. */
  footer?: ReactNode;
  footerLeft?: ReactNode;
  footerCenter?: ReactNode;
  footerRight?: ReactNode;
  footerBackground?: FooterBackground;
  footerColor?: string;
  /** Which content edges dissolve. @default 'both' */
  fade?: 'top' | 'bottom' | 'both' | 'none';
  /** Color the content dissolves into. @default theme.colors.bg.canvas */
  fadeColor?: string;
  /** Scroll the content. When false the content is laid out statically. @default true */
  scrollable?: boolean;
  /** Horizontal content padding. @default true */
  padded?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function PageLayout({
  children,
  title,
  titleMode = 'static',
  collapseThreshold = 80,
  header = true,
  headerLeft,
  headerCenter,
  headerRight,
  headerBackground,
  headerColor,
  footer,
  footerLeft,
  footerCenter,
  footerRight,
  footerBackground,
  footerColor,
  fade = 'both',
  fadeColor,
  scrollable = true,
  padded = true,
  contentContainerStyle,
}: PageLayoutProps) {
  // Subscribe to the theme so the canvas repaints on a theme change even on frozen
  // native tab screens (same reason Screen does it).
  const { theme } = useUnistyles();
  const insets = useSafeAreaInsets();
  const { onScroll, scrollY, topFade, bottomFade } = useScrollFade();

  const hasFooter = footer !== undefined || footerLeft || footerCenter || footerRight;
  const resolvedHeaderBg: HeaderBackground =
    headerBackground ?? (titleMode === 'collapse' ? 'scrim' : 'transparent');

  const contentPadding: ViewStyle = {
    // Clear the transparent native header, and (when present) the floating footer.
    paddingTop: header ? insets.top + HEADER_BAR_HEIGHT + theme.space[3] : insets.top + theme.space[3],
    paddingBottom: (hasFooter ? theme.space[16] : theme.space[8]) + insets.bottom,
    paddingHorizontal: padded ? theme.space[4] : 0,
  };

  const inner = (
    <>
      {/* The big in-content title that collapses into the header bar. */}
      {titleMode === 'collapse' && title ? (
        <Text variant="title1" style={styles.largeTitle}>
          {title}
        </Text>
      ) : null}
      {children}
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg.canvas }]}>
      {header ? (
        <>
          <Stack.Screen options={{ headerShown: true, headerTransparent: true }} />
          <Stack.Header asChild>
            <ScreenHeader
              title={title}
              titleMode={titleMode}
              scrollY={scrollY}
              collapseThreshold={collapseThreshold}
              background={resolvedHeaderBg}
              color={headerColor}
              left={headerLeft}
              center={headerCenter}
              right={headerRight}
            />
          </Stack.Header>
        </>
      ) : null}

      {scrollable ? (
        <Animated.ScrollView
          style={styles.scroll}
          contentContainerStyle={[contentPadding, contentContainerStyle]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}>
          {inner}
        </Animated.ScrollView>
      ) : (
        <View style={[styles.scroll, contentPadding, contentContainerStyle]}>{inner}</View>
      )}

      {fade !== 'none' ? (
        <ScrollFade
          topFade={scrollable ? topFade : undefined}
          bottomFade={scrollable ? bottomFade : undefined}
          color={fadeColor}
          edges={fade}
        />
      ) : null}

      {hasFooter ? (
        footer !== undefined ? (
          <Footer background={footerBackground} color={footerColor}>
            {footer}
          </Footer>
        ) : (
          <Footer
            left={footerLeft}
            center={footerCenter}
            right={footerRight}
            background={footerBackground}
            color={footerColor}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  scroll: { flex: 1 },
  largeTitle: { marginBottom: theme.space[3] },
}));
