/**
 * Root error boundary. Catches render crashes, reports to Sentry, and shows the
 * design-system ErrorState instead of a white screen. docs/mobile-architecture.md §7.
 */
import { Component, type ReactNode } from 'react';
import { capture } from '@/shared/lib/observability/sentry';
import { ErrorState } from '@/shared/ui/ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    capture(error, { componentStack: info.componentStack ?? undefined });
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorState message={this.state.error.message} onRetry={this.reset} />;
    }
    return this.props.children;
  }
}
