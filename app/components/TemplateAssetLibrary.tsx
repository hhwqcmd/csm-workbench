"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MATERIAL_LIBRARY_EVENT,
  MATERIAL_LIBRARY_OPEN_EVENT,
  materialPreviewUrl,
  readMaterialAssets,
  type MaterialAsset,
  type MaterialKind,
  uploadManualMaterial,
} from "../lib/material-assets";
import {
  TEMPLATE_ASSETS,
  TEMPLATE_CATEGORIES,
  TEMPLATE_SOURCE_URL,
  type TemplateAsset,
  type TemplateCategoryId,
} from "../lib/template-assets";
import { navigateWorkspace } from "../lib/workspace-navigation";
import { APPLY_EXAMPLE_EVENT } from "./SeedanceExampleGallery";

type LibrarySection = "templates" | "materials";

const MATERIAL_KINDS: Array<{
  id: MaterialKind;
  label: string;
  accept: string;
  hint: string;
}> = [
  {
    id: "video",
    label: "视频",
    accept: "video/mp4,video/webm,video/quicktime",
    hint: "MP4、WebM 或 MOV，单个文件不超过 200 MB。",
  },
  {
    id: "image",
    label: "图片",
    accept: "image/jpeg,image/png,image/webp,image/gif",
    hint: "JPG、PNG、WebP 或 GIF，单个文件不超过 20 MB。",
  },
  {
    id: "audio",
    label: "音频",
    accept: "audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/flac",
    hint: "MP3、WAV、M4A、AAC、OGG 或 FLAC，单个文件不超过 50 MB。",
  },
];

