import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = {
  children: ReactNode;
  title?: string;
  resetKey?: string;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("OmniSearch render failure", error, info);
  }

  componentDidUpdate(previousProps: Props) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section
        role="alert"
        className="border border-red-200 bg-red-50 p-5 text-red-900"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={20}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">
              {this.props.title ?? "This section could not be displayed"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-red-800">
              The response was contained so the rest of OmniSearch can keep
              running. Retry the section or run the search again.
            </p>
            <details className="mt-3 text-xs text-red-800">
              <summary className="cursor-pointer font-semibold">
                Technical details
              </summary>
              <code className="mt-2 block whitespace-pre-wrap break-words">
                {this.state.error.message}
              </code>
            </details>
            <button
              type="button"
              onClick={this.reset}
              className="mt-4 inline-flex items-center gap-2 border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100"
            >
              <RefreshCw size={14} aria-hidden="true" /> Retry section
            </button>
          </div>
        </div>
      </section>
    );
  }
}
