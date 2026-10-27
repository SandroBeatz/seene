/**
 * iOS duration picker: the system wheel ("ч" / "мин" barrels, SwiftUI Picker) in a
 * bottom panel with Отмена / Готово — the keyboard-style picker iOS users know.
 * System colours (PlatformColor) keep it native in light and dark.
 */
import { useState } from 'react';
import { Modal, PlatformColor, Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import { Host, HStack, Picker, Text as SwiftText } from '@expo/ui/swift-ui';
import { clipped, frame, labelsHidden, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/shared/ui/Text';
import type { DurationPickerProps } from './types';

export type { DurationPickerProps } from './types';

const WHEEL_HEIGHT = 216;
const WHEEL_WIDTH = 90;
const UNIT_WIDTH = 44;

export function DurationPicker(props: DurationPickerProps) {
  return (
    <Modal visible={props.visible} transparent animationType="none" onRequestClose={props.onCancel}>
      {/* Mounted per opening, so the wheels start from the current value. */}
      {props.visible ? <Panel {...props} /> : null}
    </Modal>
  );
}

function Panel({
  value,
  onCancel,
  onConfirm,
  title,
  cancelLabel,
  doneLabel,
  hoursUnit,
  minutesUnit,
  maxMinutes = 24 * 60,
  minuteStep = 5,
}: DurationPickerProps) {
  const insets = useSafeAreaInsets();
  const [hours, setHours] = useState(Math.floor(value / 60));
  const [minutes, setMinutes] = useState(value % 60 - ((value % 60) % minuteStep));
  const hourOptions = Array.from({ length: Math.floor(maxMinutes / 60) + 1 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 60 / minuteStep }, (_, i) => i * minuteStep);
  const total = Math.min(maxMinutes, hours * 60 + minutes);

  return (
    <>
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrim}>
        <Pressable
          style={RNStyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(280)}
        exiting={SlideOutDown.duration(200)}
        style={[styles.panel, { paddingBottom: insets.bottom }]}
        accessibilityViewIsModal>
        <View style={styles.toolbar}>
          <Pressable onPress={onCancel} hitSlop={12} accessibilityRole="button">
            <Text variant="bodyLarge" style={styles.action}>
              {cancelLabel}
            </Text>
          </Pressable>
          <Text variant="bodyStrong" style={styles.title}>
            {title}
          </Text>
          <Pressable
            onPress={() => total > 0 && onConfirm(total)}
            hitSlop={12}
            accessibilityRole="button">
            <Text variant="headline" style={styles.action}>
              {doneLabel}
            </Text>
          </Pressable>
        </View>
        <Host style={styles.wheels}>
          <HStack spacing={0}>
            <Picker
              selection={hours}
              onSelectionChange={setHours}
              modifiers={[pickerStyle('wheel'), labelsHidden(), frame({ width: WHEEL_WIDTH }), clipped()]}>
              {hourOptions.map((h) => (
                <SwiftText key={h} modifiers={[tag(h)]}>
                  {String(h)}
                </SwiftText>
              ))}
            </Picker>
            <SwiftText modifiers={[frame({ width: UNIT_WIDTH, alignment: 'leading' })]}>
              {hoursUnit}
            </SwiftText>
            <Picker
              selection={minutes}
              onSelectionChange={setMinutes}
              modifiers={[pickerStyle('wheel'), labelsHidden(), frame({ width: WHEEL_WIDTH }), clipped()]}>
              {minuteOptions.map((m) => (
                <SwiftText key={m} modifiers={[tag(m)]}>
                  {String(m)}
                </SwiftText>
              ))}
            </Picker>
            <SwiftText modifiers={[frame({ width: UNIT_WIDTH, alignment: 'leading' })]}>
              {minutesUnit}
            </SwiftText>
          </HStack>
        </Host>
      </Animated.View>
    </>
  );
}

// System colours only (this is the OS picker chrome), so no theme tokens here.
const styles = RNStyleSheet.create({
  scrim: { ...RNStyleSheet.absoluteFill, backgroundColor: PlatformColor('systemFill') },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PlatformColor('secondarySystemBackground'),
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  toolbar: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: RNStyleSheet.hairlineWidth,
    borderBottomColor: PlatformColor('separator'),
  },
  action: { color: PlatformColor('systemBlue') },
  title: { color: PlatformColor('label') },
  wheels: { height: WHEEL_HEIGHT },
});
