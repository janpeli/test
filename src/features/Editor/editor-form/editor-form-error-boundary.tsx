import React from "react";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";

// `resetKey` lets a transient render error self-heal: live SOURCE->FORM sync can
// briefly feed half-typed YAML into the form. When the next sync changes
// `resetKey`, the boundary clears its error and re-renders, recovering once the
// data is valid again.
type Props = { children: React.ReactNode; resetKey?: unknown };
type State = { error: Error | null };

export class EditorFormErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    addErrorMessage(`Form render error: ${error.message}`, "error");
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 text-sm text-destructive">
          <p className="font-medium">Form could not be rendered.</p>
          <p className="mt-1 text-muted-foreground">{this.state.error.message}</p>
          <p className="mt-1 text-muted-foreground">See the Error panel for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
