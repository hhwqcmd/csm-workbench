export type CurlRequest = {
  method: string;
  url: string;
  headers?: Readonly<Record<string, string>>;
  body?: unknown;
};

export function buildCurlCommand({
  method,
  url,
  headers = {},
  body,
}: CurlRequest): string {
  const normalizedMethod = method.trim().toUpperCase();
  const normalizedUrl = url.trim();
  if (!normalizedMethod) throw new Error("cURL 请求缺少 Method。");
  if (!normalizedUrl) throw new Error("cURL 请求缺少 URL。");

  const parts = [
    "curl --fail-with-body --silent --show-error",
    `--request ${normalizedMethod}`,
    `--url ${shellQuote(normalizedUrl)}`,
    ...Object.entries(headers).map(([name, value]) =>
      `--header ${shellQuote(`${name}: ${value}`)}`,
    ),
  ];

  if (body !== undefined) {
    const serializedBody =
      typeof body === "string" ? body : JSON.stringify(body);
    if (serializedBody === undefined) {
      throw new Error("cURL Request Body 无法序列化。");
    }
    parts.push(`--data-raw ${shellQuote(serializedBody)}`);
  }

  return parts.join(" ");
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`;
}
