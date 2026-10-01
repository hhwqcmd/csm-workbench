// Browser-local SVG → PNG rasterizer for the Pelican Test vision judge.
// Purely client-side: this module touches DOM/canvas APIs and must never be
// imported from a server-only module. It performs ZERO network calls — the PNG
// is produced in-browser and handed to the judge as a data: URL.
//
// Safety: loading the SVG through an <img> element puts it in the browser's
// "secure static mode", so scripts and external resources inside the SVG are
// neither executed nor fetched. The interactive preview is handled separately by
// a sandboxed iframe in the panel.

const LOAD_TIMEOUT_MS = 10_000;
const DEFAULT_EDGE = 1024;
const FALLBACK_EDGE = 512;
// responses-server assertJsonShape rejects any single string > 1MB, so keep the
// PNG data URL comfortably under that cap before it is sent to the judge.
const DATA_URL_LIMIT = 900 * 1024;

export type PelicanRenderSuccess = {
  ok: true;
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
};

export type PelicanRenderFailure = {
  ok: false;
  error: string;
};

export type PelicanRenderResult = PelicanRenderSuccess | PelicanRenderFailure;

// Rasterize an SVG to a PNG data URL, capping the longest edge at `maxEdge`.
// If the result exceeds the 900KB guard, retry once at 512px; if it is still
// too large, return a structured error telling the user to switch to the source
// judge. Never throws — always resolves to a discriminated result.
export async function renderSvgToPng(
  svg: string,
  maxEdge: number = DEFAULT_EDGE,
): Promise<PelicanRenderResult> {
  const first = await rasterize(svg, maxEdge);
  if (!first.ok) return first;
  if (first.dataUrl.length <= DATA_URL_LIMIT) return first;

  const retry = await rasterize(svg, FALLBACK_EDGE);
  if (!retry.ok) return retry;
  if (retry.dataUrl.length <= DATA_URL_LIMIT) return retry;

  return {
    ok: false,
    error:
      "栅格化后的 PNG 体积仍超过 900KB 上限，无法安全送评，请改用『源码裁判』模式。",
  };
}

async function rasterize(
  svg: string,
  maxEdge: number,
): Promise<PelicanRenderResult> {
  if (typeof svg !== "string" || !svg.trim()) {
    return { ok: false, error: "没有可渲染的 SVG 内容。" };
  }
  if (typeof document === "undefined" || typeof window === "undefined") {
    return { ok: false, error: "当前环境不支持浏览器本地栅格化。" };
  }

  const size = resolveSize(svg, maxEdge);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl, size);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return { ok: false, error: "当前浏览器无法创建 2D 画布，栅格化失败。" };
    }
    // Paint a white background so transparent SVGs stay legible to the judge.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(image, 0, 0, size.width, size.height);

    const dataUrl = canvas.toDataURL("image/png");
    if (!dataUrl.startsWith("data:image/png")) {
      return { ok: false, error: "栅格化未生成有效的 PNG 数据。" };
    }
    return {
      ok: true,
      dataUrl,
      width: size.width,
      height: size.height,
      bytes: base64Bytes(dataUrl),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SVG 栅格化失败。",
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(
  objectUrl: string,
  size: { width: number; height: number },
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "sync";
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      image.src = "";
      reject(new Error("SVG 图片加载超时（10 秒），无法栅格化。"));
    }, LOAD_TIMEOUT_MS);
    image.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(
        new Error("SVG 无法被浏览器渲染为图片，可能包含不支持的特性或语法错误。"),
      );
    };
    image.width = size.width;
    image.height = size.height;
    image.src = objectUrl;
  });
}

// Derive the intrinsic size from width/height attributes or viewBox, then cap
// the longest edge at maxEdge. Falls back to a maxEdge square when unknown.
function resolveSize(
  svg: string,
  maxEdge: number,
): { width: number; height: number } {
  let intrinsicWidth = matchNumber(svg, /\swidth\s*=\s*"([^"]+)"/i);
  let intrinsicHeight = matchNumber(svg, /\sheight\s*=\s*"([^"]+)"/i);
  const viewBox = svg.match(
    /\sviewBox\s*=\s*"\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([-\d.]+)[ ,]+([-\d.]+)\s*"/i,
  );
  if (viewBox) {
    const vbWidth = Number.parseFloat(viewBox[1]);
    const vbHeight = Number.parseFloat(viewBox[2]);
    if (intrinsicWidth <= 0 && vbWidth > 0) intrinsicWidth = vbWidth;
    if (intrinsicHeight <= 0 && vbHeight > 0) intrinsicHeight = vbHeight;
  }

  if (intrinsicWidth > 0 && intrinsicHeight > 0) {
    return scaleToFit(intrinsicWidth, intrinsicHeight, maxEdge);
  }
  if (intrinsicWidth > 0) {
    return scaleToFit(intrinsicWidth, intrinsicWidth, maxEdge);
  }
  if (intrinsicHeight > 0) {
    return scaleToFit(intrinsicHeight, intrinsicHeight, maxEdge);
  }
  return { width: maxEdge, height: maxEdge };
}

function matchNumber(svg: string, pattern: RegExp): number {
  const match = svg.match(pattern);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function scaleToFit(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  const ratio = longest > maxEdge ? maxEdge / longest : 1;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function base64Bytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) return 0;
  const base64 = dataUrl.slice(comma + 1);
  const padding = (base64.match(/=+$/) ?? [""])[0].length;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}
