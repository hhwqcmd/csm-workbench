import {
  createManagedSession,
  ManagedAgentsValidationError,
  parseCreateManagedSessionInput,
} from "../../../lib/managed-agents-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const result = await createManagedSession(
      parseCreateManagedSessionInput(await request.json()),
    );
    return Response.json(result, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown): Response {
  const message =
    error instanceof Error ? error.message : "开启会话时发生未知错误。";
  return Response.json(
    { error: message },
    {
      status: error instanceof ManagedAgentsValidationError ? 400 : 502,
      headers: { "cache-control": "no-store" },
    },
  );
}
