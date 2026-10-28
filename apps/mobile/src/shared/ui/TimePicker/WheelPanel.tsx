/**
 * iOS-only (imported by the .ios pickers) picker chrome shared by DurationPicker and TimePicker: the system wheels
 * (SwiftUI Picker, wheel style) in a bottom panel with Отмена / Готово — the
 * keyboard-style picker iOS users know. System colours keep it native in light/dark.
 */
import { Modal, PlatformColor, Pressable, StyleSheet as RNStyleSheet, View } from 'react-native';
import { Host, HStack, Picker, Text as SwiftText } from '@expo/ui/swift-ui';
import { clipped, frame, labelsHidden, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/shared/ui/Text';

export interface WheelColumn {
  values: readonly number[];
  selection: number;
  onChange: (value: number) => void;
  /** Shown as "09" when true (clock), "9" otherwise. */
  pad?: boolean;
}

export interface WheelPanelProps {
  visible: boolean;
  title: string;
  cancelLabel: string;
  doneLabel: string;
  onCancel: () => void;
  onDone: () => void;
  left: WheelColumn;
  right: WheelColumn;
  /** Unit after each wheel ("ч", "мин") — or a separator between them (":"). */
  leftUnit?: string;
  rightUnit?: string;
  separator?: string;
}

const WHEEL_HEIGHT = 216;
const WHEEL_WIDTH = 90;
const UNIT_WIDTH = 44;

export function WheelPanel(props: WheelPanelProps) {
  return (
    <Modal visible={props.visible} transparent animationType="none" onRequestClose={props.onCancel}>
      {props.visible ? <Panel {...props} /> : null}
    </Modal>
  );
}

function Wheel({ column }: { column: WheelColumn }) {
  return (
    <Picker
      selection={column.selection}
      onSelectionChange={column.onChange}
      modifiers={[pickerStyle('wheel'), labelsHidden(), frame({ width: WHEEL_WIDTH }), clipped()]}>
      {column.values.map((v) => (
        <SwiftText key={v} modifiers={[tag(v)]}>
          {column.pad ? String(v).padStart(2, '0') : String(v)}
        </SwiftText>
      ))}
    </Picker>
  );
}

function Panel({
  title,
  cancelLabel,
  doneLabel,
  onCancel,
  onDone,
  left,
  right,
  leftUnit,
  rightUnit,
  separator,
}: WheelPanelProps) {
  const insets = useSafeAreaInsets();
  const unit = (text?: string) =>
    text ? (
      <SwiftText modifiers={[frame({ width: UNIT_WIDTH, alignment: 'leading' })]}>{text}</SwiftText>
    ) : null;

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
          <Pressable onPress={onDone} hitSlop={12} accessibilityRole="button">
            <Text variant="headline" style={styles.action}>
              {doneLabel}
            </Text>
          </Pressable>
        </View>
        <Host style={styles.wheels}>
          <HStack spacing={0}>
            <Wheel column={left} />
            {unit(leftUnit)}
            {separator ? <SwiftText>{separator}</SwiftText> : null}
            <Wheel column={right} />
            {unit(rightUnit)}
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
