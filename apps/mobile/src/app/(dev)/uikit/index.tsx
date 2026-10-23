import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Icon, ListItem, Text } from '@/shared/ui';
import { UIKitScreen } from '@/widgets/uikit-catalog';

const SECTIONS = [
  ['foundations', 'info'],
  ['components', 'starOutline'],
  ['layouts', 'empty'],
  ['navigation', 'chevronRight'],
  ['modals', 'add'],
  ['authentication', 'clients'],
] as const;

export default function UIKitIndexScreen() {
  const { t } = useTranslation();

  return (
    <UIKitScreen>
      <Text variant="body" color="secondary">
        {t('uikit.intro')}
      </Text>
      <Card padding="none">
        {SECTIONS.map(([section, icon]) => (
          <ListItem
            key={section}
            title={t(`uikit.sections.${section}`)}
            subtitle={t(`uikit.sectionDescriptions.${section}`)}
            left={<Icon name={icon} color="content.secondary" />}
            onPress={() => router.push(`/uikit/${section}`)}
          />
        ))}
      </Card>
    </UIKitScreen>
  );
}
