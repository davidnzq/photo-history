"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/shell/LocaleProvider";
import { useT } from "@/lib/i18n";
import {
  TimelineIcon,
  NetworkIcon,
  MovementsIcon,
  LineageIcon,
} from "@/components/shell/ViewIcons";

type Props = {
  counts: { photographers: number; movements: number; events: number };
  /** when true, render with intercepting-modal chrome (close X, Esc handler, etc.) */
  inModal?: boolean;
};

export function AboutContent(props: Props) {
  const { locale } = useLocale();
  const t = useT();
  const router = useRouter();

  // Esc closes modal mode
  useEffect(() => {
    if (!props.inModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [props.inModal, router]);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      {/* close affordance — only when running as intercepting modal */}
      {props.inModal && (
        <div className="sticky top-0 z-10 border-b border-rule bg-bg/85 backdrop-blur flex items-center justify-end gap-3 px-5 h-12">
          <span className="font-display text-[10px] tracking-[0.32em] uppercase text-ink-3 mr-auto">
            {t("nav.about")}
          </span>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t("nav.about.close")}
            title={`${t("nav.about.close")} (Esc)`}
            className="w-9 h-9 -mr-2 flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <div className="px-6 lg:px-12 py-12 max-w-2xl mx-auto">
        {locale === "en" ? (
          <AboutEN counts={props.counts} t={t} />
        ) : (
          <AboutZH counts={props.counts} t={t} />
        )}
      </div>
    </div>
  );
}

type Inner = {
  counts: Props["counts"];
  t: ReturnType<typeof useT>;
};

/* ── Chinese ────────────────────────────────────────────────────── */

function AboutZH({ counts, t }: Inner) {
  return (
    <>
      <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-2">
        About
      </div>
      <h1 className="font-display text-4xl text-ink tracking-tight mb-8">
        {t("about.heading")}
      </h1>

      <Section title="初衷">
        <p>
          把摄影史从孤立的"摄影师 + 代表作"清单,变成一份
          <strong className="text-ink">可以追溯、可以发散</strong>的传承图谱。
          从某位你已知的人出发,看他<strong className="text-ink">受谁启发</strong>、
          <strong className="text-ink">与谁同代</strong>、
          <strong className="text-ink">后面延伸出哪些道路</strong>;也看流派如何兴起、高峰、让位,
          看摄影学科怎样从 1826 年的日光蚀刻,长成今天的样子。
        </p>
      </Section>

      <Section title="四个视图">
        <ViewList
          items={[
            { Icon: TimelineIcon, href: "/", label: "时间线",
              desc: "横向年代尺,按流派分轨道铺人物,关键技术 / 事件以纵向标记。" },
            { Icon: NetworkIcon, href: "/network", label: "影响网络",
              desc: "节点 - 连线力图,按主流派聚类。左键打开词条,左侧栏切换'聚焦关系'模式。" },
            { Icon: MovementsIcon, href: "/movements", label: "流派",
              desc: `${counts.movements} 个摄影流派的卡片墙,点入查看兴衰、代表人物和承接关系。` },
            { Icon: LineageIcon, href: "/lineage", label: "传承关系",
              desc: "从 1826 尼埃普斯起的纵向 dendrogram,讲技术 - 美学传承关系。" },
          ]}
        />
      </Section>

      <Section title="数据">
        <p>
          首版数据集:<strong className="text-ink">{counts.photographers}</strong> 位摄影师、
          <strong className="text-ink">{counts.movements}</strong> 个流派、
          <strong className="text-ink">{counts.events}</strong> 个关键事件。
          数据基于通识公开资料(Wikipedia、博物馆收藏、画册简介等)整理,中文为主。
          难免有小误差(年份偏差、影响关系存争议、作品归属等),欢迎指正。
        </p>
      </Section>

      <Section title="作品图与版权">
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

      <Section title="技术栈">
        <p>
          Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + d3-scale / d3-zoom +
          react-force-graph-2d。{counts.photographers}+ 摄影师独立页 SSG 预渲染,
          Vercel 部署,自动 sitemap.xml 与 robots.txt。
        </p>
      </Section>

      <Section title="制作人">
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
    </>
  );
}

/* ── English ────────────────────────────────────────────────────── */

function AboutEN({ counts, t }: Inner) {
  return (
    <>
      <div className="font-display text-[10px] tracking-[0.24em] uppercase text-ink-3 mb-2">
        About
      </div>
      <h1 className="font-display text-4xl text-ink tracking-tight mb-8">
        {t("about.heading")}
      </h1>

      <Section title="Why">
        <p>
          Turn photographic history from an isolated &ldquo;photographer + greatest hits&rdquo;
          list into a <strong className="text-ink">traceable, branching</strong> map of influence.
          Start with a name you know, see <strong className="text-ink">who shaped them</strong>,
          <strong className="text-ink"> who their peers were</strong>, and{" "}
          <strong className="text-ink">what paths grew out of their work</strong>.
          Watch movements rise, peak and yield. Trace the discipline from Niépce&rsquo;s
          heliograph in 1826 to the present day.
        </p>
      </Section>

      <Section title="Four views">
        <ViewList
          items={[
            { Icon: TimelineIcon, href: "/", label: "Timeline",
              desc: "Horizontal year axis, photographers placed in movement-coloured swim lanes, with key technologies / exhibitions marked vertically." },
            { Icon: NetworkIcon, href: "/network", label: "Influence",
              desc: "Force-directed node-link graph, clustered by primary movement. Left-click opens the photographer entry; switch the left rail to Focus ego to spotlight relationships." },
            { Icon: MovementsIcon, href: "/movements", label: "Movements",
              desc: `${counts.movements} cards, ordered by peak year. Click into one to see its rise, peak, key figures and successor lineages.` },
            { Icon: LineageIcon, href: "/lineage", label: "Lineage",
              desc: "Curated vertical dendrogram from Niépce's 1826 heliograph onward, tracing the technical and aesthetic descent of the medium." },
          ]}
        />
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
    </>
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

type ViewItem = {
  Icon: React.ComponentType<{ size?: number }>;
  href: string;
  label: string;
  desc: string;
};

function ViewList({ items }: { items: ViewItem[] }) {
  return (
    <ul className="space-y-3 list-none">
      {items.map(({ Icon, href, label, desc }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex items-start gap-3 text-ink-2 hover:text-ink transition-colors group"
          >
            <span className="shrink-0 mt-1 text-accent group-hover:scale-110 transition-transform">
              <Icon size={16} />
            </span>
            <span className="flex-1">
              <span className="font-display text-ink underline underline-offset-2 decoration-accent/40 group-hover:decoration-accent">
                {label}
              </span>{" "}
              — {desc}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
