import assert from "node:assert/strict";
import test from "node:test";

import { consumeAnthropicMessagesStream } from "../app/lib/anthropic-messages-stream.ts";

test("rebuilds thinking, signature, text, tool input JSON, stop state, and cache usage", async () => {
  const frames = [
    {
      type: "message_start",
      message: {
        id: "msg_aggregate_123",
        type: "message",
        role: "assistant",
        model: "doubao-seed-2-1-pro-260628",
        content: [],
        usage: { input_tokens: 20, cache_creation_input_tokens: 8 },
      },
    },
    {
      type: "content_block_start",
      index: 0,
      content_block: { type: "thinking", thinking: "", signature: "" },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "thinking_delta", thinking: "先分析" },
    },
    {
      type: "content_block_delta",
      index: 0,
      delta: { type: "signature_delta", signature: "sig-part-1" },
    },
    { type: "content_block_stop", index: 0 },
    {
      type: "content_block_start",
      index: 1,
      content_block: { type: "text", text: "" },
    },
    {
      type: "content_block_delta",
      index: 1,
      delta: { type: "text_delta", text: "结论" },
    },
    { type: "content_block_stop", index: 1 },
    {
      type: "content_block_start",
      index: 2,
      content_block: {
        type: "tool_use",
        id: "toolu_weather_123",
        name: "get_weather",
        input: {},
      },
    },
    {
      type: "content_block_delta",
      index: 2,
      delta: { type: "input_json_delta", partial_json: '{"location":' },
    },
    {
      type: "content_block_delta",
      index: 2,
      delta: { type: "input_json_delta", partial_json: '"北京"}' },
    },
    { type: "content_block_stop", index: 2 },
    {
      type: "message_delta",
      delta: { stop_reason: "tool_use", stop_sequence: null },
      usage: { output_tokens: 16, cache_read_input_tokens: 5 },
    },
    { type: "message_stop" },
  ];
  const payload = `${frames
    .map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}`)
    .join("\n\n")}\n\n`;
  const encoder = new TextEncoder();
  const cutA = payload.indexOf("sig-part") + 4;
  const cutB = Math.max(cutA + 1, Math.floor(payload.length * 0.7));
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(payload.slice(0, cutA)));
        controller.enqueue(encoder.encode(payload.slice(cutA, cutB)));
        controller.enqueue(encoder.encode(payload.slice(cutB)));
        controller.close();
      },
    }),
    { headers: { "content-type": "text/event-stream" } },
  );
  const timeline = [];
  const message = await consumeAnthropicMessagesStream(response, (event) => {
    timeline.push(event);
  });

  assert.equal(timeline.length, frames.length);
  assert.equal(timeline[0].type, "message_start");
  assert.equal(timeline.at(-1).type, "message_stop");
  assert.equal(message.id, "msg_aggregate_123");
  assert.deepEqual(message.content, [
    { type: "thinking", thinking: "先分析", signature: "sig-part-1" },
    { type: "text", text: "结论" },
    {
      type: "tool_use",
      id: "toolu_weather_123",
      name: "get_weather",
      input: { location: "北京" },
    },
  ]);
  assert.equal(message.stop_reason, "tool_use");
  assert.deepEqual(message.usage, {
    input_tokens: 20,
    cache_creation_input_tokens: 8,
    output_tokens: 16,
    cache_read_input_tokens: 5,
  });
});
