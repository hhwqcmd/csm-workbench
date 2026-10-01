import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { buildCurlCommand } from "../app/lib/curl-command.ts";

test("builds a paste-ready cURL command with headers and a JSON body", () => {
  const body = {
    model: "doubao-seed-2-1-pro-260628",
    input: "Explain O'Reilly's example.\nKeep the second line.",
    stream: false,
  };
  const command = buildCurlCommand({
    method: "post",
    url: "https://ark.cn-beijing.volces.com/api/v3/responses",
    headers: {
      Authorization: "Bearer test-key-not-real",
      "Content-Type": "application/json",
    },
    body,
  });

  assert.match(
    command,
    /^curl --fail-with-body --silent --show-error --request POST --url /,
  );
  assert.doesNotMatch(command, /\n/);
  assert.match(command, /--data-raw/);

  const captured = execFileSync("bash", [
    "-c",
    `curl() { printf '%s\\0' "$@"; }\n${command}`,
  ])
    .toString()
    .split("\0")
    .filter(Boolean);

  assert.deepEqual(captured, [
    "--fail-with-body",
    "--silent",
    "--show-error",
    "--request",
    "POST",
    "--url",
    "https://ark.cn-beijing.volces.com/api/v3/responses",
    "--header",
    "Authorization: Bearer test-key-not-real",
    "--header",
    "Content-Type: application/json",
    "--data-raw",
    JSON.stringify(body),
  ]);
});

test("omits the body for lifecycle requests and keeps the API Key placeholder", () => {
  const command = buildCurlCommand({
    method: "GET",
    url: "https://ark.cn-beijing.volces.com/api/v3/responses/{response_id}",
    headers: { Authorization: "Bearer <ARK_API_KEY>" },
  });

  assert.match(command, /--request GET/);
  assert.match(command, /--url 'https:\/\/ark\.cn-beijing\.volces\.com/);
  assert.match(command, /Authorization: Bearer <ARK_API_KEY>/);
  assert.doesNotMatch(command, /--data-raw/);
});

test("includes the fixed Anthropic version header and Messages body", () => {
  const command = buildCurlCommand({
    method: "POST",
    url: "https://ark.cn-beijing.volces.com/api/compatible/v1/messages",
    headers: {
      Authorization: "Bearer <ARK_API_KEY>",
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: {
      model: "doubao-seed-2-1-pro-260628",
      max_tokens: 1024,
      messages: [{ role: "user", content: "hello" }],
      stream: false,
    },
  });

  assert.match(command, /api\/compatible\/v1\/messages/);
  assert.match(command, /anthropic-version: 2023-06-01/);
  assert.match(command, /Authorization: Bearer <ARK_API_KEY>/);
  assert.match(command, /"max_tokens":1024/);
});
