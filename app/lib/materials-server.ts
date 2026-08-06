import "server-only";

import type {
  MaterialAsset,
  MaterialKind,
} from "./material-assets";

export class MaterialsValidationError extends Error {}
export class MaterialsServiceError extends Error {}

type ByteCounter = { value: number };

type TosConfig = {
  accessKey: string;
  secretKey: string;
  bucket: string;
  endpoint: URL;
  region: string;
  prefix: string;
};

type ImportMaterialInput = {
  kind: "video" | "image";
  source: "seedance" | "seedream";
  sourceRef: string;
  sourceValue: string;
  name: string;
};

type ListedTosObject = {
  key: string;
  lastModified: string;
  size: number;
};

const MAX_BYTES: Record<MaterialKind, number> = {
  image: 20 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

const MIME_EXTENSIONS: Record<MaterialKind, Record<string, string>> = {
  image: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  },
  video: {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  },
  audio: {
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
    "audio/ogg": "ogg",
    "audio/flac": "flac",
  },
};

const encoder = new TextEncoder();

export function parseImportMaterialInput(value: unknown): ImportMaterialInput {
  const input = exactRecord(value, [
    "kind",
    "source",
    "sourceRef",
    "sourceValue",
    "name",
  ]);
  if (input.kind !== "video" && input.kind !== "image") {
    throw new MaterialsValidationError("生成结果只支持保存视频或图片。");
  }
  if (input.source !== "seedance" && input.source !== "seedream") {
    throw new MaterialsValidationError("素材来源不正确。");
  }
  if (input.kind === "video" && input.source !== "seedance") {
    throw new MaterialsValidationError("视频生成结果必须来自 Seedance。");
  }
  return {
    kind: input.kind,
    source: input.source,
    sourceRef: requiredString(input.sourceRef, "来源标识", 300),
    sourceValue: requiredString(
      input.sourceValue,
      "生成结果",
      input.kind === "image" ? 30_000_000 : 8_000,
    ),
    name: safeFilename(requiredString(input.name, "素材名称", 180)),
  };
}

export async function importGeneratedMaterialToTos(
  input: ImportMaterialInput,
): Promise<MaterialAsset> {
  const config = tosConfig();
  const source = input.sourceValue.startsWith("data:")
    ? dataUrlBody(input.sourceValue, input.kind)
    : await fetchRemoteBody(input.sourceValue, input.kind);
  const digest = await sha256Hex(`${input.source}:${input.sourceRef}`);
  const extension = extensionFor(input.kind, source.contentType);
  const objectKey = `${config.prefix}${input.kind}/generated/${digest}.${extension}`;
  await putObject(config, objectKey, source.body, source.contentType);
  return materialAsset({
    id: `generated-${digest.slice(0, 24)}`,
    kind: input.kind,
    objectKey,
    name: ensureExtension(input.name, extension),
    contentType: source.contentType,
    size: source.size || source.counter?.value || 0,
    source: input.source,
    sourceRef: input.sourceRef,
  });
}

export async function uploadManualMaterialToTos(
  request: Request,
  kindValue: string | null,
  nameValue: string | null,
): Promise<MaterialAsset> {
  const kind = materialKind(kindValue);
  const name = safeFilename(requiredString(nameValue, "文件名", 180));
  const contentType = normalizedContentType(
    request.headers.get("content-type") ?? "",
  );
  extensionFor(kind, contentType);
  if (!request.body) {
    throw new MaterialsValidationError("上传文件不能为空。");
  }
  const declaredSize = optionalContentLength(request.headers.get("content-length"));
  if (declaredSize !== undefined && declaredSize > MAX_BYTES[kind]) {
    throw new MaterialsValidationError(sizeMessage(kind));
  }
  const config = tosConfig();
  const id = crypto.randomUUID();
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const objectKey = `${config.prefix}${kind}/uploads/${date}/${id}-${name}`;
  const inspected = await validatedMimeStream(request.body, kind, contentType);
  const counter: ByteCounter = { value: 0 };
  const uploadBody =
    kind === "image"
      ? await readLimitedBytes(inspected, MAX_BYTES[kind], kind)
      : limitStream(inspected, MAX_BYTES[kind], kind, counter);
  await putObject(config, objectKey, uploadBody, contentType);
  return materialAsset({
    id: `manual-${id}`,
    kind,
    objectKey,
    name,
    contentType,
    size:
      declaredSize ??
      (uploadBody instanceof Uint8Array ? uploadBody.byteLength : counter.value),
    source: "manual",
    sourceRef: `manual:${id}`,
  });
}

