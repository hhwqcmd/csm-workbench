import {
  createSeedanceTask,
  parseCreateTaskInput,
  RequestValidationError,
} from "../../../lib/seedance-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseCreateTaskInput(await request.json());
    const task = await createSeedanceTask(input);
    return Response.json(task, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown): Response {
  const validationError = error instanceof RequestValidationError;
  const message =
    error instanceof Error ? error.message : "创建任务时发生未知错误。";

  return Response.json(
    { error: message },
    {
      status: validationError ? 400 : 502,
      headers: { "cache-control": "no-store" },
    },
  );
}
