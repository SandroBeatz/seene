/**
 * The 24pt check/radio mark used by every selectable row and tile. Purely visual:
 * the pressable row around it owns the role (checkbox / radio) and the label.
 *
 * shape: square = checkbox (multi-select), circle = radio (single-select).
 * tone: plain = on canvas; onImage = over a photo tile (white when on, dimmed glass
 * with a white outline when off).
 */
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Icon } from '@/shared/ui/Icon';

export type SelectionShape = 'square' | 'circle';
export type SelectionTone = 'plain' | 'onImage';

export interface SelectionMarkProps {
  checked: boolean;
  shape?: SelectionShape;
  tone?: SelectionTone;
}

export function SelectionMark({ checked, shape = 'circle', tone = 'plain' }: SelectionMarkProps) {
  styles.useVariants({ shape, tone, checked });
  const checkColor = tone === 'onImage' ? 'constant.ink' : 'accent.onAccent';
  return (
    <View style={styles.mark} accessibilityElementsHidden importantForAccessibility="no">
      {checked ? (
        <Icon name="check" size={shape === 'square' ? 'mark' : 'xs'} color={checkColor} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  mark: {
    width: theme.sizing.selection,
    height: theme.sizing.selection,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    variants: {
      shape: {
        square: { borderRadius: theme.radius.sm },
        circle: { borderRadius: theme.radius.full },
      },
      tone: { plain: {}, onImage: {} },
      checked: { true: {}, false: {} },
    },
    compoundVariants: [
      { tone: 'plain', checked: true, styles: { backgroundColor: theme.colors.accent.default } },
      {
        tone: 'plain',
        checked: false,
        styles: { borderWidth: 1.5, borderColor: theme.colors.border.strong },
      },
      { tone: 'onImage', checked: true, styles: { backgroundColor: theme.colors.constant.white } },
      {
        tone: 'onImage',
        checked: false,
        styles: {
          backgroundColor: theme.colors.overlay.onImageDim,
          borderWidth: 1.5,
          borderColor: theme.colors.overlay.onImageEdge,
        },
      },
    ],
  },
}));
