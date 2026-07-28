import {
  ManagedAgentsValidationError,
  parseSendManagedMessageInput,
  sendManagedMessageAndOpenStream,
} from "../../../lib/managed-agents-server";

export async function POST(request: Request): Promise<Response> {
  try {
    return await sendManagedMessageAndOpenStream(
      parseSendManagedMessageInput(await request.json()),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "发送消息时发生未知错误。";
    return Response.json(
      { error: message },
      {
        status: error instanceof ManagedAgentsValidationError ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
