import { EmptyState, Screen } from '@/shared/ui';

export default function CalendarScreen() {
  return (
    <Screen padded={false}>
      <EmptyState
        icon="calendar"
        title="Calendar"
        description="Native calendar arrives in Phase 3 (react-native-calendars)."
      />
    </Screen>
  );
}
