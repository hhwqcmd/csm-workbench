import { NextResponse } from "next/server";
import {
  AI_CODING_ORGANIZATION,
  buildAiCodingMetricsResponse,
} from "../../../lib/ai-coding-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizationId =
    url.searchParams.get("org_id") ?? AI_CODING_ORGANIZATION.id;
  const period = url.searchParams.get("period") ?? "30d";
  const scope = url.searchParams.get("scope") ?? "organization";

  if (organizationId !== AI_CODING_ORGANIZATION.id) {
    return NextResponse.json(
      {
        error: {
          code: "organization_not_found",
          message: "当前演示数据集中不存在该组织。",
        },
      },
      { status: 404 },
    );
  }

  if (period !== "30d") {
    return NextResponse.json(
      {
        error: {
          code: "unsupported_period",
          message: "当前演示快照仅支持 period=30d。",
        },
      },
      { status: 400 },
    );
  }

  if (scope !== "organization") {
    return NextResponse.json(
      {
        error: {
          code: "unsupported_scope",
          message: "当前演示快照仅支持 scope=organization。",
        },
      },
      { status: 400 },
    );
  }

  return NextResponse.json(buildAiCodingMetricsResponse(), {
    headers: {
      "Cache-Control": "no-store",
      "X-Data-Mode": "simulation",
    },
  });
}
