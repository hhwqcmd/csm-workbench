import {
  getSeedanceTask,
  parseGetTaskInput,
  RequestValidationError,
} from "../../../../lib/seedance-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseGetTaskInput(await request.json());
    const task = await getSeedanceTask(input);
    return Response.json(task, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const validationError = error instanceof RequestValidationError;
    const message =
      error instanceof Error ? error.message : "查询任务时发生未知错误。";

    return Response.json(
      { error: message },
      {
        status: validationError ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
