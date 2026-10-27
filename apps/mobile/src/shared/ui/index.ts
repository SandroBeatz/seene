/**
 * The Seene UI kit — public barrel. Import kit components from '@/shared/ui' only
 * (docs/design-system.md §8). Grow this seed set deliberately as features arrive.
 */
export { Text, type TextProps, type TextColor, type TextAlign } from './Text';
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type ButtonTone,
} from './Button';
export {
  IconButton,
  type IconButtonProps,
  type IconButtonVariant,
  type IconButtonSize,
} from './IconButton';
export {
  Icon,
  ICON_NAMES,
  type IconName,
  type IconProps,
  type IconSize,
  type IconWeight,
} from './Icon';
export { Input, type InputProps, type InputSize } from './Input';
export { Logo, type LogoProps, type LogoTone } from './Logo';
export { ScreenTitle, type ScreenTitleProps } from './ScreenTitle';
export { CodeInput, type CodeInputProps } from './CodeInput';
export { Switch, type SwitchProps, type SwitchSize } from './Switch';
export {
  SelectionMark,
  type SelectionMarkProps,
  type SelectionShape,
  type SelectionTone,
} from './SelectionMark';
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from './SegmentedControl';
export { Card, type CardProps } from './Card';
export { Avatar, initialsOf, type AvatarProps, type AvatarSize, type AvatarTone } from './Avatar';
export { GlassSurface, type GlassSurfaceProps } from './GlassSurface';
export { ListItem, type ListItemProps, type ListItemSize } from './ListItem';
export { GroupedCard, type GroupedCardProps, type GroupedCardVariant } from './GroupedCard';
export { SectionLabel, type SectionLabelProps } from './SectionLabel';
export { StepHeader, type StepHeaderProps } from './StepHeader';
export { SheetHeader, type SheetHeaderProps } from './SheetHeader';
export {
  NativeList,
  type NativeListProps,
  type NativeListSection,
  type NativeListRow,
} from './NativeList';
export { Divider, type DividerProps } from './Divider';
export { Badge, StatusPill, type BadgeProps, type BadgeTone, type StatusPillProps } from './Badge';
export { Chip, type ChipProps, type ChipShape } from './Chip';
export { Skeleton, SkeletonList, type SkeletonProps } from './Skeleton';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { ErrorState, type ErrorStateProps } from './ErrorState';
export { Sheet, type SheetProps, type SheetRef } from './Sheet';
export { Modal, type ModalProps } from './Modal';
export { Screen, type ScreenProps } from './Screen';
export { ScreenScrollView, type ScreenScrollViewProps } from './ScreenScrollView';
export { FormScreen, type FormScreenProps } from './FormScreen';
export { FormSheetContent, type FormSheetContentProps } from './FormSheetContent';
export { NavigationHeaderBackground } from './NavigationHeaderBackground';
export { Footer, type FooterProps, type FooterBackground } from './Footer';
export { ScrollFade, type ScrollFadeProps } from './ScrollFade';
export {
  useScrollFade,
  type ScrollFade as ScrollFadeState,
  type ScrollFadeConfig,
} from './hooks/useScrollFade';
export { useReducedMotion } from './hooks/useReducedMotion';
export { useReduceTransparency } from './hooks/useReduceTransparency';
