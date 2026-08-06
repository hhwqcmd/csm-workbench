import "server-only";

import type { MaterialAsset } from "./material-assets";
import {
  deleteTosMaterialObject,
  listTosMaterialAssets,
  MaterialsServiceError,
  MaterialsValidationError,
  verifyCachedMaterialAsset,
} from "./materials-server";

type MaterialAssetRow = {
  id: string;
  kind: MaterialAsset["kind"];
  object_key: string;
  name: string;
  content_type: string;
  size: number;
  created_at: string;
  source: MaterialAsset["source"];
  source_ref: string;
};

export async function upsertMaterialAssetIndex(
  asset: MaterialAsset,
): Promise<void> {
  const database = await databaseBinding();
  await upsertAsset(database, asset);
}

export async function listMaterialCatalog(): Promise<{
  assets: MaterialAsset[];
  warning?: string;
}> {
  const database = await databaseBinding();
  const indexed = await readIndexedAssets(database);
  let inventory: MaterialAsset[];
  try {
    inventory = await listTosMaterialAssets();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "";
    const denied = detail.includes("HTTP 403");
    let warning =
      "TOS 素材目录暂时无法读取，当前展示持久索引与本机缓存中的素材。";
    if (denied) {
      warning =
        "当前 TOS 凭证无法列举素材目录（HTTP 403，通常缺少 tos:ListBucket）。已展示持久索引与本机缓存中的素材，现有素材预览不受影响；补齐权限后可自动发现全部历史对象。";
    } else if (detail) {
      warning = `${detail} 当前展示持久索引与本机缓存中的素材。`;
    }
    return {
      assets: indexed,
      warning,
    };
  }

  const indexedByObjectKey = new Map(
    indexed.map((asset) => [asset.objectKey, asset]),
  );
  const inventoryKeys = new Set(inventory.map((asset) => asset.objectKey));
  for (const recovered of inventory) {
    if (!indexedByObjectKey.has(recovered.objectKey)) {
      await upsertAsset(database, recovered);
    }
  }
  for (const stale of indexed) {
    if (!inventoryKeys.has(stale.objectKey)) {
      const verified = await verifyCachedMaterialAsset(stale);
      if (!verified) {
        await deleteIndexedAsset(database, stale.id);
      } else {
        await upsertAsset(database, verified);
      }
    }
  }
  return { assets: await readIndexedAssets(database) };
}

export async function restoreCachedMaterialIndex(value: unknown): Promise<{
  assets: MaterialAsset[];
  skipped: number;
}> {
  const input = exactRecord(value, ["assets"]);
  if (!Array.isArray(input.assets) || input.assets.length > 500) {
    throw new MaterialsValidationError("本机素材缓存格式不正确。");
  }
  const database = await databaseBinding();
  const indexed = await readIndexedAssets(database);
  const indexedKeys = new Set(indexed.map((asset) => asset.objectKey));
  let skipped = 0;
  for (const candidate of input.assets) {
    const candidateRecord = exactRecord(candidate, [
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
    const objectKey = requiredString(candidateRecord.objectKey, "对象键", 1_024);
    if (indexedKeys.has(objectKey)) continue;
    const verified = await verifyCachedMaterialAsset(candidateRecord);
    if (!verified) {
      skipped += 1;
      continue;
    }
    await upsertAsset(database, verified);
    indexedKeys.add(verified.objectKey);
  }
  return { assets: await readIndexedAssets(database), skipped };
}

export async function renameIndexedMaterial(value: unknown): Promise<MaterialAsset> {
  const input = exactRecord(value, ["id", "name"]);
  const id = requiredString(input.id, "素材 ID", 120);
  const name = requiredString(input.name, "素材名称", 180);
  const database = await databaseBinding();
  const existing = await findIndexedAsset(database, id);
  if (!existing) {
    throw new MaterialsValidationError("素材不存在或已被删除。");
  }
  await database
    .prepare(
      `UPDATE material_assets
       SET name = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(name, Math.floor(Date.now() / 1_000), id)
    .run();
  return { ...existing, name };
}

export async function deleteIndexedMaterial(value: unknown): Promise<{
  id: string;
  deleted: true;
  alreadyMissing?: true;
}> {
  const input = exactRecord(value, ["id", "confirmed"]);
  const id = requiredString(input.id, "素材 ID", 120);
  if (input.confirmed !== true) {
    throw new MaterialsValidationError("删除素材前必须完成不可逆确认。");
  }
  const database = await databaseBinding();
  const existing = await findIndexedAsset(database, id);
  if (!existing) {
    return { id, deleted: true, alreadyMissing: true };
  }
  await deleteTosMaterialObject(existing.objectKey);
  await deleteIndexedAsset(database, id);
  return { id, deleted: true };
}

async function databaseBinding(): Promise<D1Database> {
  const testDatabase = (
    globalThis as typeof globalThis & {
      __WORKBENCH_MATERIAL_TEST_DATABASE__?: D1Database;
    }
  ).__WORKBENCH_MATERIAL_TEST_DATABASE__;
  if (testDatabase) return testDatabase;
  const { env } = await import("cloudflare:workers");
  if (!env.DB) {
    throw new MaterialsServiceError("素材持久索引服务尚未配置。");
  }
  return env.DB;
}

async function upsertAsset(database: D1Database, asset: MaterialAsset) {
  await database
    .prepare(
      `INSERT INTO material_assets
       (id, kind, object_key, name, content_type, size, created_at, source, source_ref, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(object_key) DO UPDATE SET
         id = excluded.id,
         kind = excluded.kind,
         name = excluded.name,
         content_type = excluded.content_type,
         size = excluded.size,
         created_at = excluded.created_at,
         source = excluded.source,
         source_ref = excluded.source_ref,
         updated_at = excluded.updated_at`,
    )
    .bind(
      asset.id,
      asset.kind,
      asset.objectKey,
      asset.name,
      asset.contentType,
      asset.size,
      asset.createdAt,
      asset.source,
      asset.sourceRef,
      Math.floor(Date.now() / 1_000),
    )
    .run();
}

async function readIndexedAssets(database: D1Database): Promise<MaterialAsset[]> {
  const result = await database
    .prepare(
      `SELECT id, kind, object_key, name, content_type, size, created_at, source, source_ref
       FROM material_assets
       ORDER BY created_at DESC, id DESC`,
    )
    .all<MaterialAssetRow>();
  return result.results.map(rowToAsset);
}

async function findIndexedAsset(
  database: D1Database,
  id: string,
): Promise<MaterialAsset | null> {
  const row = await database
    .prepare(
      `SELECT id, kind, object_key, name, content_type, size, created_at, source, source_ref
       FROM material_assets
       WHERE id = ?`,
    )
    .bind(id)
    .first<MaterialAssetRow>();
  return row ? rowToAsset(row) : null;
}

async function deleteIndexedAsset(database: D1Database, id: string) {
  await database
    .prepare("DELETE FROM material_assets WHERE id = ?")
    .bind(id)
    .run();
}

function rowToAsset(row: MaterialAssetRow): MaterialAsset {
  return {
    id: row.id,
    kind: row.kind,
    objectKey: row.object_key,
    name: row.name,
    contentType: row.content_type,
    size: row.size,
    createdAt: row.created_at,
    source: row.source,
    sourceRef: row.source_ref,
  };
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

function requiredString(value: unknown, label: string, maximum: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new MaterialsValidationError(`${label}不能为空。`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maximum) {
    throw new MaterialsValidationError(`${label}长度超过限制。`);
  }
  return trimmed;
}
