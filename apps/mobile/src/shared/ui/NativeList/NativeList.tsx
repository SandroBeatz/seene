/**
 * NativeList — grouped list. Renders the app's inset-grouped idiom on every platform:
 * a subhead section title over a Card of ListItem rows split by inset Dividers, themed
 * through Unistyles (so light/dark follow the app). The pilot's native SwiftUI variant
 * (NativeList.ios.tsx) was pulled — bridging RN rows into a SwiftUI `List` didn't render
 * and ignored our theme; kept in git history as a parked experiment.
 */
import { Fragment } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Card } from '@/shared/ui/Card';
import { Divider } from '@/shared/ui/Divider';
import { useRefreshControl } from '@/shared/ui/hooks/useRefreshControl';
import { ListItem } from '@/shared/ui/ListItem';
import { ScreenScrollView } from '@/shared/ui/ScreenScrollView';
import { Text } from '@/shared/ui/Text';
import type { NativeListProps } from './types';

export function NativeList({ sections, onRefresh, testID }: NativeListProps) {
  const pull = useRefreshControl(async () => {
    await onRefresh?.();
  });
  const refreshControl = onRefresh ? pull : undefined;

  return (
    <ScreenScrollView
      contentContainerStyle={styles.groups}
      refreshControl={refreshControl}
      testID={testID}>
      {sections.map((section) => (
        <View key={section.key} style={styles.group}>
          {section.title ? (
            <Text variant="subhead" color="secondary">
              {section.title}
            </Text>
          ) : null}
          <Card padding="none">
            {section.rows.map((row, index) => (
              <Fragment key={row.key}>
                {index > 0 ? <Divider inset /> : null}
                <ListItem
                  left={row.leading}
                  title={row.title}
                  subtitle={row.subtitle}
                  right={row.trailing}
                  onPress={row.onPress}
                />
              </Fragment>
            ))}
          </Card>
        </View>
      ))}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  groups: { gap: theme.space[4] },
  group: { gap: theme.space[2] },
}));
