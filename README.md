# 摄影历 · Photography History

把摄影史从孤立的"摄影师 + 代表作"清单,变成一份可以追溯、可以发散的传承图谱。

## 视图

- **`/`** — 时间线(主入口),横向年代尺,流派轨道色带,人物条按生卒铺位,关键技术/事件以纵向标记
- **`/network`** — 影响网络,react-force-graph-2d 节点-连线力图,流派聚类,点击进入 ego 模式
- **`/movements`** — 流派卡片墙,点入 `/movements/[id]` 看兴衰、代表人物、承接关系
- **`/lineage`** — 传承关系,从 1826 尼埃普斯起的纵向 dendrogram,讲技术-美学传承关系
- **`/p/[id]`** — 摄影师独立词条页(SSG,SEO 友好),左词条 + 右迷你 ego graph

## 数据规模

首版 56 摄影师 / 12 流派 / 23 关键事件。后续在 `src/data/*.json` 不动代码即可扩展到 200+。

## 技术栈

- **Next.js 16.2** (App Router) + React 19 + TypeScript
- **Tailwind v4** with 暗房画廊 design tokens(深炭墨黑底 + 流派 muted 色板)
- **d3-scale / d3-zoom / d3-selection** for the SVG timeline
- **react-force-graph-2d** for the influence network
- 56 个 `/p/[id]` 静态预渲染页面 + 12 个 `/movements/[id]`
- 自动 `sitemap.xml` + `robots.txt` + JSON-LD `<Person>` 结构化数据

## 本地开发

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # production build
pnpm start        # run production build locally
```

## 部署到 Vercel

### 路径 A:GitHub + Vercel 控制台(推荐,自动 CI)

1. 在 GitHub 新建空仓库(如 `photo-history`)
2. 把当前目录 push 上去:
   ```bash
   git remote add origin https://github.com/<you>/photo-history.git
   git push -u origin main
   ```
3. 打开 [vercel.com/new](https://vercel.com/new),Import 这个仓库,Framework 自动识别为 Next.js
4. (可选)在项目 Settings > Environment Variables 设置 `NEXT_PUBLIC_SITE_URL` 为最终域名
5. Deploy 一键完成,会得到 `*.vercel.app` 子域。后续 push 自动 deploy

### 路径 B:Vercel CLI

```bash
pnpm dlx vercel@latest    # 交互式登录 + 链接项目 + 部署
pnpm dlx vercel --prod    # 后续推 prod
```

## 数据扩展(P5+)

- `src/data/photographers.json` — 摄影师数组
- `src/data/movements.json` — 流派数组
- `src/data/events.json` — 关键技术/事件
- `src/data/lineage.json` — 传承关系层级(策展性,手工编辑)

数据 schema 由 `src/lib/types.ts` 定义。新增/修改后:
1. `pnpm build` 验证类型 + SSG 页面更新
2. 重新部署即可

## 数据准确度声明

bio / keyDates / influencedBy / works 字段基于通识公开资料(Wikipedia、博物馆收藏、画册简介等)整理,
难免有小误差(年份偏差、影响关系存争议、作品归属等)。`sources` 字段记录引用,方便后续校订。
图片加载失败时,UI 用流派色调渐变占位,不阻塞演示。

## 版权

文字基于 Wikipedia (CC-BY-SA) 和摄影通识改写,引用名言原则上不超过 30 字 / 条 (fair use)。
作品图通过外链调用 Wikimedia Commons / 公共领域 / Unsplash 等公开图源,不本地托管。