export async function presignedObjectUrl(objectKeyValue: string): Promise<string> {
  const config = tosConfig();
  const objectKey = requiredString(objectKeyValue, "对象键", 1_024);
  assertObjectKey(config, objectKey);
  return presign(config, "GET", objectKey, 3_600);
}

export async function verifyCachedMaterialAsset(
  value: unknown,
): Promise<MaterialAsset | null> {
  const input = exactRecord(value, [
    "id",
    "kind",
    "objectKey",
    "name",
    "contentType",
    "size",
    "createdAt",
    "source",
    "sourceRef",
  ]);
  const config = tosConfig();
  const kind = materialKind(requiredString(input.kind, "素材类型", 10));
  const objectKey = requiredString(input.objectKey, "对象键", 1_024);
  assertMaterialObjectKey(config, objectKey);
  if (!objectKey.startsWith(`${config.prefix}${kind}/`)) {
    throw new MaterialsValidationError("素材类型与对象路径不一致。");
  }
  const id = requiredString(input.id, "素材 ID", 120);
  const name = requiredString(input.name, "素材名称", 180);
  const source = input.source;
  if (source !== "seedance" && source !== "seedream" && source !== "manual") {
    throw new MaterialsValidationError("素材来源不正确。");
  }
  const sourceRef = requiredString(input.sourceRef, "来源标识", 300);
  const declaredContentType = normalizedContentType(
    requiredString(input.contentType, "文件 MIME", 120),
  );
  extensionFor(kind, declaredContentType);
  if (!Number.isSafeInteger(input.size) || Number(input.size) < 0) {
    throw new MaterialsValidationError("素材大小不正确。");
  }
  const createdAt = requiredString(input.createdAt, "创建时间", 80);
  if (Number.isNaN(new Date(createdAt).getTime())) {
    throw new MaterialsValidationError("素材创建时间不正确。");
  }

  const url = await presign(config, "HEAD", objectKey, 600);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new MaterialsServiceError("TOS 素材校验请求未能发送，请稍后重试。");
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    throw await tosResponseError(response, "TOS 素材校验失败");
  }
  const responseContentType = normalizedContentType(
    response.headers.get("content-type") ?? declaredContentType,
  );
  extensionFor(kind, responseContentType);
  const responseSize = optionalContentLength(response.headers.get("content-length"));
  return {
    id,
    kind,
    objectKey,
    name,
    contentType: responseContentType,
    size: responseSize ?? Number(input.size),
    createdAt: new Date(createdAt).toISOString(),
    source,
    sourceRef,
  };
}

