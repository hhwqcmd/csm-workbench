import { SeedanceExampleGallery } from "./components/SeedanceExampleGallery";
import { SeedanceTaskRunner } from "./components/SeedanceTaskRunner";

export default function Home() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="返回演示工作台顶部">
          <span className="brand-mark">S2</span>
          <span>
            <strong>Seedance 2.0</strong>
            <small>视频生成演示工作台</small>
          </span>
        </a>
        <div className="topbar-actions">
          <span className="local-badge">本地演示模式</span>
          <a className="topbar-anchor" href="#sample">
            示例素材
          </a>
          <a className="topbar-anchor" href="#operations">
            实操控制台
          </a>
          <a
            className="doc-link"
            href="https://docs.volcengine.com/docs/82379/2291680?lang=zh"
            target="_blank"
            rel="noreferrer"
          >
            官方 API 文档 ↗
          </a>
        </div>
      </header>

      <section className="hero demo-hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">SEEDANCE API DEMO CONSOLE</p>
          <h1>
            从完整请求，
            <br />
            一路演示到结果。
          </h1>
          <p className="hero-summary">
            面向现场讲解与方案验证：配置官方 API 或 Agent Plan、审核完整请求、提交视频任务，并在同一页面追踪状态、结果与请求日志。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#operations">
              开始实操演示
            </a>
            <a className="secondary-action" href="#sample">
              查看官方示例
            </a>
          </div>
        </div>

        <aside className="hero-panel demo-flow-panel" aria-label="演示流程">
          <div className="panel-topline">
            <span>演示流程</span>
            <span className="progress-label">LIVE</span>
          </div>
          <ol className="objective-list">
            <li>
              <span>01</span>
              选择 API 通道、模型与凭证
            </li>
            <li>
              <span>02</span>
              编辑素材与输出参数
            </li>
            <li>
              <span>03</span>
              审核完整 Method、URL、Headers 与 Body
            </li>
            <li>
              <span>04</span>
              提交任务并打开请求 / 响应日志
            </li>
          </ol>
          <div className="security-note">
            <span aria-hidden="true">✦</span>
            <p>
              <strong>演示数据可恢复</strong>
              最近 30 次任务保存在当前浏览器；刷新后仍可查看任务状态、结果入口和结构化日志。
            </p>
          </div>
        </aside>
      </section>

      <SeedanceExampleGallery />

      <section className="config-section" id="operations">
        <div className="section-heading">
          <div>
            <p className="eyebrow">实操控制台</p>
            <h2>配置、审核、提交、追踪</h2>
          </div>
          <p>
            表单与完整 API 请求详情双向联动。每次点击提交都会生成一条历史记录，并持续追加创建与状态查询日志。
          </p>
        </div>
        <SeedanceTaskRunner />
      </section>

      <footer>
        <p>Seedance 2.0 视频生成演示工作台</p>
        <span>官方 API / Agent Plan · 完整请求审核 · 历史与日志</span>
      </footer>
    </main>
  );
}
