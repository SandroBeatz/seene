/**
 * Clients list widget. Row data is described once as platform-neutral `NativeList`
 * sections; the widget itself stays free of any list-rendering detail. Favourite toggles
 * live in each row's trailing IconButton. (The Expo UI native-SwiftUI variant behind
 * NativeList was piloted and pulled — see NativeList.tsx.)
 */
import { useMemo, useState } from 'react';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useUnistyles } from 'react-native-unistyles';
import { type Client, useClientsQuery, useToggleClientFavoriteMutation } from '@/entities/client';
import { useUserId } from '@/entities/session';
import { errorMessageKey, normalizeError } from '@/shared/api/errors';
import {
  Avatar,
  EmptyState,
  ErrorState,
  IconButton,
  type NativeListRow,
  NativeList,
  Screen,
  ScreenScrollView,
  SkeletonList,
} from '@/shared/ui';

function fullName(client: Client): string {
  return client.last_name ? `${client.first_name} ${client.last_name}` : client.first_name;
}

export function ClientList() {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const isIOS = process.env.EXPO_OS === 'ios';
  const userId = useUserId() ?? '';
  const clients = useClientsQuery(userId);
  const toggleFavorite = useToggleClientFavoriteMutation(userId);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !clients.data) return clients.data ?? [];
    return clients.data.filter(
      (c) => fullName(c).toLowerCase().includes(q) || c.phone.toLowerCase().includes(q),
    );
  }, [clients.data, query]);

  const rows = useMemo<NativeListRow[]>(
    () =>
      filtered.map((client) => {
        const name = fullName(client);
        return {
          key: client.id,
          title: name,
          subtitle: client.phone,
          leading: <Avatar name={name} emoji={client.emoji} />,
          onPress: () =>
            router.push({
              pathname: '/(app)/(tabs)/(clients)/clients/[clientId]',
              params: { clientId: client.id },
            }),
          trailing: (
            <IconButton
              icon={client.is_favorite ? 'star' : 'starOutline'}
              accessibilityLabel={t('clients.toggleFavorite')}
              variant={client.is_favorite ? 'accent' : 'ghost'}
              onPress={() =>
                toggleFavorite.mutate({ id: client.id, isFavorite: !client.is_favorite })
              }
            />
          ),
        };
      }),
    [filtered, t, toggleFavorite],
  );

  // Native header search + an (empty for now) create action, top-right. iOS uses the
  // native Stack.Toolbar button (correct circular shape + Liquid Glass); Android falls
  // back to a headerRight IconButton — the app-wide header-action pattern.
  const header = (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: t('clients.searchPlaceholder'),
            autoCapitalize: 'none',
            onChangeText: (event) => setQuery(event.nativeEvent.text),
          },
          headerRight: isIOS
            ? undefined
            : () => (
                <IconButton
                  icon="add"
                  variant="ghost"
                  accessibilityLabel={t('clients.add')}
                  onPress={() => undefined}
                />
              ),
        }}
      />
      {isIOS ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="plus"
            accessibilityLabel={t('clients.add')}
            tintColor={theme.colors.content.primary}
            variant="plain"
            onPress={() => undefined}
          />
        </Stack.Toolbar>
      ) : null}
    </>
  );

  if (clients.isPending) {
    return (
      <>
        {header}
        <ScreenScrollView>
          <SkeletonList />
        </ScreenScrollView>
      </>
    );
  }

  if (clients.isError) {
    return (
      <>
        {header}
        <Screen>
          <ErrorState
            message={t(errorMessageKey(normalizeError(clients.error)))}
            onRetry={() => void clients.refetch()}
          />
        </Screen>
      </>
    );
  }

  if (clients.data.length === 0) {
    return (
      <>
        {header}
        <Screen>
          <EmptyState
            icon="clients"
            title={t('clients.emptyTitle')}
            description={t('clients.emptyDescription')}
          />
        </Screen>
      </>
    );
  }

  if (filtered.length === 0) {
    return (
      <>
        {header}
        <Screen>
          <EmptyState icon="search" title={t('clients.noResults', { query })} />
        </Screen>
      </>
    );
  }

  return (
    <>
      {header}
      <NativeList
        sections={[{ key: 'all', rows }]}
        onRefresh={async () => {
          await clients.refetch();
        }}
      />
    </>
  );
}
