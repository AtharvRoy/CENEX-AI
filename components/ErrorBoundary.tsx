
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20">
            <AlertCircle className="text-rose-500" size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white uppercase tracking-tighter">Terminal Logic Exception</h1>
            <p className="text-sm text-zinc-500 max-w-xs mx-auto italic">
              A critical error occurred in the visualization layer. {this.state.error?.message}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
          >
            <RefreshCw size={14} />
            Re-Initialize Terminal
          </button>
        </div>
      );
    }

    // Fixed: Access children from this.props
    return this.props.children;
  }
}
