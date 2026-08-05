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
  try {
    window.localStorage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(next));
  } catch {
    throw new Error(
      "素材已上传到 TOS，但当前浏览器无法写入本地索引。请检查浏览器存储空间。",
    );
  }
  window.dispatchEvent(new CustomEvent(MATERIAL_LIBRARY_EVENT));
  return next;
}

export function materialPreviewUrl(objectKey: string): string {
  return `/api/materials/object?key=${encodeURIComponent(objectKey)}`;
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
