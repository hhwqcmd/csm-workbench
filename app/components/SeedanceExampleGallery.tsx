"use client";

import {
  SEEDANCE_EXAMPLES,
  type SeedanceExample,
} from "../lib/seedance-examples";

export const APPLY_EXAMPLE_EVENT = "seedance:apply-example";

export function SeedanceExampleGallery() {
  function applyExample(example: SeedanceExample) {
    window.dispatchEvent(
      new CustomEvent<SeedanceExample>(APPLY_EXAMPLE_EVENT, {
        detail: example,
      }),
    );
    document
      .getElementById("operations")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section className="sample-section" id="sample">
      <div className="section-heading sample-heading">
        <div>
          <p className="eyebrow">官方示例任务</p>
          <h2>八条能力链路，一键填入实操台</h2>
        </div>
        <p>
          参数与素材取自官方教程；点击“填入参数”会同步更新模型、素材、输出规格和完整
          API Request Body，不会自动提交任务。
        </p>
      </div>

      <div className="example-grid">
        {SEEDANCE_EXAMPLES.map((example, index) => (
          <article className="example-card" key={example.id}>
            <div className="example-card-topline">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <code>{example.requestBody.model}</code>
            </div>
            <h3>{example.title}</h3>
            <p>{example.summary}</p>
            <dl>
              <div>
                <dt>输入 / 输出</dt>
                <dd>{example.capability}</dd>
              </div>
              <div>
                <dt>模型说明</dt>
                <dd>{example.modelNote}</dd>
              </div>
            </dl>
            <button
              type="button"
              data-testid={`apply-example-${example.id}`}
              onClick={() => applyExample(example)}
            >
              填入参数
              <span aria-hidden="true">→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
