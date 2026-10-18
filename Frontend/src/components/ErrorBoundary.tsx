import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI crash', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className='min-h-screen hud-bg flex items-center justify-center p-6'>
          <div className='panel p-8 max-w-md text-center rise'>
            <div className='label-tech mb-2'>system fault</div>
            <h1 className='font-display text-lg font-bold grad-rose mb-2'>Something went wrong</h1>
            <p className='text-dim text-sm mb-4 font-mono-data'>{this.state.error.message}</p>
            <button
              onClick={() => location.assign('/dashboard')}
              className='chip chip-info hover:brightness-125 transition'
            >
              RELOAD DASHBOARD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
