/** Android / web: the kit's round back button (the iOS file draws a native glass one). */
import { IconButton } from '../IconButton';
import type { StepBackButtonProps } from './StepBackButton.types';

export function StepBackButton({ label, onPress }: StepBackButtonProps) {
  return (
    <IconButton icon="chevronLeft" variant="neutral" accessibilityLabel={label} onPress={onPress} />
  );
}
