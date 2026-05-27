import React from "react";
import { addErrorMessage } from "@/API/GUI-api/status-panel-api";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class EditorFormErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    addErrorMessage(`Form render error: ${error.message}`, "error");
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
