/**
 * Live PageLayout showcase (linked from the UI kit gallery). Demonstrates the header
 * slots, the static ↔ collapse title toggle, the edge-fade scrim, and a floating glass
 * footer. See docs/design-system.md §4.2.
 */
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Card, IconButton, PageLayout, Switch, Text } from '@/shared/ui';

export default function PageLayoutDemo() {
  const router = useRouter();
  const [collapse, setCollapse] = useState(true);

  return (
    <PageLayout
      title="Analytics"
      titleMode={collapse ? 'collapse' : 'static'}
      headerLeft={
        <IconButton
          icon="close"
          accessibilityLabel="Close"
          variant="glass"
          onPress={() => router.back()}
        />
      }
      headerRight={
        <IconButton
          icon="settings"
          accessibilityLabel="Settings"
          variant="glass"
          onPress={() => {}}
        />
      }
      footerBackground="transparent"
      footerLeft={
        <IconButton icon="search" accessibilityLabel="Search" variant="glass" onPress={() => {}} />
      }
      footerCenter={
        <IconButton icon="add" accessibilityLabel="Add" variant="glass" onPress={() => {}} />
      }
      footerRight={
        <IconButton icon="edit" accessibilityLabel="Edit" variant="glass" onPress={() => {}} />
      }>
      <View style={styles.controls}>
        <Text variant="body">Collapse title on scroll</Text>
        <Switch value={collapse} onValueChange={setCollapse} />
      </View>
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i}>
          <Text variant="body">Row {i + 1}</Text>
          <Text variant="subhead" color="secondary">
            Scroll to watch the title fold into the header and the edges dissolve.
          </Text>
        </Card>
      ))}
    </PageLayout>
  );
}

const styles = StyleSheet.create((theme) => ({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space[3],
  },
}));
