import {
  listManagedSessionFiles,
  ManagedAgentsValidationError,
  parseManagedConnection,
  parseManageManagedFileInput,
  uploadManagedFile,
} from "../../../lib/managed-agents-server";

export async function POST(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const result = contentType.includes("multipart/form-data")
      ? await uploadFromForm(request)
      : await listManagedSessionFiles(
          parseManageManagedFileInput(await request.json()),
        );
    return Response.json(result.payload, {
      status: result.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

async function uploadFromForm(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ManagedAgentsValidationError("请选择需要上传的文件。");
  }
  return uploadManagedFile({
    ...parseManagedConnection({
      baseUrl: form.get("baseUrl"),
      apiKey: form.get("apiKey"),
    }),
    action: "upload",
    file,
  });
}

function errorResponse(error: unknown): Response {
  const message =
    error instanceof Error ? error.message : "管理 Files 时发生未知错误。";
  return Response.json(
    { error: message },
    {
      status: error instanceof ManagedAgentsValidationError ? 400 : 502,
      headers: { "cache-control": "no-store" },
    },
  );
}
