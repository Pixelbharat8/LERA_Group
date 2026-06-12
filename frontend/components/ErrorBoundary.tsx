"use client";

import * as React from "react";

/**
 * Top-level error boundary. Wraps the entire app under root layout so a
 * runtime exception in any subtree shows a friendly "Something went wrong"
 * surface instead of a blank screen. Includes a "Try again" button that
 * resets the boundary state, and a "Reload" fallback for hard failures.
 *
 * Errors are also reported to {@code window.console.error} and a global
 * {@code window.dispatchEvent(new CustomEvent("lera:error"))}, so other
 * surfaces (e.g. the toast container) can show user-visible feedback
 * without us needing a full state-management framework.
 */

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lera:error", {
          detail: { message: error?.message || "Unexpected error" },
        })
      );
    }
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full rounded-2xl bg-white shadow-xl p-6 space-y-4">
            <h1 className="text-lg font-semibold text-gray-900">Something went wrong.</h1>
            <p className="text-sm text-gray-600">
              We hit an unexpected error rendering this view. The team has been notified.
            </p>
            {this.state.error?.message && (
              <pre className="rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700 overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 pt-2">
              <button
                onClick={this.reset}
                className="flex-1 h-9 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Try again
              </button>
              <button
                onClick={() => typeof window !== "undefined" && window.location.reload()}
                className="flex-1 h-9 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
