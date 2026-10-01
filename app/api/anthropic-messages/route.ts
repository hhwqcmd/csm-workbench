import {
  AnthropicMessagesValidationError,
  parseCreateAnthropicMessagesInput,
  proxyAnthropicMessages,
} from "../../lib/anthropic-messages-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseCreateAnthropicMessagesInput(await request.json());
    return await proxyAnthropicMessages(input);
  } catch (error) {
    const validationError = error instanceof AnthropicMessagesValidationError;
    const message =
      error instanceof Error
        ? error.message
        : "调用 Messages API（Anthropic 兼容）时发生未知错误。";
    return Response.json(
      { error: message },
      {
        status: validationError ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
