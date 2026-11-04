/**
 * Choosing what the cover shows: a photo from the portfolio, when none came with the route, then
 * the 2:1 frame to move and zoom it in. The design has no board for this step, only the
 * "Сдвинуть и обрезать" row. A cover being recropped has only what the last crop kept.
 */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image as NativeImage,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { useUploadMasterImage } from '@/entities/master';
import { usePortfolioQuery } from '@/entities/portfolio';
import { useUserId } from '@/entities/session';
import { cropImage } from '@/shared/lib/image-picker';
import { Button, Icon, Skeleton, Text, showFailedToast, showToast } from '@/shared/ui';
import {
  clampOffset,
  clampZoom,
  COVER_ASPECT,
  COVER_MAX_WIDTH,
  coverScale,
  cropRect,
  type Size,
} from '../lib/cover-crop';

const GUTTER = 20;
const COLUMNS = 3;
const GAP = 4;

export function CoverScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uri?: string }>();
  const [picked, setPicked] = useState<string | null>(null);
  const uri = params.uri ?? picked;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.bar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.close}>
          <Icon name="close" size={20} />
        </Pressable>
        <Text variant="bodyStrong" numberOfLines={1}>
          {uri ? t('menuHome.profile.coverCrop') : t('menuHome.profile.coverPickTitle')}
        </Text>
        <View style={styles.close} />
      </View>
      {uri ? <CoverCrop uri={uri} /> : <PortfolioGrid onPick={setPicked} />}
    </View>
  );
}

function PortfolioGrid({ onPick }: { onPick: (uri: string) => void }) {
  const screen = useWindowDimensions();
  const portfolio = usePortfolioQuery(useUserId() ?? '');
  const tile = (screen.width - GUTTER * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  return (
    <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
      {(portfolio.data ?? []).map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={() => onPick(item.photo_url)}
          style={{ width: tile, height: tile }}>
          <Image source={{ uri: item.photo_url }} style={styles.tile} contentFit="cover" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

function CoverCrop({ uri }: { uri: string }) {
  const { t } = useTranslation();
  const screen = useWindowDimensions();
  const upload = useUploadMasterImage(useUserId() ?? '');
  const [image, setImage] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    NativeImage.getSize(
      uri,
      (width, height) => {
        if (live) setImage({ width, height });
      },
      () => {
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [uri]);

  useEffect(() => {
    if (failed) {
      showFailedToast();
      router.back();
    }
  }, [failed]);

  const frameWidth = screen.width - GUTTER * 2;
  const frame = { width: frameWidth, height: frameWidth / COVER_ASPECT };

  const zoom = useSharedValue(1);
  const startZoom = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const base = image ? coverScale(image, frame) : 1;
  const shownWidth = (image?.width ?? 0) * base;
  const shownHeight = (image?.height ?? 0) * base;

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onChange((event) => {
      x.value = clampOffset(
        startX.value + event.translationX,
        shownWidth * zoom.value,
        frame.width,
      );
      y.value = clampOffset(
        startY.value + event.translationY,
        shownHeight * zoom.value,
        frame.height,
      );
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      startZoom.value = zoom.value;
    })
    .onChange((event) => {
      zoom.value = clampZoom(startZoom.value * event.scale);
      x.value = clampOffset(x.value, shownWidth * zoom.value, frame.width);
      y.value = clampOffset(y.value, shownHeight * zoom.value, frame.height);
    });

  const moved = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: zoom.value }],
  }));

  const save = async () => {
    if (!image) return;
    setSaving(true);
    try {
      const rect = cropRect(image, frame, zoom.value, { x: x.value, y: y.value });
      const cropped = await cropImage(uri, rect, COVER_MAX_WIDTH);
      await upload.mutateAsync({ kind: 'cover', ...cropped });
      showToast({ title: t('toasts.coverUpdated') });
      router.back();
    } catch {
      setSaving(false);
      showFailedToast(() => void save());
    }
  };

  return (
    <View style={styles.crop}>
      <View style={styles.middle}>
        <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
          <View style={[styles.frame, frame]} collapsable={false}>
            {image ? (
              <Animated.View style={[styles.photo, moved]}>
                <Image
                  source={{ uri }}
                  style={{ width: shownWidth, height: shownHeight }}
                  contentFit="fill"
                />
              </Animated.View>
            ) : (
              <Skeleton width={frame.width} height={frame.height} />
            )}
          </View>
        </GestureDetector>
        <Text variant="footnote" color="tertiary" align="center" style={styles.hint}>
          {t('menuHome.profile.coverCropHint')}
        </Text>
      </View>
      <Button
        label={t('common.save')}
        disabled={!image}
        loading={saving}
        onPress={() => void save()}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
  bar: {
    height: 52,
    paddingHorizontal: theme.space[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  grid: {
    paddingHorizontal: GUTTER,
    paddingTop: theme.space[2],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: { width: '100%', height: '100%', borderRadius: 8 },
  crop: { flex: 1, paddingHorizontal: GUTTER },
  middle: { flex: 1, justifyContent: 'center' },
  frame: {
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.surface,
  },
  photo: { position: 'absolute' },
  hint: { marginTop: theme.space[3] },
}));
