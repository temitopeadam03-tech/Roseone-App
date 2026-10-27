import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '';
    // Optional fallback navigation
    try {
      window.dispatchEvent(new CustomEvent('rose_navigate_home'));
    } catch {
      // Ignore
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-[#17131A] rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-xs m-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mb-3.5 shadow-2xs">
            <AlertCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {this.props.fallbackTitle || 'Something interrupted this view'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            We encountered a temporary display issue. Your data is safe. You can reload this view or return to the feed.
          </p>

          <div className="flex items-center gap-2.5 mt-5">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-[#E91E8C] hover:bg-[#BE185D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Home Feed</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
