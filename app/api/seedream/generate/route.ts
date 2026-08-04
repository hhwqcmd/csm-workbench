import {
  parseGenerateSeedreamInput,
  proxySeedreamGeneration,
  SeedreamValidationError,
} from "../../../lib/seedream-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseGenerateSeedreamInput(await request.json());
    return await proxySeedreamGeneration(input);
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown): Response {
  const validationError = error instanceof SeedreamValidationError;
  const message =
    error instanceof Error ? error.message : "生成图片时发生未知错误。";
  return Response.json(
    { error: message },
    {
      status: validationError ? 400 : 502,
      headers: { "cache-control": "no-store" },
    },
  );
}
