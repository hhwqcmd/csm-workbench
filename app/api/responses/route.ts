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
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    const message = timedOut
      ? "上游 Responses API 响应超过 300 秒被中止；该次生成可能仍在上游进行，请稍后再试或改用推理占用更小的模型。"
      : error instanceof Error
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
