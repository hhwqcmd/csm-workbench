import {
  createManagedAgent,
  ManagedAgentsValidationError,
  parseCreateManagedAgentInput,
} from "../../../lib/managed-agents-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const result = await createManagedAgent(
      parseCreateManagedAgentInput(await request.json()),
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
    error instanceof Error ? error.message : "创建 Agent 时发生未知错误。";
  return Response.json(
    { error: message },
    {
      status: error instanceof ManagedAgentsValidationError ? 400 : 502,
      headers: { "cache-control": "no-store" },
    },
  );
}