export async function listTosMaterialAssets(): Promise<MaterialAsset[]> {
  const config = tosConfig();
  const assets: MaterialAsset[] = [];
  for (const kind of ["video", "image", "audio"] as const) {
    const prefix = `${config.prefix}${kind}/`;
    let continuationToken = "";
    for (let page = 0; page < 100; page += 1) {
      const query: Record<string, string> = {
        "list-type": "2",
        prefix,
        "max-keys": "1000",
      };
      if (continuationToken) {
        query["continuation-token"] = continuationToken;
      }
      const signed = await signedRequest(config, "GET", "", query);
      let response: Response;
      try {
        response = await fetch(signed.url, {
          method: "GET",
          headers: signed.headers,
          redirect: "manual",
          signal: AbortSignal.timeout(60_000),
        });
      } catch {
        throw new MaterialsServiceError(
          "TOS 素材目录暂时无法读取，请稍后重试。",
        );
      }
      if (!response.ok) {
        throw await tosResponseError(response, "TOS 素材目录读取失败");
      }
      const pageResult = parseListObjectsResponse(await response.text());
      for (const object of pageResult.objects) {
        const asset = await recoveredMaterialAsset(config, object);
        if (asset) assets.push(asset);
      }
      if (!pageResult.isTruncated) break;
      if (!pageResult.nextContinuationToken) {
        throw new MaterialsServiceError("TOS 素材目录分页响应不完整。");
      }
      continuationToken = pageResult.nextContinuationToken;
      if (page === 99) {
        throw new MaterialsServiceError("TOS 素材目录对象数量超过恢复上限。");
      }
    }
  }
  return assets;
}

export async function deleteTosMaterialObject(
  objectKeyValue: string,
): Promise<void> {
  const config = tosConfig();
  const objectKey = requiredString(objectKeyValue, "对象键", 1_024);
  assertMaterialObjectKey(config, objectKey);
  const url = await presign(config, "DELETE", objectKey, 600);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "DELETE",
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new MaterialsServiceError("TOS 素材删除请求未能发送，请稍后重试。");
  }
  if (response.status >= 300 && response.status < 400) {
    throw new MaterialsServiceError("TOS 素材删除发生重定向，已阻止继续请求。");
  }
  if (!response.ok && response.status !== 404) {
    throw await tosResponseError(response, "TOS 素材删除失败");
  }
}

export function materialLimit(kind: MaterialKind): number {
  return MAX_BYTES[kind];
}

async function fetchRemoteBody(
  rawUrl: string,
  kind: "video" | "image",
): Promise<{
  body: Uint8Array | ReadableStream<Uint8Array>;
  contentType: string;
  size: number;
  counter?: ByteCounter;
}> {
  let current = safeRemoteUrl(rawUrl);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === 3) {
        throw new MaterialsValidationError("生成结果重定向次数过多或地址无效。");
      }
      current = safeRemoteUrl(new URL(location, current).href);
      continue;
    }
    if (!response.ok || !response.body) {
      throw new MaterialsServiceError(
        `读取生成结果失败（HTTP ${response.status}）。`,
      );
    }
    const contentType = normalizedContentType(
      response.headers.get("content-type") ?? "",
    );
    extensionFor(kind, contentType);
    const size = optionalContentLength(response.headers.get("content-length")) ?? 0;
    if (size > MAX_BYTES[kind]) {
      throw new MaterialsValidationError(sizeMessage(kind));
    }
    const inspected = await validatedMimeStream(
      response.body,
      kind,
      contentType,
    );
    const counter: ByteCounter = { value: 0 };
    const body =
      kind === "image"
        ? await readLimitedBytes(inspected, MAX_BYTES[kind], kind)
        : limitStream(inspected, MAX_BYTES[kind], kind, counter);
    return {
      body,
      contentType,
      size: size || (body instanceof Uint8Array ? body.byteLength : 0),
      counter,
    };
  }
  throw new MaterialsValidationError("无法读取生成结果。");
}

function dataUrlBody(
  value: string,
  kind: "video" | "image",
): { body: Uint8Array; contentType: string; size: number; counter?: ByteCounter } {
  if (kind !== "image") {
    throw new MaterialsValidationError("视频生成结果必须使用 HTTPS URL。");
  }
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value);
  if (!match) {
    throw new MaterialsValidationError("Base64 图片格式不正确。");
  }
  const contentType = normalizedContentType(match[1]);
  extensionFor("image", contentType);
  const compact = match[2].replaceAll(/\s/g, "");
  const approximateSize = Math.floor((compact.length * 3) / 4);
  if (approximateSize > MAX_BYTES.image) {
    throw new MaterialsValidationError(sizeMessage("image"));
  }
  let binary: string;
  try {
    binary = atob(compact);
  } catch {
    throw new MaterialsValidationError("Base64 图片无法解码。");
  }
  const body = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  assertMimeSignature("image", contentType, body);
  return { body, contentType, size: body.byteLength };
}

