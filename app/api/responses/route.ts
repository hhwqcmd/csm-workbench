import {
  parseManageResponsesInput,
  proxyResponses,
  ResponsesValidationError,
} from "../../lib/responses-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseManageResponsesInput(await request.json());
    return await proxyResponses(input);
  } catch (error) {
    const validationError = error instanceof ResponsesValidationError;
    const message =
      error instanceof Error
        ? error.message
        : "调用 Responses API 时发生未知错误。";
    return Response.json(
      { error: message },
      {
        status: validationError ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
