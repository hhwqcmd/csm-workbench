export type AnthropicStreamEvent = {
  type: string;
  data: unknown;
  raw: string;
};

export async function consumeAnthropicMessagesStream(
  response: Response,
  onEvent: (event: AnthropicStreamEvent) => void,
): Promise<Record<string, unknown>> {
  if (!response.body) throw new Error("流式响应没有可读取内容。");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const aggregate: Record<string, unknown> = { content: [] };
  const partialJson = new Map<number, string>();
  let buffer = "";

  const consumeFrame = (frame: string) => {
    const lines = frame.split(/\r?\n/);
    const eventName =
      lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "";
    const dataText = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .join("\n");
    if (!dataText || dataText === "[DONE]") return;
    let data: unknown;
    try {
      data = JSON.parse(dataText) as unknown;
    } catch {
      data = { type: "raw", data: dataText };
    }
    const type =
      eventName ||
      (isRecord(data) && typeof data.type === "string" ? data.type : "event");
    onEvent({ type, data, raw: frame });
    aggregateAnthropicEvent(aggregate, data, partialJson);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    frames.forEach(consumeFrame);
    if (done) break;
  }
  if (buffer.trim()) consumeFrame(buffer);
  return aggregate;
}

export function aggregateAnthropicEvent(
  message: Record<string, unknown>,
  event: unknown,
  partialJson = new Map<number, string>(),
) {
  if (!isRecord(event)) return;
  if (event.type === "message_start" && isRecord(event.message)) {
    Object.keys(message).forEach((key) => delete message[key]);
    Object.assign(message, cloneJson(event.message));
    if (!Array.isArray(message.content)) message.content = [];
    return;
  }
  const index = typeof event.index === "number" ? event.index : -1;
  const content = Array.isArray(message.content) ? message.content : [];
  message.content = content;
  if (event.type === "content_block_start" && index >= 0) {
    content[index] = isRecord(event.content_block)
      ? cloneJson(event.content_block)
      : {};
    return;
  }
  if (
    event.type === "content_block_delta" &&
    index >= 0 &&
    isRecord(event.delta)
  ) {
    const block = isRecord(content[index]) ? content[index] : {};
    content[index] = block;
    if (event.delta.type === "text_delta") {
      block.text = `${String(block.text ?? "")}${String(event.delta.text ?? "")}`;
    } else if (event.delta.type === "thinking_delta") {
      block.thinking = `${String(block.thinking ?? "")}${String(event.delta.thinking ?? "")}`;
    } else if (event.delta.type === "signature_delta") {
      block.signature = `${String(block.signature ?? "")}${String(event.delta.signature ?? "")}`;
    } else if (event.delta.type === "input_json_delta") {
      partialJson.set(
        index,
        `${partialJson.get(index) ?? ""}${String(event.delta.partial_json ?? "")}`,
      );
    }
    return;
  }
  if (
    event.type === "content_block_stop" &&
    index >= 0 &&
    partialJson.has(index)
  ) {
    const block = isRecord(content[index]) ? content[index] : {};
    try {
      block.input = JSON.parse(partialJson.get(index) ?? "{}") as unknown;
    } catch {
      block.input = { raw: partialJson.get(index) };
    }
    content[index] = block;
    partialJson.delete(index);
    return;
  }
  if (event.type === "message_delta") {
    if (isRecord(event.delta)) Object.assign(message, event.delta);
    if (isRecord(event.usage)) {
      message.usage = {
        ...(isRecord(message.usage) ? message.usage : {}),
        ...event.usage,
      };
    }
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
