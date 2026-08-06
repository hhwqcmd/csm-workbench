import {
  MaterialsValidationError,
  MaterialsServiceError,
  presignedObjectUrl,
} from "../../../lib/materials-server";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const signedUrl = await presignedObjectUrl(url.searchParams.get("key") ?? "");
    if (url.searchParams.get("response") === "json") {
      return Response.json(
        { url: signedUrl, expiresIn: 3_600 },
        {
          headers: {
            "cache-control": "no-store",
            "referrer-policy": "no-referrer",
          },
        },
      );
    }
    return new Response(null, {
      status: 302,
      headers: {
        location: signedUrl,
        "cache-control": "no-store",
        "referrer-policy": "no-referrer",
      },
    });
  } catch (error) {
    const validation = error instanceof MaterialsValidationError;
    const service = error instanceof MaterialsServiceError;
    return Response.json(
      {
        error:
          validation || service
            ? error.message
            : "打开素材时发生未知错误。",
      },
      {
        status: validation ? 400 : 502,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
