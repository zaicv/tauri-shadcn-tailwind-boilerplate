import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              ⚠️ Something went wrong
            </h2>
            <p className="text-gray-300 mb-4">
              The application encountered an error. Please refresh the page.
            </p>
            {this.state.error && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-400 hover:text-gray-200">
                  Error details
                </summary>
                <pre className="mt-2 p-2 bg-gray-900 rounded text-red-300 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

