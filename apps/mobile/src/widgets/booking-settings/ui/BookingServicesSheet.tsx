/** Which services clients can book online; the design has no screen for it. */
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useServicesQuery, useUpdateServiceMutation } from '@/entities/service';
import { useUserId } from '@/entities/session';
import { GroupedCard, ListItem, SheetChrome, Switch, Text, showFailedToast } from '@/shared/ui';

export function BookingServicesSheet() {
  const { t } = useTranslation();
  const userId = useUserId() ?? '';
  const services = useServicesQuery(userId);
  const update = useUpdateServiceMutation(userId);
  const active = services.data?.filter((service) => service.is_active) ?? [];

  return (
    <View style={styles.root} collapsable={false}>
      <SheetChrome title={t('menuHome.booking.services')} leadingLabel={t('common.close')} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {active.length ? (
          <GroupedCard variant="menu">
            {active.map((service) => (
              <ListItem
                key={service.id}
                size="menu"
                inset={false}
                title={service.name}
                right={
                  <Switch
                    value={service.show_online}
                    onValueChange={(show_online) =>
                      update.mutate(
                        { id: service.id, show_online },
                        {
                          onError: () => showFailedToast(),
                        },
                      )
                    }
                    accessibilityLabel={service.name}
                  />
                }
              />
            ))}
          </GroupedCard>
        ) : null}
        <Text variant="caption" color="tertiary" style={styles.hint}>
          {t('menuHome.booking.servicesHint')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1 },
  content: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.space[2],
    paddingBottom: theme.space[6],
  },
  hint: { marginTop: theme.space[2], marginHorizontal: theme.space[1] },
}));
