/**
 * The top of "Моя страница" (design "Меню v2 · Моя страница", AppMenuProfileEmpty,
 * AppMenuProfileCover): the cover as a banner, the menu of ways to change it and the link to
 * the page clients see. The avatar lives on "Профиль" (`ProfileAvatar`).
 */
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import {
  masterKeys,
  masterPageUrl,
  useRemoveMasterCover,
  type MasterProfile,
} from '@/entities/master';
import { usePortfolioQuery } from '@/entities/portfolio';
import { pickImage, takePhoto } from '@/shared/lib/image-picker';
import {
  ContextMenu,
  Icon,
  Text,
  showErrorToast,
  showFailedToast,
  showToast,
  type ContextMenuAnchor,
  type ContextMenuItem,
} from '@/shared/ui';

const MENU_WIDTH = 252;
/** The system picker can't open over a modal that is still closing. */
const AFTER_MENU_MS = 350;

export function ProfileCover({ profile, userId }: { profile: MasterProfile; userId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const remove = useRemoveMasterCover(userId);
  const portfolio = usePortfolioQuery(userId);
  const banner = useRef<View>(null);
  const [anchor, setAnchor] = useState<ContextMenuAnchor | null>(null);

  const cover = profile.cover_url;
  const hasPhotos = (portfolio.data?.length ?? 0) > 0;

  const openMenu = () =>
    banner.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ x: x + width - MENU_WIDTH - 10, y: y + height / 3, width: MENU_WIDTH }),
    );

  const crop = (uri: string) => router.push({ pathname: '/settings/cover', params: { uri } });

  const fromGallery = async () => {
    const image = await pickImage();
    if (image) crop(image.uri);
  };

  const fromCamera = async () => {
    const image = await takePhoto();
    if (image === 'denied') showErrorToast(t('menuHome.profile.cameraDenied'));
    else if (image) crop(image.uri);
  };

  const deleteCover = () => {
    const key = masterKeys.profile(userId);
    const before = qc.getQueryData<MasterProfile>(key);
    const restore = () => {
      if (before) qc.setQueryData(key, before);
      void qc.invalidateQueries({ queryKey: key });
    };
    if (before) qc.setQueryData<MasterProfile>(key, { ...before, cover_url: null });
    showToast({
      title: t('toasts.coverDeleted'),
      tone: 'neutral',
      icon: 'trash',
      action: { label: t('toasts.undo'), onPress: restore },
      onLeave: () => {
        remove.mutateAsync().catch(() => {
          restore();
          showFailedToast(deleteCover);
        });
      },
    });
  };

  const items: ContextMenuItem[] = [
    { key: 'gallery', label: t('menuHome.profile.coverGallery'), icon: 'image' },
    { key: 'camera', label: t('menuHome.profile.coverCamera'), icon: 'camera' },
    ...(hasPhotos
      ? [
          {
            key: 'portfolio',
            label: t('menuHome.profile.coverPortfolio'),
            icon: 'gallery' as const,
          },
        ]
      : []),
    ...(cover
      ? [
          { key: 'crop', label: t('menuHome.profile.coverCrop'), icon: 'crop' as const },
          {
            key: 'delete',
            label: t('menuHome.profile.coverDelete'),
            icon: 'trash' as const,
            danger: true,
          },
        ]
      : []),
  ];

  const select = (key: string) => {
    setAnchor(null);
    if (key === 'delete') return deleteCover();
    if (key === 'crop' && cover) return crop(cover);
    if (key === 'portfolio') return router.push('/settings/cover');
    setTimeout(() => void (key === 'camera' ? fromCamera() : fromGallery()), AFTER_MENU_MS);
  };

  return (
    <View style={styles.root}>
      <View ref={banner} collapsable={false}>
        {cover ? (
          <View style={styles.banner}>
            <Image
              source={{ uri: cover }}
              style={styles.image}
              contentFit="cover"
              transition={150}
            />
            <Pressable
              accessibilityRole="button"
              onPress={openMenu}
              style={({ pressed }) => [styles.edit, pressed && styles.pressed]}>
              <Icon name="pencil" size={14} color="constant.ink" />
              <Text variant="footnoteStrong" color="ink">
                {t('menuHome.profile.edit')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={openMenu}
            style={({ pressed }) => [styles.banner, styles.empty, pressed && styles.pressed]}>
            <View style={styles.emptyIcon}>
              <Icon name="image" size={18} color="content.secondary" />
            </View>
            <Text variant="subheadStrong" numberOfLines={1}>
              {t('menuHome.profile.addCover')}
            </Text>
            <Text variant="caption" color="tertiary" numberOfLines={1}>
              {t('menuHome.profile.coverHint')}
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable
        accessibilityRole="link"
        onPress={() => void openBrowserAsync(masterPageUrl(profile.username))}
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
        <Text variant="footnoteStrong" color="brandStrong">
          {t('menuHome.profile.asClients')}
        </Text>
        <Icon name="arrowUpRight" size={14} color="brand.strong" />
      </Pressable>

      <ContextMenu
        anchor={anchor}
        items={items}
        closeLabel={t('common.close')}
        onClose={() => setAnchor(null)}
        onSelect={select}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { marginBottom: theme.space[3.5] },
  banner: {
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.bg.surface,
  },
  image: { width: '100%', height: '100%' },
  edit: {
    position: 'absolute',
    right: 10,
    top: 10,
    height: 32,
    paddingHorizontal: theme.space[3],
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.constant.white,
    opacity: 0.88,
  },
  empty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg.elevated,
  },
  link: {
    alignSelf: 'center',
    marginTop: theme.space[2],
    height: 30,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pressed: { opacity: 0.7 },
}));
