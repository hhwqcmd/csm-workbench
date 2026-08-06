import {
  deleteIndexedMaterial,
  listMaterialCatalog,
  renameIndexedMaterial,
  restoreCachedMaterialIndex,
} from "../../lib/material-index-server";
import {
  MaterialsServiceError,
  MaterialsValidationError,
} from "../../lib/materials-server";

export async function GET(): Promise<Response> {
  try {
    return Response.json(await listMaterialCatalog(), {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    return errorResponse(error, "读取素材库时发生未知错误。");
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    return Response.json(await renameIndexedMaterial(await request.json()), {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    return errorResponse(error, "修改素材名称时发生未知错误。");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    return Response.json(await restoreCachedMaterialIndex(await request.json()), {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    return errorResponse(error, "恢复本机素材索引时发生未知错误。");
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    return Response.json(await deleteIndexedMaterial(await request.json()), {
      headers: noStoreHeaders(),
    });
  } catch (error) {
    return errorResponse(error, "删除素材时发生未知错误。");
  }
}

function errorResponse(error: unknown, fallback: string): Response {
  const validation = error instanceof MaterialsValidationError;
  const service = error instanceof MaterialsServiceError;
  return Response.json(
    { error: validation || service ? error.message : fallback },
    {
      status: validation ? 400 : 502,
      headers: noStoreHeaders(),
    },
  );
}

function noStoreHeaders(): HeadersInit {
  return {
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
  };
}
