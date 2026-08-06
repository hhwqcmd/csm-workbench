export type MaterialKind = "video" | "image" | "audio";

export type MaterialSource = "seedance" | "seedream" | "manual";

export type MaterialAsset = {
  id: string;
  kind: MaterialKind;
  objectKey: string;
  name: string;
  contentType: string;
  size: number;
  createdAt: string;
  source: MaterialSource;
  sourceRef: string;
};

export type MaterialSaveState = "idle" | "saving" | "saved" | "failed";

export const MATERIAL_STORAGE_KEY = "template-material-library:v1";
export const MATERIAL_LIBRARY_EVENT = "materials:library-changed";
export const MATERIAL_LIBRARY_OPEN_EVENT = "materials:open-library";

const MAX_LOCAL_ASSETS = 500;

export function readMaterialAssets(): MaterialAsset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MATERIAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMaterialAsset).slice(0, MAX_LOCAL_ASSETS);
  } catch {
    return [];
  }
}

export function storeMaterialAsset(asset: MaterialAsset): MaterialAsset[] {
  const current = readMaterialAssets();
  const next = [
    asset,
    ...current.filter(
      (item) =>
        item.id !== asset.id &&
        !(item.kind === asset.kind && item.sourceRef === asset.sourceRef),
    ),
  ].slice(0, MAX_LOCAL_ASSETS);
  return replaceMaterialCache(next);
}

export async function loadMaterialAssets(): Promise<{
  assets: MaterialAsset[];
  warning?: string;
}> {
  const cached = readMaterialAssets();
  let restoreWarning = "";
  if (cached.length) {
    try {
      const restoreResponse = await fetch("/api/materials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ assets: cached }),
      });
      const restorePayload = (await restoreResponse.json()) as {
        error?: string;
      };
      if (!restoreResponse.ok) {
        restoreWarning =
          restorePayload.error ?? "本机素材暂时无法写入持久索引。";
      }
    } catch {
      restoreWarning = "本机素材暂时无法写入持久索引。";
    }
  }

  const response = await fetch("/api/materials", { cache: "no-store" });
  const payload = (await response.json()) as {
    assets?: MaterialAsset[];
    warning?: string;
    error?: string;
  };
  if (!response.ok || !Array.isArray(payload.assets)) {
    if (cached.length) {
      const warning = [restoreWarning, payload.error ?? "读取持久素材索引失败。"]
        .filter(Boolean)
        .join(" ");
      return { assets: cached, warning };
    }
    throw new Error(payload.error ?? "读取素材库失败。");
  }
  const indexed = payload.assets.filter(isMaterialAsset);
  const assets = payload.warning
    ? mergeMaterialAssets(indexed, cached)
    : indexed;
  replaceMaterialCache(assets);
  const warning = [restoreWarning, payload.warning].filter(Boolean).join(" ");
  return { assets, ...(warning ? { warning } : {}) };
}

export async function renameMaterialAsset(
  id: string,
  name: string,
): Promise<MaterialAsset> {
  const nextName = name.trim();
  if (!nextName) {
    throw new Error("素材名称不能为空。");
  }
  if (nextName.length > 180) {
    throw new Error("素材名称不能超过 180 个字符。");
  }

  const response = await fetch("/api/materials", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ id, name: nextName }),
  });
  const payload = (await response.json()) as MaterialAsset & { error?: string };
  if (!response.ok || !isMaterialAsset(payload)) {
    throw new Error(payload.error ?? "无法保存新名称。");
  }
  storeMaterialAsset(payload);
  return payload;
}

export async function deleteMaterialAsset(id: string): Promise<void> {
  const response = await fetch("/api/materials", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ id, confirmed: true }),
  });
  const payload = (await response.json()) as {
    id?: string;
    deleted?: boolean;
    error?: string;
  };
  if (!response.ok || !payload.deleted) {
    throw new Error(payload.error ?? "删除素材失败。");
  }
  replaceMaterialCache(readMaterialAssets().filter((asset) => asset.id !== id));
}

export function materialPreviewUrl(objectKey: string): string {
  return `/api/materials/object?key=${encodeURIComponent(objectKey)}`;
}

export async function materialTosUrl(objectKey: string): Promise<string> {
  const response = await fetch(
    `${materialPreviewUrl(objectKey)}&response=json`,
    { cache: "no-store" },
  );
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "获取 TOS URL 失败。");
  }
  return payload.url;
}

function replaceMaterialCache(assets: MaterialAsset[]): MaterialAsset[] {
  const next = assets.slice(0, MAX_LOCAL_ASSETS);
  try {
    window.localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The server index remains canonical if this optional cache is unavailable.
  }
  window.dispatchEvent(new CustomEvent(MATERIAL_LIBRARY_EVENT));
  return next;
}

function mergeMaterialAssets(
  primary: MaterialAsset[],
  fallback: MaterialAsset[],
): MaterialAsset[] {
  const seen = new Set<string>();
  return [...primary, ...fallback]
    .filter((asset) => {
      if (seen.has(asset.objectKey)) return false;
      seen.add(asset.objectKey);
      return true;
    })
    .slice(0, MAX_LOCAL_ASSETS);
}

export function hasSavedMaterial(
  assets: MaterialAsset[],
  kind: MaterialKind,
  sourceRef: string,
): boolean {
  return assets.some(
    (asset) => asset.kind === kind && asset.sourceRef === sourceRef,
  );
}

export async function importGeneratedMaterial(input: {
  kind: "video" | "image";
  source: "seedance" | "seedream";
  sourceRef: string;
  sourceValue: string;
  name: string;
}): Promise<MaterialAsset> {
  const response = await fetch("/api/materials/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(input),
  });
  const payload = (await response.json()) as MaterialAsset & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "保存到素材库失败。");
  }
  storeMaterialAsset(payload);
  return payload;
}

export async function uploadManualMaterial(
  kind: MaterialKind,
  file: File,
): Promise<MaterialAsset> {
  const response = await fetch(
    `/api/materials/upload?kind=${encodeURIComponent(kind)}&name=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      headers: { "content-type": file.type || "application/octet-stream" },
      cache: "no-store",
      body: file,
    },
  );
  const payload = (await response.json()) as MaterialAsset & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "上传素材失败。");
  }
  storeMaterialAsset(payload);
  return payload;
}

export function openMaterialLibrary(kind: MaterialKind) {
  window.dispatchEvent(
    new CustomEvent<MaterialKind>(MATERIAL_LIBRARY_OPEN_EVENT, {
      detail: kind,
    }),
  );
}

function isMaterialAsset(value: unknown): value is MaterialAsset {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const asset = value as Partial<MaterialAsset>;
  return (
    typeof asset.id === "string" &&
    (asset.kind === "video" ||
      asset.kind === "image" ||
      asset.kind === "audio") &&
    typeof asset.objectKey === "string" &&
    typeof asset.name === "string" &&
    typeof asset.contentType === "string" &&
    typeof asset.size === "number" &&
    Number.isFinite(asset.size) &&
    typeof asset.createdAt === "string" &&
    (asset.source === "seedance" ||
      asset.source === "seedream" ||
      asset.source === "manual") &&
    typeof asset.sourceRef === "string"
  );
}
