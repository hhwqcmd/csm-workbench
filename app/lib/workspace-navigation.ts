export type WorkspaceView = "workbench" | "templates" | "managed-agents";

export const WORKSPACE_NAVIGATE_EVENT = "seedance:navigate-workspace";

export function navigateWorkspace(view: WorkspaceView) {
  window.dispatchEvent(
    new CustomEvent<WorkspaceView>(WORKSPACE_NAVIGATE_EVENT, {
      detail: view,
    }),
  );
}