async function putObject(
  config: TosConfig,
  objectKey: string,
  body: BodyInit,
  contentType: string,
) {
  assertObjectKey(config, objectKey);
  const url = await presign(config, "PUT", objectKey, 600, {
    // TOS pre-signing authenticates host and the unsigned payload marker.
    // Content-Type is still sent with the PUT so the object remains previewable.
  });
  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: { "content-type": contentType },
      body,
      // Cloudflare Workers does not implement redirect: "error". Manual mode
      // preserves the same fail-closed behavior without throwing before the
      // request can be sent.
      redirect: "manual",
      signal: AbortSignal.timeout(300_000),
    });
  } catch {
    throw new MaterialsServiceError(
      "TOS 上传请求未能发送，请稍后重试或联系管理员检查运行环境网络。",
    );
  }
  if (response.status >= 300 && response.status < 400) {
    throw new MaterialsServiceError("TOS 上传发生重定向，已阻止继续请求。");
  }
  if (!response.ok) {
    const requestId = response.headers.get("x-tos-request-id");
    throw new MaterialsServiceError(
      `TOS 上传失败（HTTP ${response.status}${requestId ? `，Request ID ${requestId}` : ""}）。`,
    );
  }
}

async function presign(
  config: TosConfig,
  method: "GET" | "HEAD" | "PUT" | "DELETE",
  objectKey: string,
  expires: number,
  signedHeaderValues: Record<string, string> = {},
  operationQuery: Record<string, string> = {},
): Promise<string> {
  const now = new Date();
  const requestDate = amzDate(now);
  const shortDate = requestDate.slice(0, 8);
  const scope = `${shortDate}/${config.region}/tos/request`;
  const url = new URL(config.endpoint.href);
  url.pathname = canonicalUri(objectKey);
  const headers = {
    host: url.host,
    ...Object.fromEntries(
      Object.entries(signedHeaderValues).map(([key, value]) => [
        key.toLowerCase(),
        value.trim().replaceAll(/\s+/g, " "),
      ]),
    ),
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const query: Record<string, string> = {
    ...operationQuery,
    "X-Tos-Algorithm": "TOS4-HMAC-SHA256",
    "X-Tos-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Tos-Credential": `${config.accessKey}/${scope}`,
    "X-Tos-Date": requestDate,
    "X-Tos-Expires": String(expires),
    "X-Tos-SignedHeaders": signedHeaders,
  };
  const canonicalQuery = canonicalQueryString(query);
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key as keyof typeof headers]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "TOS4-HMAC-SHA256",
    requestDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const dateKey = await hmac(config.secretKey, shortDate);
  const regionKey = await hmac(dateKey, config.region);
  const serviceKey = await hmac(regionKey, "tos");
  const signingKey = await hmac(serviceKey, "request");
  query["X-Tos-Signature"] = bytesToHex(await hmac(signingKey, stringToSign));
  url.search = canonicalQueryString(query);
  return url.href;
}

