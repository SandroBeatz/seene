/**
 * The Seene UI kit — public barrel. Import kit components from '@/shared/ui' only
 * (docs/design-system.md §8). Grow this seed set deliberately as features arrive.
 */
export { Text, type TextProps, type TextColor } from './Text';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';
export { IconButton, type IconButtonProps, type IconButtonVariant } from './IconButton';
export { Icon, type IconName, type IconProps, type IconSize } from './Icon';
export { Input, type InputProps } from './Input';
export { Switch, type SwitchProps } from './Switch';
export { Card, type CardProps } from './Card';
export { GlassSurface, type GlassSurfaceProps } from './GlassSurface';
export { ListItem, type ListItemProps } from './ListItem';
export { Divider, type DividerProps } from './Divider';
export { Badge, StatusPill, type BadgeProps, type BadgeTone, type StatusPillProps } from './Badge';
export { Chip, type ChipProps } from './Chip';
export { Skeleton, SkeletonList, type SkeletonProps } from './Skeleton';
export { EmptyState, type EmptyStateProps } from './EmptyState';
export { ErrorState, type ErrorStateProps } from './ErrorState';
export { Sheet, type SheetProps, type SheetRef } from './Sheet';
export { Modal, type ModalProps } from './Modal';
export { Screen, type ScreenProps } from './Screen';
export { Footer, type FooterProps, type FooterBackground } from './Footer';
export { ScreenHeader, type ScreenHeaderProps, type HeaderBackground } from './Header';
export { PageLayout, type PageLayoutProps } from './PageLayout';
export { ModalLayout, type ModalLayoutProps, type ModalVariant } from './ModalLayout';
export { ScrollFade, type ScrollFadeProps } from './ScrollFade';
export {
  useScrollFade,
  type ScrollFade as ScrollFadeState,
  type ScrollFadeConfig,
} from './hooks/useScrollFade';
export { useReducedMotion } from './hooks/useReducedMotion';
export { useReduceTransparency } from './hooks/useReduceTransparency';
