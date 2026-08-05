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
  const counter: ByteCounter = { value: 0 };
  const inspected = await validatedMimeStream(request.body, kind, contentType);
  const limited = limitStream(inspected, MAX_BYTES[kind], kind, counter);
  await putObject(config, objectKey, limited, contentType);
  return materialAsset({
    id: `manual-${id}`,
    kind,
    objectKey,
    name,
    contentType,
    size: declaredSize ?? counter.value,
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

export function materialLimit(kind: MaterialKind): number {
  return MAX_BYTES[kind];
}

async function fetchRemoteBody(
  rawUrl: string,
  kind: "video" | "image",
): Promise<{
  body: ReadableStream<Uint8Array>;
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
    const counter: ByteCounter = { value: 0 };
    const inspected = await validatedMimeStream(
      response.body,
      kind,
      contentType,
    );
    return {
      body: limitStream(inspected, MAX_BYTES[kind], kind, counter),
      contentType,
      size,
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
  const response = await fetch(url, {
    method: "PUT",
    headers: { "content-type": contentType },
    body,
    redirect: "error",
    signal: AbortSignal.timeout(300_000),
  });
  if (!response.ok) {
    const requestId = response.headers.get("x-tos-request-id");
    throw new MaterialsServiceError(
      `TOS 上传失败（HTTP ${response.status}${requestId ? `，Request ID ${requestId}` : ""}）。`,
    );
  }
}

async function presign(
  config: TosConfig,
  method: "GET" | "PUT",
  objectKey: string,
  expires: number,
  signedHeaderValues: Record<string, string> = {},
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
  const reader = source.getReader();
  const buffered: Uint8Array[] = [];
  let bufferedBytes = 0;
  let finished = false;
  while (bufferedBytes < 32) {
    const item = await reader.read();
    if (item.done) {
      finished = true;
      break;
    }
    buffered.push(item.value);
    bufferedBytes += item.value.byteLength;
  }
  const prefix = new Uint8Array(Math.min(bufferedBytes, 32));
  let offset = 0;
  for (const chunk of buffered) {
    const remaining = prefix.byteLength - offset;
    if (remaining <= 0) break;
    const slice = chunk.subarray(0, remaining);
    prefix.set(slice, offset);
    offset += slice.byteLength;
  }
  assertMimeSignature(kind, contentType, prefix);
  let bufferedIndex = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (bufferedIndex < buffered.length) {
        controller.enqueue(buffered[bufferedIndex]);
        bufferedIndex += 1;
        return;
      }
      if (finished) {
        controller.close();
        return;
      }
      const item = await reader.read();
      if (item.done) {
        finished = true;
        controller.close();
      } else {
        controller.enqueue(item.value);
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
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