async function signedRequest(
  config: TosConfig,
  method: "GET",
  objectKey: string,
  operationQuery: Record<string, string> = {},
): Promise<{ url: string; headers: Headers }> {
  const now = new Date();
  const requestDate = amzDate(now);
  const shortDate = requestDate.slice(0, 8);
  const scope = `${shortDate}/${config.region}/tos/request`;
  const url = new URL(config.endpoint.href);
  url.pathname = canonicalUri(objectKey);
  url.search = canonicalQueryString(operationQuery);
  const payloadHash = await sha256Hex("");
  const signedHeaderValues: Record<string, string> = {
    host: url.host,
    "x-tos-content-sha256": payloadHash,
    "x-tos-date": requestDate,
  };
  const signedHeaders = Object.keys(signedHeaderValues).sort().join(";");
  const canonicalHeaders = Object.keys(signedHeaderValues)
    .sort()
    .map((key) => `${key}:${signedHeaderValues[key]}\n`)
    .join("");
  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQueryString(operationQuery),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const stringToSign = [
    "TOS4-HMAC-SHA256",
    requestDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");
  const dateKey = await hmac(config.secretKey, shortDate);
  const regionKey = await hmac(dateKey, config.region);
  const serviceKey = await hmac(regionKey, "tos");
  const signingKey = await hmac(serviceKey, "request");
  const signature = bytesToHex(await hmac(signingKey, stringToSign));
  return {
    url: url.href,
    headers: new Headers({
      authorization: `TOS4-HMAC-SHA256 Credential=${config.accessKey}/${scope},SignedHeaders=${signedHeaders},Signature=${signature}`,
      "x-tos-content-sha256": payloadHash,
      "x-tos-date": requestDate,
    }),
  };
}

function tosConfig(): TosConfig {
  const accessKey = process.env.VOLC_ACCESS_KEY?.trim();
  const secretKey = process.env.VOLC_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) {
    throw new MaterialsServiceError("TOS 服务端凭证未配置。");
  }
  const bucket = (process.env.TOS_BUCKET ?? "hh-tos-test").trim();
  const region = (process.env.TOS_REGION ?? "cn-beijing").trim();
  const endpointRaw = (
    process.env.TOS_ENDPOINT ??
    "https://hh-tos-test.tos-cn-beijing.volces.com"
  ).trim();
  const prefixRaw = (process.env.TOS_PREFIX ?? "demo/").trim();
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new MaterialsServiceError("TOS bucket 配置不正确。");
  }
  if (!/^[a-z0-9-]+$/.test(region)) {
    throw new MaterialsServiceError("TOS Region 配置不正确。");
  }
  const endpoint = new URL(
    endpointRaw.startsWith("https://") ? endpointRaw : `https://${endpointRaw}`,
  );
  if (
    endpoint.protocol !== "https:" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.pathname !== "/" ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new MaterialsServiceError("TOS Endpoint 必须是无路径的 HTTPS 地址。");
  }
  if (!endpoint.hostname.startsWith(`${bucket}.`)) {
    throw new MaterialsServiceError("TOS Endpoint 与 bucket 不匹配。");
  }
  const prefix = prefixRaw.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
  if (prefix !== "demo/") {
    throw new MaterialsServiceError("TOS 前缀固定为 demo/。");
  }
  return { accessKey, secretKey, bucket, endpoint, region, prefix };
}

function materialAsset(input: Omit<MaterialAsset, "createdAt">): MaterialAsset {
  return { ...input, createdAt: new Date().toISOString() };
}

async function recoveredMaterialAsset(
  config: TosConfig,
  object: ListedTosObject,
): Promise<MaterialAsset | null> {
  let kind: MaterialKind | undefined;
  for (const candidate of ["video", "image", "audio"] as const) {
    if (object.key.startsWith(`${config.prefix}${candidate}/`)) {
      kind = candidate;
      break;
    }
  }
  if (!kind || object.key.endsWith("/")) return null;
  try {
    assertMaterialObjectKey(config, object.key);
  } catch {
    return null;
  }
  const filename = object.key.split("/").at(-1) ?? "";
  const extension = filename.split(".").at(-1)?.toLowerCase() ?? "";
  const contentType = contentTypeForExtension(kind, extension);
  if (!contentType) return null;
  const generated = object.key.includes(`/${kind}/generated/`);
  const manualMatch = /^([0-9a-f]{8}-[0-9a-f-]{27})-(.+)$/i.exec(filename);
  const generatedDigest = /^([a-f0-9]{64})\.[a-z0-9]+$/i.exec(filename)?.[1];
  const id = generatedDigest
    ? `generated-${generatedDigest.slice(0, 24)}`
    : manualMatch
      ? `manual-${manualMatch[1]}`
      : `recovered-${(await sha256Hex(object.key)).slice(0, 24)}`;
  const createdAt = validIsoDate(object.lastModified);
  const source = generated
    ? kind === "video"
      ? "seedance"
      : kind === "image"
        ? "seedream"
        : "manual"
    : "manual";
  return {
    id,
    kind,
    objectKey: object.key,
    name:
      manualMatch?.[2] ??
      `${source === "seedance" ? "Seedance" : source === "seedream" ? "Seedream" : "TOS"} ${kindLabel(kind)}素材 · ${createdAt.slice(0, 10)}.${extension}`,
    contentType,
    size: object.size,
    createdAt,
    source,
    sourceRef: `recovered:${object.key}`,
  };
}

