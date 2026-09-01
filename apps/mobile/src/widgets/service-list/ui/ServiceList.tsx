/**
 * Services list widget — proves the service pipeline: query → group by category →
 * optimistic active toggle. Rows are inset grouped cards with a colour tag, the active
 * switch as the trailing accessory, and price as a text suffix. Editing lands in Phase 4.
 */
import { Fragment, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { type ServiceWithCategory, useServicesQuery, useToggleServiceActiveMutation } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import {
  Card,
  Divider,
  EmptyState,
  ErrorState,
  IconButton,
  ListItem,
  Screen,
  ScreenScrollView,
  SkeletonList,
  Switch,
  Text,
} from '@/shared/ui';

interface ServiceGroup {
  key: string;
  name: string;
  items: ServiceWithCategory[];
}

function groupByCategory(services: ServiceWithCategory[], uncategorised: string): ServiceGroup[] {
  const groups = new Map<string, ServiceGroup>();
  for (const service of services) {
    const key = service.category?.id ?? 'none';
    const name = service.category?.name ?? uncategorised;
    const group = groups.get(key) ?? { key, name, items: [] };
    group.items.push(service);
    groups.set(key, group);
  }
  return [...groups.values()];
}

function ColorTag({ color }: { color: string }) {
  return <View style={[styles.tag, { backgroundColor: color }]} />;
}

export function ServiceList() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const isIOS = process.env.EXPO_OS === 'ios';
  const userId = useUserId() ?? '';
  const services = useServicesQuery(userId);
  const toggleActive = useToggleServiceActiveMutation(userId);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !services.data) return services.data ?? [];
    return services.data.filter((s) => s.name.toLowerCase().includes(q));
  }, [services.data, query]);

  // iOS uses the native Stack.Toolbar button; Android falls back to headerRight.
  const header = (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: t('services.searchPlaceholder'),
            autoCapitalize: 'none',
            onChangeText: (event) => setQuery(event.nativeEvent.text),
          },
          headerRight: isIOS
            ? undefined
            : () => (
                <IconButton
                  icon="add"
                  variant="ghost"
                  accessibilityLabel={t('services.add')}
                  onPress={() => undefined}
                />
              ),
        }}
      />
      {isIOS ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            accessibilityLabel={t('services.add')}
            tintColor={theme.colors.content.primary}
            variant="plain"
            onPress={() => undefined}
          />
        </Stack.Toolbar>
      ) : null}
    </>
  );

  if (services.isPending) {
    return (
      <>
        {header}
        <ScreenScrollView>
          <SkeletonList />
        </ScreenScrollView>
      </>
    );
  }

  if (services.isError) {
    return (
      <>
        {header}
        <Screen>
          <ErrorState
            message={t(errorMessageKey(normalizeError(services.error)))}
            onRetry={() => void services.refetch()}
          />
        </Screen>
      </>
    );
  }

  if (services.data.length === 0) {
    return (
      <>
        {header}
        <Screen>
          <EmptyState title={t('services.emptyTitle')} description={t('services.emptyDescription')} />
        </Screen>
      </>
    );
  }

  if (filtered.length === 0) {
    return (
      <>
        {header}
        <Screen>
          <EmptyState icon="search" title={t('services.noResults', { query })} />
        </Screen>
      </>
    );
  }

  const groups = groupByCategory(filtered, t('services.uncategorised'));

  return (
    <>
      {header}
      <ScreenScrollView contentContainerStyle={styles.groups}>
        {groups.map((group) => (
          <View key={group.key} style={styles.group}>
            <Text variant="subhead" color="secondary">
              {group.name}
            </Text>
            <Card padding="none">
              {group.items.map((service, index) => (
                <Fragment key={service.id}>
                  {index > 0 ? <Divider inset /> : null}
                  <ListItem
                    left={<ColorTag color={service.color} />}
                    title={service.name}
                    subtitle={t('services.meta', {
                      duration: service.duration,
                      price: service.price,
                    })}
                    right={
                      <Switch
                        value={service.is_active}
                        onValueChange={(isActive) =>
                          toggleActive.mutate({ id: service.id, isActive })
                        }
                      />
                    }
                  />
                </Fragment>
              ))}
            </Card>
          </View>
        ))}
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  groups: { gap: theme.space[4] },
  group: { gap: theme.space[2] },
  tag: { width: 12, height: 12, borderRadius: theme.radius.full },
}));
