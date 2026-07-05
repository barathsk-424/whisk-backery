import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-brown-50 p-4">
          <div className="bg-white rounded-3xl p-10 max-w-md text-center shadow-lg border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-brown-500 mb-2 text-sm">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <p className="text-brown-400 mb-6 text-xs">
              Try refreshing the page or clearing your browser cache.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 gradient-accent text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="px-6 py-3 bg-brown-50 text-primary rounded-xl font-bold hover:bg-brown-100 transition-colors border border-brown-200"
              >
                ← Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
