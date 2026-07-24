import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

async function request(path = "/", init) {
  const worker = await loadWorker();
  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Seedance demonstration workbench", async () => {
  const response = await request();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Seedance 2\.0 视频生成演示工作台/);
  assert.match(html, /property="og:image" content="http:\/\/localhost:3001\/og\.png"/);
  assert.match(html, /视频生成演示工作台/);
  assert.match(html, /SEEDANCE API DEMO CONSOLE/);
  assert.doesNotMatch(html, /共学|STEP 03|当前检测结果|环境就绪|共学路线/);
  assert.match(html, /将视频1礼盒中的香水替换成图片1中的面霜/);
  assert.ok(
    html.indexOf('id="sample"') < html.indexOf('id="operations"'),
    "the official sample should appear before the operations console",
  );
  assert.match(html, /ark\.cn-beijing\.volces\.com\/api\/v3/);
  assert.match(html, /官方 API（标准按量调用）/);
  assert.match(html, /Agent Plan API（套餐通道）/);
  assert.match(html, /doubao-seedance-2-0-fast-260128/);
  assert.match(html, /doubao-seedance-2-0-mini-260615/);
  assert.match(html, /doubao-seedance-1-5-pro-251215/);
  assert.match(html, /即将下线/);
  assert.match(html, /option value="official" selected=""/);
  assert.match(
    html,
    /option value="doubao-seedance-2-0-mini-260615" selected=""/,
  );
  assert.match(html, /type="password"/);
  assert.match(html, /演示模式已开启：Key 会保存在当前浏览器/);
  assert.match(html, /完整 API 请求详情/);
  assert.match(html, /完整 API 请求体/);
  assert.match(html, /双向联动/);
  assert.match(html, /执行真实视频生成任务/);
  assert.match(html, /每 30 秒查询一次/);
  assert.match(html, /产生费用/);
  assert.match(html, /演示模式：在当前浏览器记住 API Key/);
  assert.match(html, /历史任务/);
  assert.match(html, /暂无历史任务/);
  assert.doesNotMatch(html, /codex-preview/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("does not embed an API key in server HTML or the example environment", async () => {
  const response = await request();
  const html = await response.text();
  const envExample = await readFile(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(html, /AGENT_API_KEY\s*=/);
  assert.doesNotMatch(html, /NEXT_PUBLIC_(?:ARK|AGENT)_API_KEY/);
  assert.match(envExample, /^AGENT_API_KEY=$/m);
  assert.doesNotMatch(envExample, /^AGENT_API_KEY=.+$/m);
});

test("persists task logs and repeats polling while a task remains active", async () => {
  const runnerSource = await readFile(
    new URL("../app/components/SeedanceTaskRunner.tsx", import.meta.url),
    "utf8",
  );

  assert.match(runnerSource, /seedance-workbench:task-history:v1/);
  assert.match(runnerSource, /seedance-workbench:demo-credentials:v1/);
  assert.match(runnerSource, /window\.localStorage\.setItem/);
  assert.match(runnerSource, /phase: "create"/);
  assert.match(runnerSource, /phase: "status"/);
  assert.match(runnerSource, /查看日志/);
  assert.match(runnerSource, /response: capturedResponse/);
  assert.match(runnerSource, /parseEditableApiBody/);
  assert.match(runnerSource, /setPollCycle\(\(current\) => current \+ 1\)/);
  assert.match(runnerSource, /状态查询暂时失败，将在 30 秒后重试/);
});

test("lists every current standard and Agent Plan video model", async () => {
  const selectorSource = await readFile(
    new URL("../app/lib/seedance-config.ts", import.meta.url),
    "utf8",
  );

  const standardModels = [
    "doubao-seedance-2-0-260128",
    "doubao-seedance-2-0-fast-260128",
    "doubao-seedance-2-0-mini-260615",
    "doubao-seedance-1-5-pro-251215",
    "doubao-seedance-1-0-pro-250528",
    "doubao-seedance-1-0-pro-fast-251015",
  ];
  const agentPlanModels = [
    "doubao-seedance-2.0",
    "doubao-seedance-2.0-fast",
    "doubao-seedance-2.0-mini",
    "doubao-seedance-1.5-pro",
  ];

  for (const model of [...standardModels, ...agentPlanModels]) {
    assert.match(selectorSource, new RegExp(model.replaceAll(".", "\\.")));
  }
});

test("rejects a Base URL that does not match the selected API path", async () => {
  const response = await request("/api/seedance/tasks", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...validTaskInput(),
      baseUrl: "https://example.com/api/v3",
    }),
  });

  assert.equal(response.status, 400);
  assert.match(await response.text(), /必须使用/);
});

test("creates a task through the server without returning the API key", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-agent-key-not-real";
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input: String(input), init };
    return Response.json({ id: "task-test-123", status: "queued" });
  };

  try {
    const response = await request("/api/seedance/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...validTaskInput(), apiKey }),
    });
    const body = await response.text();

    assert.equal(response.status, 201);
    assert.match(body, /task-test-123/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(
      upstreamRequest.input,
      "https://ark.cn-beijing.volces.com/api/plan/v3/contents/generations/tasks",
    );
    assert.equal(upstreamRequest.init.method, "POST");
    assert.equal(upstreamRequest.init.headers.authorization, `Bearer ${apiKey}`);

    const upstreamBody = JSON.parse(upstreamRequest.init.body);
    assert.equal(upstreamBody.model, "doubao-seedance-2.0");
    assert.equal(upstreamBody.duration, 5);
    assert.equal(upstreamBody.ratio, "16:9");
    assert.equal(upstreamBody.generate_audio, true);
    assert.equal(upstreamBody.watermark, true);
    assert.equal(upstreamBody.content.length, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("polls a task through POST so the API key never enters the URL", async () => {
  const originalFetch = globalThis.fetch;
  const apiKey = "test-agent-key-not-real";
  let upstreamRequest;

  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input: String(input), init };
    return Response.json({
      id: "task-test-123",
      status: "succeeded",
      content: { video_url: "https://example.com/result.mp4" },
    });
  };

  try {
    const response = await request("/api/seedance/tasks/status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        apiPath: "agent-plan",
        baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3",
        model: "doubao-seedance-2.0",
        apiKey,
        taskId: "task-test-123",
      }),
    });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /succeeded/);
    assert.match(body, /https:\/\/example\.com\/result\.mp4/);
    assert.doesNotMatch(body, new RegExp(apiKey));
    assert.equal(
      upstreamRequest.input,
      "https://ark.cn-beijing.volces.com/api/plan/v3/contents/generations/tasks/task-test-123",
    );
    assert.equal(upstreamRequest.init.method, "GET");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function validTaskInput() {
  return {
    apiPath: "agent-plan",
    baseUrl: "https://ark.cn-beijing.volces.com/api/plan/v3",
    model: "doubao-seedance-2.0",
    apiKey: "test-agent-key-not-real",
    prompt: "将视频1礼盒中的香水替换成图片1中的面霜，运镜不变",
    imageUrl:
      "https://ark-project.tos-cn-beijing.volces.com/doc_image/r2v_edit_pic1.jpg",
    videoUrl:
      "https://ark-project.tos-cn-beijing.volces.com/doc_video/r2v_edit_video1.mp4",
    ratio: "16:9",
    duration: 5,
    generateAudio: true,
    watermark: true,
  };
}