function parseListObjectsResponse(value: string): {
  objects: ListedTosObject[];
  isTruncated: boolean;
  nextContinuationToken: string;
} {
  if (value.trimStart().startsWith("{")) {
    return parseListObjectsJson(value);
  }
  const objects = [...value.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)].map(
    (match) => ({
      key: xmlValue(match[1], "Key"),
      lastModified: xmlValue(match[1], "LastModified"),
      size: Number(xmlValue(match[1], "Size")),
    }),
  );
  if (
    objects.some(
      (object) =>
        !object.key || !Number.isSafeInteger(object.size) || object.size < 0,
    )
  ) {
    throw new MaterialsServiceError("TOS 素材目录响应格式不正确。");
  }
  return {
    objects,
    isTruncated: xmlValue(value, "IsTruncated") === "true",
    nextContinuationToken: xmlValue(value, "NextContinuationToken"),
  };
}

function parseListObjectsJson(value: string): {
  objects: ListedTosObject[];
  isTruncated: boolean;
  nextContinuationToken: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new MaterialsServiceError("TOS 素材目录响应格式不正确。");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new MaterialsServiceError("TOS 素材目录响应格式不正确。");
  }
  const root = parsed as Record<string, unknown>;
  const contents = root.Contents ?? root.contents ?? [];
  if (!Array.isArray(contents)) {
    throw new MaterialsServiceError("TOS 素材目录响应格式不正确。");
  }
  const objects = contents.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new MaterialsServiceError("TOS 素材目录响应格式不正确。");
    }
    const object = item as Record<string, unknown>;
    const key = object.Key ?? object.key;
    const lastModified = object.LastModified ?? object.lastModified;
    const size = object.Size ?? object.size;
    if (
      typeof key !== "string" ||
      typeof lastModified !== "string" ||
      !Number.isSafeInteger(size) ||
      Number(size) < 0
    ) {
      throw new MaterialsServiceError("TOS 素材目录响应格式不正确。");
    }
    return { key, lastModified, size: Number(size) };
  });
  const isTruncated = root.IsTruncated ?? root.isTruncated;
  const nextToken =
    root.NextContinuationToken ?? root.nextContinuationToken ?? "";
  return {
    objects,
    isTruncated: isTruncated === true || isTruncated === "true",
    nextContinuationToken:
      typeof nextToken === "string" ? nextToken : "",
  };
}

function xmlValue(value: string, tag: string): string {
  const match = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(value);
  return match ? decodeXml(match[1].trim()) : "";
}

function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function contentTypeForExtension(
  kind: MaterialKind,
  extension: string,
): string | undefined {
  return Object.entries(MIME_EXTENSIONS[kind]).find(
    ([, candidate]) => candidate === extension,
  )?.[0];
}

function validIsoDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function tosResponseError(
  response: Response,
  label: string,
): Promise<MaterialsServiceError> {
  const requestId = response.headers.get("x-tos-request-id");
  let errorCode = "";
  try {
    const body = await response.text();
    if (body.trimStart().startsWith("{")) {
      const parsed = JSON.parse(body) as { Code?: unknown; code?: unknown };
      const code = parsed.Code ?? parsed.code;
      errorCode = typeof code === "string" ? code : "";
    } else {
      errorCode = xmlValue(body, "Code");
    }
  } catch {
    // The status and request ID are still enough to correlate the TOS failure.
  }
  return new MaterialsServiceError(
    `${label}（HTTP ${response.status}${errorCode ? `，${errorCode}` : ""}${requestId ? `，Request ID ${requestId}` : ""}）。`,
  );
}

