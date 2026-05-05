import type { Metadata } from "next";
import Link from "next/link";
import { PHOTOGRAPHERS, MOVEMENTS, EVENTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "关于 · 摄影历",
  description: "本站的初衷、数据来源、版权与鸣谢。",
};

export default function AboutPage() {
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
            把摄影史从孤立的"摄影师 + 代表作"清单,变成一份**可以追溯、可以发散**的传承图谱。
            从某位你已知的人出发,看他**受谁启发**、**与谁同代**、**后面延伸出哪些道路**;也看流派如何兴起、高峰、让位,
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
              — 节点-连线力图,按主流派聚类。点击进入 ego 模式,只留 2 度邻居。
            </li>
            <li>
              <Link href="/movements" className="text-accent hover:underline">🏛 流派</Link>{" "}
              — {MOVEMENTS.length} 个摄影流派的卡片墙,点入查看兴衰、代表人物和承接关系。
            </li>
            <li>
              <Link href="/lineage" className="text-accent hover:underline">🌳 传承关系</Link>{" "}
              — 从 1826 尼埃普斯起的纵向 dendrogram,讲技术-美学传承关系。
            </li>
          </ul>
        </Section>

        <Section title="数据 / Data">
          <p>
            首版数据集:<strong className="text-ink">{PHOTOGRAPHERS.length}</strong> 位摄影师
            、<strong className="text-ink">{MOVEMENTS.length}</strong> 个流派
            、<strong className="text-ink">{EVENTS.length}</strong> 个关键事件。
            数据基于通识公开资料(Wikipedia、博物馆收藏、画册简介等)整理,以中文为主、英文人名/作品名并列。
            难免有小误差(年份偏差、影响关系存争议、作品归属等),欢迎指正。
          </p>
        </Section>

        <Section title="作品图与版权 / Images & Rights">
          <p>
            作品图均通过外链调用,优先来自 Wikimedia Commons 公共领域(19 世纪到 1930s 大量作品已进入公共领域),
            其次为 MoMA / 各基金会公开授权图源 / Unsplash。当源图加载失败,UI 用流派色调渐变占位,
            并显示作品标题与年份,不阻塞演示。
          </p>
          <p className="mt-3">
            文字描述基于 Wikipedia(CC-BY-SA)和摄影通识改写,引用名言原则上不超过 30 字 / 条(fair use)。
            如果你是某位摄影师/基金会的版权方,认为某条信息需要修正或下线,请通过 GitHub issue 联系我们。
          </p>
        </Section>

        <Section title="技术栈 / Tech">
          <p>
            Next.js 16(App Router) + React 19 + TypeScript + Tailwind v4 + d3-scale / d3-zoom +
            react-force-graph-2d。56+ 摄影师独立页 SSG 预渲染,Vercel 部署,自动 sitemap.xml 与 robots.txt。
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
