import {
  MaterialsServiceError,
  MaterialsValidationError,
  presignPelicanResultUrl,
  readPelicanResultBundle,
  savePelicanResultToTos,
} from "../../../lib/materials-server";
import {
  PelicanValidationError,
  parsePelicanFetchInput,
  parsePelicanSaveInput,
} from "../../../lib/pelican-server";

// Archive a Pelican Test result bundle under demo/pelican/{runId}.json.
export async function POST(request: Request): Promise<Response> {
  try {
    const input = parsePelicanSaveInput(await request.json());
    const bundle = {
      runId: input.runId,
      createdAt: input.createdAt,
      model: input.model,
      judgeModel: input.judgeModel,
      judgeMode: input.judgeMode,
      svg: input.svg,
      scores: input.scores,
      overall: input.overall,
      comments: input.comments,
      ...(input.renderMeta ? { renderMeta: input.renderMeta } : {}),
      ...(input.usage ? { usage: input.usage } : {}),
      tosObjectKey: input.objectKey,
    };
    const result = await savePelicanResultToTos(
      input.objectKey,
      JSON.stringify(bundle),
    );
    return Response.json(
      { objectKey: result.objectKey, size: result.size },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error, "保存鹈鹕测试结果时发生未知错误。");
  }
}

// GET ?key=demo/pelican/pel-….json
//   default            → pre-signed download URL { url, expiresIn }
//   &content=bundle    → same-origin JSON proxy of the archived bundle
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const { key, content } = parsePelicanFetchInput(url.searchParams);
    if (content) {
      const bundle = await readPelicanResultBundle(key);
      if (bundle === null) {
        return Response.json(
          { error: "未找到对应的鹈鹕测试结果。" },
          { status: 404, headers: { "cache-control": "no-store" } },
        );
      }
      return Response.json(bundle, {
        headers: {
          "cache-control": "no-store",
          "referrer-policy": "no-referrer",
        },
      });
    }
    const signed = await presignPelicanResultUrl(key);
    return Response.json(
      { url: signed.url, expiresIn: signed.expiresIn },
      {
        headers: {
          "cache-control": "no-store",
          "referrer-policy": "no-referrer",
        },
      },
    );
  } catch (error) {
    return errorResponse(error, "读取鹈鹕测试结果时发生未知错误。");
  }
}

function errorResponse(error: unknown, fallback: string): Response {
  if (
    error instanceof PelicanValidationError ||
    error instanceof MaterialsValidationError
  ) {
    return Response.json(
      { error: error.message },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  if (error instanceof MaterialsServiceError) {
    return Response.json(
      { error: error.message },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
  return Response.json(
    { error: fallback },
    { status: 502, headers: { "cache-control": "no-store" } },
  );
}
