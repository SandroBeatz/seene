/**
 * Top of the email/code steps: the title and the explanatory line (design: AppEmail /
 * AppCode). The back button is the native header's (see the auth stack layout).
 */
import { ScreenTitle } from '@/shared/ui';

export interface AuthHeadingProps {
  title: string;
  subtitle: string;
}

export function AuthHeading({ title, subtitle }: AuthHeadingProps) {
  return <ScreenTitle title={title} subtitle={subtitle} />;
}