function materialKind(value: string | null): MaterialKind {
  if (value !== "video" && value !== "image" && value !== "audio") {
    throw new MaterialsValidationError("素材类型只支持视频、图片或音频。");
  }
  return value;
}

function extensionFor(kind: MaterialKind, contentType: string): string {
  const extension = MIME_EXTENSIONS[kind][contentType];
  if (!extension) {
    throw new MaterialsValidationError(`文件 MIME 与${kindLabel(kind)}类型不匹配。`);
  }
  return extension;
}

function normalizedContentType(value: string): string {
  return value.split(";", 1)[0].trim().toLowerCase();
}

function safeFilename(value: string): string {
  const normalized = value.normalize("NFKC").replaceAll(/[\\/\0\r\n]/g, "-");
  const safe = normalized
    .replaceAll(/[^\p{L}\p{N}._ -]+/gu, "-")
    .replaceAll(/\.{2,}/g, ".")
    .replaceAll(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "");
  if (!safe || safe === ".") {
    throw new MaterialsValidationError("文件名不正确。");
  }
  return safe.slice(0, 160);
}

function ensureExtension(name: string, extension: string): string {
  return name.toLowerCase().endsWith(`.${extension}`)
    ? name
    : `${name.replace(/\.[^.]+$/, "")}.${extension}`;
}

function sizeMessage(kind: MaterialKind): string {
  return `${kindLabel(kind)}文件不能超过 ${MAX_BYTES[kind] / 1024 / 1024} MB。`;
}

function kindLabel(kind: MaterialKind): string {
  return { video: "视频", image: "图片", audio: "音频" }[kind];
}

function optionalContentLength(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new MaterialsValidationError("Content-Length 不正确。");
  }
  return parsed;
}

