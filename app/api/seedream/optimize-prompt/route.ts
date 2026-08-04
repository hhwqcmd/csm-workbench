import {
  optimizeSeedreamPrompt,
  parseOptimizeSeedreamPromptInput,
  SeedreamValidationError,
} from "../../../lib/seedream-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseOptimizeSeedreamPromptInput(await request.json());
    return Response.json(await optimizeSeedreamPrompt(input), {
      status: 200,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const validationError = error instanceof SeedreamValidationError;
    const message =
      error instanceof Error ? error.message : "优化提示词时发生未知错误。";
    return Response.json(
      { error: message },
      {
        status: validationError ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
