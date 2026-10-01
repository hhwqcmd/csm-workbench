export type WorkspaceView =
  | "seedance"
  | "templates"
  | "seedream"
  | "managed-agents"
  | "responses"
  | "anthropic-messages"
  | "llm-trends"
  | "ai-coding";

export const WORKSPACE_NAVIGATE_EVENT = "seedance:navigate-workspace";

export function navigateWorkspace(view: WorkspaceView) {
  window.dispatchEvent(
    new CustomEvent<WorkspaceView>(WORKSPACE_NAVIGATE_EVENT, {
      detail: view,
    }),
  );
}
