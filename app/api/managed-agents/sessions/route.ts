import {
  manageManagedSession,
  ManagedAgentsValidationError,
  parseManageManagedSessionInput,
} from "../../../lib/managed-agents-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const result = await manageManagedSession(
      parseManageManagedSessionInput(await request.json()),
    );
    return Response.json(
      result.status === 204
        ? { deleted: true, upstream_http_status: 204 }
        : result.payload,
      {
      status: result.status === 204 ? 200 : result.status,
      headers: { "cache-control": "no-store" },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown): Response {
  const message =
    error instanceof Error ? error.message : "管理 Session 时发生未知错误。";
  return Response.json(
    { error: message },
    {
      status: error instanceof ManagedAgentsValidationError ? 400 : 502,
      headers: { "cache-control": "no-store" },
    },
  );
}
