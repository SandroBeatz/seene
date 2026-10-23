import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { UIKitExampleCard, UIKitScreen } from '@/widgets/uikit-catalog';

export default function UIKitLayoutsScreen() {
  const { t } = useTranslation();
  return (
    <UIKitScreen>
      <UIKitExampleCard
        title={t('uikit.layout.basic')}
        description={t('uikit.layout.basicDescription')}
        recommendation={t('uikit.recommended.screen')}
        source="src/shared/ui/Screen/Screen.tsx"
        code={"<Screen edges={['left', 'right']}>…</Screen>"}
        action={
          <Link href="/uikit/examples/layouts/basic" asChild>
            <Button label={t('uikit.openExample')} variant="secondary" />
          </Link>
        }
      />
      <UIKitExampleCard
        title={t('uikit.layout.gradientHeader')}
        description={t('uikit.layout.gradientHeaderDescription')}
        recommendation={t('uikit.recommended.gradientHeader')}
        source="src/shared/ui/NavigationHeaderBackground/NavigationHeaderBackground.tsx"
        code={'headerBackground: () => <NavigationHeaderBackground />'}
        action={
          <Link href="/uikit/examples/layouts/basic" asChild>
            <Button label={t('uikit.openExample')} variant="secondary" />
          </Link>
        }
      />
      <UIKitExampleCard
        title={t('uikit.layout.scroll')}
        description={t('uikit.layout.scrollDescription')}
        recommendation={t('uikit.recommended.scroll')}
        source="src/shared/ui/ScreenScrollView/ScreenScrollView.tsx"
        code={'<ScreenScrollView>…</ScreenScrollView>'}
        action={
          <Link href="/uikit/examples/layouts/scroll" asChild>
            <Button label={t('uikit.openExample')} variant="secondary" />
          </Link>
        }
      />
      <UIKitExampleCard
        title={t('uikit.layout.form')}
        description={t('uikit.layout.formDescription')}
        recommendation={t('uikit.recommended.form')}
        source="src/shared/ui/FormScreen/FormScreen.tsx"
        code={'<FormScreen footer={<Button … />}>…</FormScreen>'}
        action={
          <Link href="/uikit/examples/layouts/form" asChild>
            <Button label={t('uikit.openExample')} variant="secondary" />
          </Link>
        }
      />
      <UIKitExampleCard
        title={t('uikit.layout.dynamic')}
        description={t('uikit.layout.dynamicDescription')}
        recommendation={t('uikit.recommended.stackOptions')}
        source="src/app/(dev)/uikit/examples/layouts/dynamic-options.tsx"
        code={'<Stack.Screen options={{ title }} />'}
        action={
          <Link href="/uikit/examples/layouts/dynamic-options" asChild>
            <Button label={t('uikit.openExample')} variant="secondary" />
          </Link>
        }
      />
    </UIKitScreen>
  );
}