export function TemplateAssetLibrary() {
  const [section, setSection] = useState<LibrarySection>("templates");
  const [activeCategory, setActiveCategory] =
    useState<TemplateCategoryId>("prompt");
  const [activeMaterialKind, setActiveMaterialKind] =
    useState<MaterialKind>("video");
  const [copiedId, setCopiedId] = useState("");

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TEMPLATE_CATEGORIES.map((category) => [
          category.id,
          TEMPLATE_ASSETS.filter((asset) => asset.category === category.id)
            .length,
        ]),
      ) as Record<TemplateCategoryId, number>,
    [],
  );

  useEffect(() => {
    function openMaterials(event: Event) {
      const kind = (event as CustomEvent<MaterialKind>).detail;
      setSection("materials");
      if (kind === "video" || kind === "image" || kind === "audio") {
        setActiveMaterialKind(kind);
      }
      window.history.replaceState(null, "", `#materials-${kind || "video"}`);
    }

    const initialSync = window.setTimeout(() => {
      if (!window.location.hash.startsWith("#materials")) return;
      const kind = window.location.hash.replace("#materials-", "");
      setSection("materials");
      if (kind === "video" || kind === "image" || kind === "audio") {
        setActiveMaterialKind(kind);
      }
    }, 0);
    window.addEventListener(MATERIAL_LIBRARY_OPEN_EVENT, openMaterials);
    return () => {
      window.clearTimeout(initialSync);
      window.removeEventListener(MATERIAL_LIBRARY_OPEN_EVENT, openMaterials);
    };
  }, []);

  async function copyPrompt(asset: TemplateAsset) {
    await navigator.clipboard.writeText(asset.prompt);
    setCopiedId(asset.id);
    window.setTimeout(() => setCopiedId(""), 1_600);
  }

  function applyTemplate(asset: TemplateAsset) {
    if (!asset.runnableExample) return;
    window.dispatchEvent(
      new CustomEvent(APPLY_EXAMPLE_EVENT, {
        detail: asset.runnableExample,
      }),
    );
    navigateWorkspace("seedance");
  }

  function showTemplates(category?: TemplateCategoryId) {
    setSection("templates");
    if (category) setActiveCategory(category);
    window.history.replaceState(null, "", "#templates");
  }

  function showMaterials(kind: MaterialKind = activeMaterialKind) {
    setSection("materials");
    setActiveMaterialKind(kind);
    window.history.replaceState(null, "", `#materials-${kind}`);
  }

  return (
    <div className="template-library" id="templates">
      <section className="asset-hero">
        <div>
          <p className="eyebrow">TEMPLATE &amp; MATERIAL LIBRARY</p>
          <h1>
            模板与素材
            <br />
            资产库
          </h1>
          <p className="hero-summary">
            模板预填 · 生成结果沉淀 · 视频图片音频预览
          </p>
          <div className="asset-hero-actions">
            <button
              className="primary-action"
              type="button"
              onClick={() => showTemplates("commerce")}
            >
              可运行案例
            </button>
            <button
              className="secondary-action"
              type="button"
              onClick={() => showMaterials("video")}
            >
              打开素材库
            </button>
            <a
              className="secondary-action"
              href={TEMPLATE_SOURCE_URL}
              target="_blank"
              rel="noreferrer"
            >
              官方提示词指南 ↗
            </a>
          </div>
        </div>

        <aside className="asset-index-card" aria-label="模板资产统计">
          <div className="asset-index-topline">
            <span>ASSET INDEX</span>
            <strong>{String(TEMPLATE_ASSETS.length).padStart(2, "0")}</strong>
          </div>
          <div className="asset-index-list">
            {TEMPLATE_CATEGORIES.map((category, index) => (
              <button
                type="button"
                key={category.id}
                onClick={() => showTemplates(category.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{category.label}</strong>
                <em>{counts[category.id]} ITEMS</em>
              </button>
            ))}
            <button type="button" onClick={() => showMaterials("video")}>
              <span>05</span>
              <strong>视频 / 图片 / 音频</strong>
              <em>LOCAL INDEX</em>
            </button>
          </div>
          <p>模板来自仓库；TOS 素材索引只保存在当前浏览器。</p>
        </aside>
      </section>

      <section className="asset-catalog" id="asset-library-catalog">
        <div
          className="asset-library-section-tabs"
          role="tablist"
          aria-label="模板资产库主栏目"
        >
          <button
            aria-selected={section === "templates"}
            className={section === "templates" ? "is-active" : ""}
            data-testid="asset-section-templates"
            onClick={() => showTemplates()}
            role="tab"
            type="button"
          >
            <span>01</span>
            模板分类
          </button>
          <button
            aria-selected={section === "materials"}
            className={section === "materials" ? "is-active" : ""}
            data-testid="asset-section-materials"
            onClick={() => showMaterials()}
            role="tab"
            type="button"
          >
            <span>02</span>
            素材库
          </button>
        </div>

        {section === "templates" ? (
          <TemplateCatalog
            activeCategory={activeCategory}
            copiedId={copiedId}
            counts={counts}
            onApply={applyTemplate}
            onCopy={copyPrompt}
            onSelect={setActiveCategory}
          />
        ) : (
          <MaterialCatalog
            activeKind={activeMaterialKind}
            onSelect={showMaterials}
          />
        )}
      </section>
    </div>
  );
}

function TemplateCatalog({
  activeCategory,
  copiedId,
  counts,
  onApply,
  onCopy,
  onSelect,
}: {
  activeCategory: TemplateCategoryId;
  copiedId: string;
  counts: Record<TemplateCategoryId, number>;
  onApply: (asset: TemplateAsset) => void;
  onCopy: (asset: TemplateAsset) => Promise<void>;
  onSelect: (category: TemplateCategoryId) => void;
}) {
  return (
    <div className="asset-library-panel" role="tabpanel">
      <div className="section-heading asset-heading">
        <div>
          <p className="eyebrow">模板资产库</p>
          <h2>模板分类</h2>
        </div>
        <p>模板可直接预填；缺失素材补齐后方可提交。</p>
      </div>

      <div className="asset-category-tabs" role="tablist" aria-label="模板分类">
        {TEMPLATE_CATEGORIES.map((category) => (
          <button
            aria-selected={activeCategory === category.id}
            className={activeCategory === category.id ? "is-active" : ""}
            data-testid={`template-category-${category.id}`}
            key={category.id}
            onClick={() => onSelect(category.id)}
            role="tab"
            type="button"
          >
            <span>{category.label}</span>
            <small>{counts[category.id]}</small>
          </button>
        ))}
      </div>

      {TEMPLATE_CATEGORIES.map((category) => {
        const assets = TEMPLATE_ASSETS.filter(
          (asset) => asset.category === category.id,
        );
        return (
          <div
            aria-labelledby={`category-${category.id}`}
            className="asset-category-panel"
            hidden={activeCategory !== category.id}
            key={category.id}
            role="tabpanel"
          >
            <div className="asset-category-intro">
              <p>{category.eyebrow}</p>
              <h3 id={`category-${category.id}`}>{category.label}</h3>
              <span>{category.description}</span>
            </div>
            <div className={`asset-card-grid asset-card-grid-${category.id}`}>
              {assets.map((asset, index) => (
                <article
                  className={`asset-card${asset.runnableExample ? " is-runnable" : ""}`}
                  key={asset.id}
                >
                  {asset.previewImageUrl ? (
                    <div
                      aria-label={`${asset.title} 商品素材预览`}
                      className="asset-preview"
                      role="img"
                      style={{
                        backgroundImage: `url("${asset.previewImageUrl}")`,
                      }}
                    >
                      <span>READY TO RUN</span>
                    </div>
                  ) : (
                    <div className="asset-card-code">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{category.eyebrow.slice(0, 2)}</strong>
                    </div>
                  )}
                  <div className="asset-card-body">
                    <div className="asset-source-row">
                      <span>{asset.source}</span>
                      {asset.runnableExample && (
                        <em>{asset.hasMissingMaterials ? "素材待补" : "可运行"}</em>
                      )}
                    </div>
                    <h4>{asset.title}</h4>
                    <p>{asset.summary}</p>
                    <blockquote>{asset.prompt}</blockquote>
                    <div className="asset-tags">
                      {asset.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <div className="asset-input-hint">
                      <span aria-hidden="true">↳</span>
                      {asset.inputHint}
                    </div>
                  </div>
                  <div className="asset-card-actions">
                    <button
                      data-testid={`copy-template-${asset.id}`}
                      onClick={() => void onCopy(asset)}
                      type="button"
                    >
                      {copiedId === asset.id ? "已复制" : "复制提示词"}
                    </button>
                    {asset.runnableExample && (
                      <button
                        className="asset-apply-button"
                        data-testid={`apply-template-${asset.id}`}
                        onClick={() => onApply(asset)}
                        type="button"
                      >
                        填入实操台 <span aria-hidden="true">→</span>
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MaterialCatalog({
  activeKind,
  onSelect,
}: {
  activeKind: MaterialKind;
  onSelect: (kind: MaterialKind) => void;
}) {
  const [assets, setAssets] = useState<MaterialAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const activeConfig = MATERIAL_KINDS.find((item) => item.id === activeKind)!;
  const visibleAssets = assets.filter((asset) => asset.kind === activeKind);

  useEffect(() => {
    function refresh() {
      setAssets(readMaterialAssets());
    }
    refresh();
    window.addEventListener(MATERIAL_LIBRARY_EVENT, refresh);
    return () => window.removeEventListener(MATERIAL_LIBRARY_EVENT, refresh);
  }, []);

  async function upload(file: File | undefined) {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      await uploadManualMaterial(activeKind, file);
      setAssets(readMaterialAssets());
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "上传素材失败。");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="asset-library-panel material-catalog" id="materials" role="tabpanel">
      <div className="section-heading asset-heading">
        <div>
          <p className="eyebrow">TOS MATERIAL LIBRARY</p>
          <h2>素材库</h2>
        </div>
        <p>
          文件保存在私有 TOS；页面索引仅属于当前浏览器，不会跨设备同步。
        </p>
      </div>

      <div className="material-kind-tabs" role="tablist" aria-label="素材类型">
        {MATERIAL_KINDS.map((kind) => (
          <button
            aria-selected={activeKind === kind.id}
            className={activeKind === kind.id ? "is-active" : ""}
            data-testid={`material-kind-${kind.id}`}
            id={`materials-${kind.id}`}
            key={kind.id}
            onClick={() => onSelect(kind.id)}
            role="tab"
            type="button"
          >
            <span>{kind.label}</span>
            <small>{assets.filter((asset) => asset.kind === kind.id).length}</small>
          </button>
        ))}
      </div>

      <div className="material-upload-card">
        <div>
          <span>MANUAL UPLOAD</span>
          <strong>上传{activeConfig.label}素材</strong>
          <p>{activeConfig.hint}</p>
        </div>
        <input
          accept={activeConfig.accept}
          aria-label={`选择${activeConfig.label}素材`}
          disabled={uploading}
          onChange={(event) => void upload(event.target.files?.[0])}
          ref={inputRef}
          type="file"
        />
        <button
          className="primary-action"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? "上传中…" : `选择${activeConfig.label}文件`}
        </button>
      </div>
      {uploadError && <p className="material-error">{uploadError}</p>}

      {visibleAssets.length ? (
        <div className="material-card-grid">
          {visibleAssets.map((asset) => (
            <MaterialCard asset={asset} key={asset.id} />
          ))}
        </div>
      ) : (
        <div className="material-empty" data-testid={`material-empty-${activeKind}`}>
          <strong>暂无{activeConfig.label}素材</strong>
          <p>
            可从生成结果保存，或在上方选择本地{activeConfig.label}文件上传。
          </p>
        </div>
      )}
    </div>
  );
}

function MaterialCard({ asset }: { asset: MaterialAsset }) {
  const preview = materialPreviewUrl(asset.objectKey);
  return (
    <article className="material-card">
      <div className="material-preview">
        {asset.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={asset.name} loading="lazy" src={preview} />
        ) : asset.kind === "video" ? (
          <video controls playsInline preload="metadata" src={preview} />
        ) : (
          <div className="material-audio-preview">
            <span aria-hidden="true">♫</span>
            <audio controls preload="metadata" src={preview} />
          </div>
        )}
      </div>
      <div className="material-card-body">
        <div>
          <span>{sourceLabel(asset.source)}</span>
          <small>{formatBytes(asset.size)}</small>
        </div>
        <h3>{asset.name}</h3>
        <p>{formatDate(asset.createdAt)}</p>
        <a href={preview} target="_blank" rel="noreferrer">
          打开原文件 ↗
        </a>
      </div>
    </article>
  );
}

function sourceLabel(source: MaterialAsset["source"]): string {
  return {
    seedance: "Seedance 生成",
    seedream: "Seedream 生成",
    manual: "手动上传",
  }[source];
}

function formatBytes(value: number): string {
  if (!value) return "大小未知";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("zh-CN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