function limitStream(
  source: ReadableStream<Uint8Array>,
  maximum: number,
  kind: MaterialKind,
  counter?: ByteCounter,
): ReadableStream<Uint8Array> {
  let received = 0;
  return source.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (counter) counter.value = received;
        if (received > maximum) {
          controller.error(new MaterialsValidationError(sizeMessage(kind)));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
}

async function validatedMimeStream(
  source: ReadableStream<Uint8Array>,
  kind: MaterialKind,
  contentType: string,
): Promise<ReadableStream<Uint8Array>> {
  const [inspection, upload] = source.tee();
  const reader = inspection.getReader();
  const buffered: Uint8Array[] = [];
  let bufferedBytes = 0;
  while (bufferedBytes < 32) {
    const item = await reader.read();
    if (item.done) {
      break;
    }
    buffered.push(item.value);
    bufferedBytes += item.value.byteLength;
  }
  void reader.cancel();
  const prefix = new Uint8Array(Math.min(bufferedBytes, 32));
  let offset = 0;
  for (const chunk of buffered) {
    const remaining = prefix.byteLength - offset;
    if (remaining <= 0) break;
    const slice = chunk.subarray(0, remaining);
    prefix.set(slice, offset);
    offset += slice.byteLength;
  }
  try {
    assertMimeSignature(kind, contentType, prefix);
  } catch (error) {
    void upload.cancel(error);
    throw error;
  }
  return upload;
}

async function readLimitedBytes(
  source: ReadableStream<Uint8Array>,
  maximum: number,
  kind: MaterialKind,
): Promise<Uint8Array> {
  const reader = source.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const item = await reader.read();
    if (item.done) break;
    size += item.value.byteLength;
    if (size > maximum) {
      await reader.cancel();
      throw new MaterialsValidationError(sizeMessage(kind));
    }
    chunks.push(item.value);
  }
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function assertMimeSignature(
  kind: MaterialKind,
  contentType: string,
  bytes: Uint8Array,
) {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  const matches =
    (contentType === "image/jpeg" &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (contentType === "image/png" &&
      bytes[0] === 0x89 &&
      ascii(1, 4) === "PNG") ||
    (contentType === "image/webp" &&
      ascii(0, 4) === "RIFF" &&
      ascii(8, 12) === "WEBP") ||
    (contentType === "image/gif" &&
      (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a")) ||
    ((contentType === "video/mp4" ||
      contentType === "video/quicktime" ||
      contentType === "audio/mp4") &&
      ascii(4, 8) === "ftyp") ||
    (contentType === "video/webm" &&
      bytes[0] === 0x1a &&
      bytes[1] === 0x45 &&
      bytes[2] === 0xdf &&
      bytes[3] === 0xa3) ||
    (contentType === "audio/mpeg" &&
      (ascii(0, 3) === "ID3" ||
        (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) ||
    ((contentType === "audio/wav" || contentType === "audio/x-wav") &&
      ascii(0, 4) === "RIFF" &&
      ascii(8, 12) === "WAVE") ||
    (contentType === "audio/aac" &&
      bytes[0] === 0xff &&
      (bytes[1] & 0xf6) === 0xf0) ||
    (contentType === "audio/ogg" && ascii(0, 4) === "OggS") ||
    (contentType === "audio/flac" && ascii(0, 4) === "fLaC");
  if (!matches) {
    throw new MaterialsValidationError(
      `文件内容与声明的${kindLabel(kind)} MIME 不匹配。`,
    );
  }
}

function safeRemoteUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new MaterialsValidationError("生成结果不是有效 URL。");
  }
  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    hostname === "localhost" ||
    hostname === "::1" ||
    hostname.endsWith(".local") ||
    /^(127|10|0)\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^\[?(fc|fd|fe80):/i.test(hostname)
  ) {
    throw new MaterialsValidationError("生成结果必须是公网 HTTPS URL。");
  }
  return url;
}

function assertObjectKey(config: TosConfig, objectKey: string) {
  if (
    !objectKey.startsWith(config.prefix) ||
    objectKey.includes("..") ||
    objectKey.includes("\\") ||
    objectKey.startsWith("/") ||
    /[\r\n\0]/.test(objectKey)
  ) {
    throw new MaterialsValidationError("对象键不在允许的 demo/ 路径内。");
  }
}

function assertMaterialObjectKey(config: TosConfig, objectKey: string) {
  assertObjectKey(config, objectKey);
  if (!/^demo\/(?:video|image|audio)\/(?:generated|uploads)\//.test(objectKey)) {
    throw new MaterialsValidationError("对象键不属于可管理的素材路径。");
  }
}

function canonicalUri(objectKey: string): string {
  return `/${objectKey.split("/").map(rfc3986).join("/")}`;
}

function canonicalQueryString(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => [rfc3986(key), rfc3986(value)] as const)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function rfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function amzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

async function sha256Hex(value: string): Promise<string> {
  return bytesToHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

async function hmac(
  key: string | ArrayBuffer | Uint8Array,
  value: string,
): Promise<ArrayBuffer> {
  const keyBytes = typeof key === "string" ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
}

function bytesToHex(value: ArrayBuffer): string {
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function exactRecord(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new MaterialsValidationError("请求格式不正确。");
  }
  const record = value as Record<string, unknown>;
  const unsupported = Object.keys(record).find((key) => !allowed.includes(key));
  if (unsupported) {
    throw new MaterialsValidationError(`请求包含未开放字段：${unsupported}。`);
  }
  return record;
}

function requiredString(
  value: unknown,
  label: string,
  maximum: number,
): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new MaterialsValidationError(`${label}不能为空。`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maximum) {
    throw new MaterialsValidationError(`${label}长度超过限制。`);
  }
  return trimmed;
}
