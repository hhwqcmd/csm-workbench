import {
  importGeneratedMaterialToTos,
  MaterialsServiceError,
  MaterialsValidationError,
  parseImportMaterialInput,
} from "../../../lib/materials-server";
import { upsertMaterialAssetIndex } from "../../../lib/material-index-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const input = parseImportMaterialInput(await request.json());
    const asset = await importGeneratedMaterialToTos(input);
    await upsertMaterialAssetIndex(asset);
    return Response.json(asset, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error, "保存到素材库时发生未知错误。");
  }
}

function errorResponse(error: unknown, fallback: string): Response {
  const validation = error instanceof MaterialsValidationError;
  const service = error instanceof MaterialsServiceError;
  return Response.json(
    { error: validation || service ? error.message : fallback },
    {
      status: validation ? 400 : 502,
      headers: { "cache-control": "no-store" },
    },
  );
}
