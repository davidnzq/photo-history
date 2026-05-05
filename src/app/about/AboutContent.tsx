"use client";

import Link from "next/link";
import { useLocale } from "@/components/shell/LocaleProvider";

type Props = {
  counts: { photographers: number; movements: number; events: number };
};

export function AboutContent({ counts }: Props) {
  const { locale } = useLocale();
  return locale === "en" ? <AboutEN counts={counts} /> : <AboutZH counts={counts} />;
}

/* ── Chinese ────────────────────────────────────────────────────── */

function AboutZH({ counts }: Props) {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="px-6 lg:px-12 py-12 max-w-2xl mx-auto">
        <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-2">
          About
        </div>
        <h1 className="font-display text-4xl text-ink tracking-tight mb-8">
          关于摄影历
        </h1>

        <Section title="初衷 / Why">
          <p>
            把摄影史从孤立的"摄影师 + 代表作"清单,变成一份<strong className="text-ink">可以追溯、可以发散</strong>的传承图谱。
            从某位你已知的人出发,看他<strong className="text-ink">受谁启发</strong>、<strong className="text-ink">与谁同代</strong>、<strong className="text-ink">后面延伸出哪些道路</strong>;也看流派如何兴起、高峰、让位,
            看摄影学科怎样从 1826 年的日光蚀刻,长成今天的样子。
          </p>
        </Section>

        <Section title="四个视图 / Four Views">
          <ul className="space-y-2 list-none">
            <li>
              <Link href="/" className="text-accent hover:underline">⏱ 时间线</Link>{" "}
              — 横向年代尺,按流派分轨道铺人物,关键技术/事件以纵向标记。
            </li>
            <li>
              <Link href="/network" className="text-accent hover:underline">🕸 影响网络</Link>{" "}
              — 节点-连线力图,按主流派聚类。左键打开词条,左侧栏切换"聚焦关系"模式。
            </li>
            <li>
              <Link href="/movements" className="text-accent hover:underline">🏛 流派</Link>{" "}
              — {counts.movements} 个摄影流派的卡片墙,点入查看兴衰、代表人物和承接关系。
            </li>
            <li>
              <Link href="/lineage" className="text-accent hover:underline">🌳 传承关系</Link>{" "}
              — 从 1826 尼埃普斯起的纵向 dendrogram,讲技术-美学传承关系。
            </li>
          </ul>
        </Section>

        <Section title="数据 / Data">
          <p>
            首版数据集:<strong className="text-ink">{counts.photographers}</strong> 位摄影师、
            <strong className="text-ink">{counts.movements}</strong> 个流派、
            <strong className="text-ink">{counts.events}</strong> 个关键事件。
            数据基于通识公开资料(Wikipedia、博物馆收藏、画册简介等)整理,以中文为主、英文人名/作品名并列。
            难免有小误差(年份偏差、影响关系存争议、作品归属等),欢迎指正。
          </p>
        </Section>

        <Section title="作品图与版权 / Images & Rights">
          <p>
            作品图均通过外链调用,优先来自 Wikimedia Commons 公共领域(19 世纪到 1930s 大量作品已进入公共领域),
            其次为各基金会公开授权图源 / Unsplash。当源图加载失败,UI 用流派色调渐变占位,
            并显示作品标题与年份,不阻塞演示。
          </p>
          <p className="mt-3">
            文字描述基于 Wikipedia(CC-BY-SA)和摄影通识改写,引用名言原则上不超过 30 字 / 条(fair use)。
            如果你是某位摄影师 / 基金会的版权方,认为某条信息需要修正或下线,请通过 GitHub issue 联系。
          </p>
        </Section>

        <Section title="技术栈 / Tech">
          <p>
            Next.js 16(App Router) + React 19 + TypeScript + Tailwind v4 + d3-scale / d3-zoom +
            react-force-graph-2d。{counts.photographers}+ 摄影师独立页 SSG 预渲染,Vercel 部署,
            自动 sitemap.xml 与 robots.txt。
          </p>
        </Section>

        <Section title="制作人 / Curated by">
          <p>
            <strong className="text-ink text-lg font-display tracking-wide">赤拔 · Chiba</strong>
          </p>
          <p className="mt-2 text-[13px]">
            源代码:{" "}
            <a
              href="https://github.com/davidnzq/photo-history"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/davidnzq/photo-history
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

/* ── English ────────────────────────────────────────────────────── */

function AboutEN({ counts }: Props) {
  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="px-6 lg:px-12 py-12 max-w-2xl mx-auto">
        <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-2">
          About
        </div>
        <h1 className="font-display text-4xl text-ink tracking-tight mb-8">
          About Photo History
        </h1>

        <Section title="Why">
          <p>
            Turn photographic history from an isolated "photographer + greatest hits" list into
            a <strong className="text-ink">traceable, branching</strong> map of influence.
            Start with a name you know, see <strong className="text-ink">who shaped them</strong>,
            <strong className="text-ink"> who their peers were</strong>, and{" "}
            <strong className="text-ink">what paths grew out of their work</strong>.
            Watch movements rise, peak and yield. Trace the discipline from Niépce&rsquo;s
            heliograph in 1826 to the present day.
          </p>
        </Section>

        <Section title="Four views">
          <ul className="space-y-2 list-none">
            <li>
              <Link href="/" className="text-accent hover:underline">⏱ Timeline</Link>{" "}
              — Horizontal year axis, photographers placed in movement-coloured swim lanes,
              with key technologies / exhibitions marked vertically.
            </li>
            <li>
              <Link href="/network" className="text-accent hover:underline">🕸 Influence Network</Link>{" "}
              — Force-directed node-link graph, clustered by primary movement.
              Left-click opens the photographer entry; switch the left rail to{" "}
              <em>Focus ego</em> to spotlight relationships.
            </li>
            <li>
              <Link href="/movements" className="text-accent hover:underline">🏛 Movements</Link>{" "}
              — {counts.movements} cards, ordered by peak year. Click into one to see its
              rise, peak, key figures and successor lineages.
            </li>
            <li>
              <Link href="/lineage" className="text-accent hover:underline">🌳 Lineage</Link>{" "}
              — Curated vertical dendrogram from Niépce&rsquo;s 1826 heliograph onward,
              tracing the technical and aesthetic descent of the medium.
            </li>
          </ul>
        </Section>

        <Section title="Data">
          <p>
            First release: <strong className="text-ink">{counts.photographers}</strong> photographers,
            <strong className="text-ink"> {counts.movements}</strong> movements,
            <strong className="text-ink"> {counts.events}</strong> key events.
            Compiled from public-knowledge sources (Wikipedia, museum collections, monographs).
            Long-form bios are still Chinese-only in this release; English translation is on
            the roadmap. Corrections welcome via GitHub issues.
          </p>
        </Section>

        <Section title="Images & rights">
          <p>
            All work images are loaded via external URL, preferring Wikimedia Commons public-domain
            assets (most 19th-century to 1930s photography is in the public domain),
            then foundation-licensed images and Unsplash.
            When an image fails to load, the UI substitutes a movement-tinted gradient
            with the work&rsquo;s title and year — content stays readable.
          </p>
          <p className="mt-3">
            Prose is rewritten from Wikipedia (CC-BY-SA) and photography reference works.
            Direct quotations are kept under ~30 characters / 6 words per quote (fair use).
            Rights holders who want a record corrected or removed should open a GitHub issue.
          </p>
        </Section>

        <Section title="Tech">
          <p>
            Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + d3-scale / d3-zoom +
            react-force-graph-2d. {counts.photographers}+ photographer pages are statically pre-rendered.
            Deployed on Vercel with automatic sitemap and robots files.
          </p>
        </Section>

        <Section title="Curated by">
          <p>
            <strong className="text-ink text-lg font-display tracking-wide">Chiba · 赤拔</strong>
          </p>
          <p className="mt-2 text-[13px]">
            Source:{" "}
            <a
              href="https://github.com/davidnzq/photo-history"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/davidnzq/photo-history
            </a>
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-3">
        {title}
      </h2>
      <div className="text-[15px] text-ink-2 leading-relaxed">{children}</div>
    </section>
  );
}
