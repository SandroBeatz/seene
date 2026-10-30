import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { UIKitExampleCard, UIKitScreen } from '@/widgets/uikit-catalog';

export default function UIKitNavigationScreen() {
  const { t } = useTranslation();

  return (
    <UIKitScreen>
      <UIKitExampleCard
        title={t('uikit.navigation.stack')}
        description={t('uikit.navigation.stackDescription')}
        recommendation={t('uikit.recommended.stack')}
        source="src/app/(app)/(tabs)/(settings)/_layout.tsx"
        code={'<Stack.Screen name="settings/profile" />'}
        action={
          <Link href="/settings/profile" asChild>
            <Button label={t('uikit.openExample')} variant="secondary" />
          </Link>
        }
      />
      <UIKitExampleCard
        title={t('uikit.navigation.nativeTabs')}
        description={t('uikit.navigation.nativeTabsDescription')}
        recommendation={t('uikit.recommended.nativeTabs')}
        source="src/app/(app)/(tabs)/_layout.tsx"
        code={"import { NativeTabs } from 'expo-router/unstable-native-tabs';"}
        badge={t('uikit.badges.alpha')}
        badgeTone="warning"
      />
      <UIKitExampleCard
        title={t('uikit.navigation.dynamic')}
        description={t('uikit.navigation.dynamicDescription')}
        recommendation={t('uikit.recommended.dynamic')}
        source="src/app/(app)/(tabs)/(clients)/clients/[clientId].tsx"
        code={"router.push({ pathname: '/clients/[clientId]', params: { clientId } })"}
        action={
          <Link
            href={{ pathname: '/clients/[clientId]', params: { clientId: 'uikit-client' } }}
            asChild>
            <Button label={t('uikit.openExample')} variant="secondary" />
          </Link>
        }
      />
      <UIKitExampleCard
        title={t('uikit.navigation.absoluteRelative')}
        description={t('uikit.navigation.absoluteRelativeDescription')}
        recommendation={t('uikit.recommended.absolute')}
        source="src/app/(dev)/uikit/navigation.tsx"
        code={'<Link href="./layouts" relativeToDirectory />'}
        badge={t('uikit.badges.typedRoutesBeta')}
        badgeTone="warning"
        action={
          <Link href="./layouts" relativeToDirectory asChild>
            <Button label={t('uikit.navigation.openRelative')} variant="secondary" />
          </Link>
        }
      />
      <UIKitExampleCard
        title={t('uikit.navigation.deepLink')}
        description={t('uikit.navigation.deepLinkDescription')}
        recommendation={t('uikit.recommended.deepLink')}
        source="app.json → expo.scheme"
        code="appmasterseene://appointments/uikit-appointment"
      />
      <UIKitExampleCard
        title={t('uikit.navigation.back')}
        description={t('uikit.navigation.backDescription')}
        recommendation={t('uikit.recommended.back')}
        source="expo-router"
        code="router.back()"
        action={
          <Button label={t('onboarding.back')} variant="secondary" onPress={() => router.back()} />
        }
      />
      <UIKitExampleCard
        title={t('uikit.navigation.drawer')}
        description={t('uikit.navigation.drawerDescription')}
        recommendation={t('uikit.recommended.drawer')}
        source="docs/architecture/navigation.md"
        badge={t('uikit.notUsed')}
      />
    </UIKitScreen>
  );
}
