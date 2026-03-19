'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-xl border border-error/20 bg-error-light px-6 py-16 text-center"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
            <AlertTriangle className="h-6 w-6 text-error" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-onyx">Something went wrong</h3>
          <p className="mt-1 max-w-sm text-sm text-slate">
            We ran into an unexpected problem. Please refresh the page or try again.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 inline-flex items-center justify-center h-10 rounded-lg bg-school-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-crimson-dark focus:outline-none focus:ring-2 focus:ring-school-primary/20 focus:ring-offset-2 transition-all duration-200"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
