import {
  PelicanResponsesValidationError,
  parsePelicanResponsesInput,
  proxyPelicanResponses,
} from "../../../lib/pelican-responses-server";

// Pelican Test dedicated create-only proxy. Unlike the shared /api/responses
// route, the Base URL is filled manually in the panel (defaulting to the
// standard /api/v3) and validated server-side before forwarding.
export async function POST(request: Request): Promise<Response> {
  try {
    const input = parsePelicanResponsesInput(await request.json());
    return await proxyPelicanResponses(input);
  } catch (error) {
    const validationError =
      error instanceof PelicanResponsesValidationError;
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    const message = timedOut
      ? "上游 Responses API 响应超过 600 秒被中止；该次生成可能仍在上游进行，请稍后再试或改用推理占用更小的模型。"
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
