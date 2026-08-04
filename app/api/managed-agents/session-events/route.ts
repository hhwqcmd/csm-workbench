import {
  ManagedAgentsValidationError,
  openManagedSessionEventStream,
  parseManageManagedSessionEventInput,
  sendManagedSessionEvents,
} from "../../../lib/managed-agents-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseManageManagedSessionEventInput(await request.json());
    if (input.action === "stream") {
      return await openManagedSessionEventStream(input);
    }
    const result = await sendManagedSessionEvents(input);
    return Response.json(result.payload, {
      status: result.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "管理 Session 事件时发生未知错误。";
    return Response.json(
      { error: message },
      {
        status: error instanceof ManagedAgentsValidationError ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
