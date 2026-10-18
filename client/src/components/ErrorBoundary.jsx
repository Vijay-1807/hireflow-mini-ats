import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('HireFlow crashed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-white">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            The app hit an unexpected error. Your data is safe — try reloading.
          </p>
          <p className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 font-mono text-[11px] text-zinc-500">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-5">
            <RefreshCw className="h-4 w-4" /> Reload app
          </button>
        </div>
      </div>
    );
  }
}
