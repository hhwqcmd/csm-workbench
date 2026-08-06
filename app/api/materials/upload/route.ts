import {
  MaterialsValidationError,
  MaterialsServiceError,
  uploadManualMaterialToTos,
} from "../../../lib/materials-server";
import { upsertMaterialAssetIndex } from "../../../lib/material-index-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const asset = await uploadManualMaterialToTos(
      request,
      url.searchParams.get("kind"),
      url.searchParams.get("name"),
    );
    await upsertMaterialAssetIndex(asset);
    return Response.json(asset, {
      status: 201,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    const validation = error instanceof MaterialsValidationError;
    const service = error instanceof MaterialsServiceError;
    return Response.json(
      {
        error:
          validation || service
            ? error.message
            : "上传素材时发生未知错误。",
      },
      {
        status: validation ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
