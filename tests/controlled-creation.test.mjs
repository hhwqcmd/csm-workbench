import assert from "node:assert/strict";
import test from "node:test";

import {
  mapWithConcurrency,
  replaceSeedancePrompt,
  seedanceBatchTaskCount,
  validateSeedanceBatchSize,
} from "../app/lib/seedance-batch.ts";
import { estimateSeedanceBatchCost } from "../app/lib/seedance-pricing.ts";
import {
  appendSeedreamBbox,
  appendSeedreamPoint,
  normalizeSeedreamPoint,
  parseSeedreamAnnotations,
  removeSeedreamAnnotation,
  validateSeedreamAnnotations,
} from "../app/lib/seedream-annotations.ts";

test("enforces controlled batch multiplication boundaries", () => {
  assert.equal(seedanceBatchTaskCount(["a", "b"], 1), 2);
  assert.deepEqual(validateSeedanceBatchSize(["a", "b"], 1), []);
  assert.deepEqual(validateSeedanceBatchSize(["a", "b", "c"], 4), []);
  assert.match(
    validateSeedanceBatchSize(["a", "b", "c"], 5)[0],
    /最多创建 12 个任务/,
  );
  assert.match(validateSeedanceBatchSize(["a"], 1)[0], /至少创建 2 个任务/);
});

test("never exceeds the configured concurrency", async () => {
  let active = 0;
  let peak = 0;
  const results = await mapWithConcurrency(
    Array.from({ length: 12 }, (_, index) => index),
    3,
    async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 4));
      active -= 1;
      return value * 2;
    },
  );
  assert.equal(peak, 3);
  assert.deepEqual(results, Array.from({ length: 12 }, (_, index) => index * 2));
});

test("replaces only the prompt in a shared Seedance request snapshot", () => {
  const template = {
    model: "doubao-seedance-2-0-mini-260615",
    content: [
      { type: "text", text: "old" },
      {
        type: "image_url",
        image_url: { url: "https://example.com/reference.png" },
        role: "reference_image",
      },
    ],
    ratio: "16:9",
    duration: 5,
    watermark: false,
  };
  const next = replaceSeedancePrompt(template, "new prompt");
  assert.equal(next.content[0].text, "new prompt");
  assert.deepEqual(next.content.slice(1), template.content.slice(1));
  assert.equal(next.ratio, template.ratio);
  assert.equal(next.duration, template.duration);
});

test("uses conditional Seedance RMB estimates and smart-duration ranges", () => {
  const fixed = estimateSeedanceBatchCost({
    apiPath: "official",
    model: "doubao-seedance-2-0-mini-260615",
    ratio: "16:9",
    resolution: "720p",
    duration: 5,
    minimumDuration: 4,
    maximumDuration: 15,
    taskCount: 2,
    content: [{ type: "text", text: "test" }],
  });
  assert.equal(fixed.kind, "estimated");
  assert.equal(fixed.minRmb, 5);
  assert.equal(fixed.maxRmb, 5);

  const smart = estimateSeedanceBatchCost({
    apiPath: "official",
    model: "doubao-seedance-2-5-260628",
    ratio: "16:9",
    resolution: "720p",
    duration: -1,
    minimumDuration: 4,
    maximumDuration: 30,
    taskCount: 2,
    content: [{ type: "text", text: "test" }],
  });
  assert.equal(smart.kind, "estimated");
  assert.equal(smart.minRmb, 12.08);
  assert.equal(smart.maxRmb, 90.6);

  const videoInput = estimateSeedanceBatchCost({
    apiPath: "official",
    model: "doubao-seedance-2-5-260628",
    ratio: "16:9",
    resolution: "720p",
    duration: 5,
    minimumDuration: 4,
    maximumDuration: 30,
    taskCount: 2,
    content: [
      {
        type: "video_url",
        video_url: { url: "https://example.com/reference.mp4" },
        role: "reference_video",
      },
    ],
  });
  assert.equal(videoInput.kind, "unavailable");

  const plan = estimateSeedanceBatchCost({
    apiPath: "agent-plan",
    model: "doubao-seedance-2.0",
    ratio: "16:9",
    resolution: "720p",
    duration: 5,
    minimumDuration: 4,
    maximumDuration: 15,
    taskCount: 2,
    content: [{ type: "text", text: "test" }],
  });
  assert.equal(plan.kind, "agent-plan");
});

test("normalizes Seedream point and reverse-drag bbox coordinates", () => {
  assert.deepEqual(normalizeSeedreamPoint(0, 0, 100, 200), { x: 0, y: 0 });
  assert.deepEqual(normalizeSeedreamPoint(50, 100, 100, 200), {
    x: 500,
    y: 500,
  });
  assert.deepEqual(normalizeSeedreamPoint(100, 200, 100, 200), {
    x: 999,
    y: 999,
  });
  assert.deepEqual(normalizeSeedreamPoint(120, -20, 100, 200), {
    x: 999,
    y: 0,
  });

  const pointPrompt = appendSeedreamPoint("focus", 1, 500, 500);
  assert.equal(pointPrompt, "focus 图1<point>500 500</point>");
  const bboxPrompt = appendSeedreamBbox(
    pointPrompt,
    2,
    { x: 900, y: 800 },
    { x: 100, y: 200 },
  );
  assert.match(bboxPrompt, /图2<bbox>100 200 900 800<\/bbox>/);
});

test("parses, removes, and validates prompt-native Seedream annotations", () => {
  const prompt =
    "保留主体 图1<point>0 999</point> 调整图2<bbox>100 200 900 800</bbox> 图1<point>500 500</point>";
  const annotations = parseSeedreamAnnotations(prompt);
  assert.equal(annotations.length, 3);
  assert.equal(annotations[1].imageNumber, 2);
  assert.deepEqual(annotations[1].coordinates, [100, 200, 900, 800]);
  const removed = removeSeedreamAnnotation(prompt, annotations[0]);
  assert.doesNotMatch(removed, /图1<point>0 999<\/point>/);
  assert.match(removed, /图1<point>500 500<\/point>/);

  assert.deepEqual(
    validateSeedreamAnnotations({
      prompt,
      imageCount: 2,
      model: "doubao-seedream-5-0-pro-260628",
    }),
    [],
  );
  assert.match(
    validateSeedreamAnnotations({
      prompt,
      imageCount: 2,
      model: "doubao-seedream-5-0-lite-260128",
    }).join(" "),
    /仅 Seedream 5.0 Pro 支持/,
  );
  assert.match(
    validateSeedreamAnnotations({
      prompt: "图3<point>1000 2</point>",
      imageCount: 2,
      model: "doubao-seedream-5-0-pro-260628",
    }).join(" "),
    /不存在的图3.*0–999/s,
  );
  assert.match(
    validateSeedreamAnnotations({
      prompt: "图1<bbox>500 500 100 100</bbox>",
      imageCount: 1,
      model: "doubao-seedream-5-0-pro-260628",
    }).join(" "),
    /x1 < x2/,
  );
  assert.match(
    validateSeedreamAnnotations({
      prompt: "图1<point>1,2</point>",
      imageCount: 1,
      model: "doubao-seedream-5-0-pro-260628",
    }).join(" "),
    /格式错误/,
  );
});
