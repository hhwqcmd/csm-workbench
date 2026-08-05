import {
  createSeedreamJob,
  getSeedreamJob,
} from "../../../lib/seedream-jobs-server";
import { SeedreamValidationError } from "../../../lib/seedream-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const value = (await request.json()) as Record<string, unknown>;
    const action = value.action;
    if (action === "create") {
      const { action: _action, ...input } = value;
      void _action;
      return Response.json(await createSeedreamJob(input), {
        status: 202,
        headers: { "cache-control": "no-store" },
      });
    }
    if (action === "status") {
      const { action: _action, ...input } = value;
      void _action;
      return Response.json(await getSeedreamJob(input), {
        headers: { "cache-control": "no-store" },
      });
    }
    throw new SeedreamValidationError("任务 action 只支持 create 或 status。");
  } catch (error) {
    const validation = error instanceof SeedreamValidationError;
    return Response.json(
      {
        error: validation
          ? error.message
          : "图片后台任务服务暂不可用，请稍后重试。",
      },
      {
        status: validation ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
