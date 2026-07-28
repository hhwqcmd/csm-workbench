"use client";

import { useMemo, useState } from "react";
import {
  TEMPLATE_ASSETS,
  TEMPLATE_CATEGORIES,
  TEMPLATE_SOURCE_URL,
  type TemplateAsset,
  type TemplateCategoryId,
} from "../lib/template-assets";
import { navigateWorkspace } from "../lib/workspace-navigation";
import { APPLY_EXAMPLE_EVENT } from "./SeedanceExampleGallery";

export function TemplateAssetLibrary() {
  const [activeCategory, setActiveCategory] =
    useState<TemplateCategoryId>("prompt");
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
    navigateWorkspace("workbench");
  }

  return (
    <div className="template-library" id="templates">
      <section className="asset-hero">
        <div>
          <p className="eyebrow">SEEDANCE TEMPLATE LIBRARY</p>
          <h1>
            把成熟模板，
            <br />
            变成下一条成片。
          </h1>
          <p className="hero-summary">
            从官方提示词指南移植可复用公式与案例，并补齐两条可直接进入实操台的电商宣发模板。复制用于改写，或一键填入完整 API。
          </p>
          <div className="asset-hero-actions">
            <button
              className="primary-action"
              type="button"
              onClick={() => setActiveCategory("commerce")}
            >
              查看可运行案例
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
                onClick={() => setActiveCategory(category.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{category.label}</strong>
                <em>{counts[category.id]} ITEMS</em>
              </button>
            ))}
          </div>
          <p>官方指南最近更新：2026.07.20</p>
        </aside>
      </section>

      <section className="asset-catalog">
        <div className="section-heading asset-heading">
          <div>
            <p className="eyebrow">模板资产库</p>
            <h2>按场景选模板，按需改内容</h2>
          </div>
          <p>
            官方模板保持原始素材指代；“工作台预置案例”已配好模型、公开素材、比例、时长与音频参数。
          </p>
        </div>

        <div className="asset-category-tabs" role="tablist" aria-label="模板分类">
          {TEMPLATE_CATEGORIES.map((category) => (
            <button
              aria-selected={activeCategory === category.id}
              className={activeCategory === category.id ? "is-active" : ""}
              data-testid={`template-category-${category.id}`}
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
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
              <div
                className={`asset-card-grid asset-card-grid-${category.id}`}
              >
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
                        {asset.runnableExample && <em>可运行</em>}
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
                        onClick={() => void copyPrompt(asset)}
                        type="button"
                      >
                        {copiedId === asset.id ? "已复制" : "复制提示词"}
                      </button>
                      {asset.runnableExample && (
                        <button
                          className="asset-apply-button"
                          data-testid={`apply-template-${asset.id}`}
                          onClick={() => applyTemplate(asset)}
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
      </section>
    </div>
  );
}
