/**
 * 摄影历 — minimal i18n (zh / en).
 *
 * 设计取舍:
 * - UI chrome(导航 / 视图标签 / 筛选 / 提示卡片 / About 文案)双语
 * - 摄影师/流派的姓名、英文名已内嵌在数据中,通过 getName 选择
 * - 长 bio / 关键年表 / 引文等中文长文,EN 模式下保留中文
 *   (避免机翻失真,后续可手动补译 bioEn 等字段;UI 不阻塞)
 *
 * 持久化:在 cookie `locale` 中记录,SSR 读 cookie 决定初始语言,
 * 客户端 LocaleProvider 接管后写 cookie。
 */

import { useLocale } from "@/components/shell/LocaleProvider";
import type { Movement, Photographer } from "./types";

export type Locale = "zh" | "en";
export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const dict: Record<Locale, Record<string, string>> = {
  zh: {
    /* brand */
    "brand.zh": "摄影历",
    "brand.en": "Photography History",
    "brand.full": "摄影历 · Photography History",

    /* nav / shell */
    "nav.about": "关于",
    "locale.aria": "切换语言",

    /* view switcher */
    "view.timeline": "时间线",
    "view.timeline.sub": "Timeline",
    "view.network": "影响网络",
    "view.network.sub": "Influence",
    "view.movements": "流派",
    "view.movements.sub": "Movements",
    "view.lineage": "传承关系",
    "view.lineage.sub": "Lineage",

    /* filter bar */
    "filter.label": "筛选 / Filter",
    "filter.movements": "流派",
    "filter.regions": "地域",
    "filter.all": "全部",
    "filter.nItems": "{n} 项",
    "filter.clear": "清除筛选",

    /* regions */
    "region.europe": "欧洲",
    "region.n-america": "北美",
    "region.latin": "拉美",
    "region.asia": "亚洲",
    "region.africa": "非洲",
    "region.oceania": "大洋",
    "region.middle-east": "中东",

    /* canvas hints */
    "hint.zoomPan": "滚轮缩放 · 拖拽平移",
    "hint.reset": "复位 · Reset",
    "hint.network.detail": "点击节点 · 打开词条 · 滚轮缩放 · 拖拽平移",
    "hint.network.ego": "点击节点 · 聚焦关系 · 滚轮缩放 · 拖拽平移",

    /* network rail */
    "rail.click": "点击行为 · Click",
    "rail.click.detail": "打开词条",
    "rail.click.ego": "聚焦关系",
    "rail.movements": "流派色带 · Movements",
    "rail.ego.title": "聚焦中 · Ego",
    "rail.ego.openDetail": "→ 查看词条",
    "rail.ego.exit": "✕ 退出聚焦",

    /* page titles / metadata */
    "page.timeline.title": "时间线 · 摄影历",
    "page.network.title": "影响网络 · 摄影历",
    "page.movements.title": "流派 · 摄影历",
    "page.lineage.title": "传承关系 · 摄影历",
    "page.about.title": "关于 · 摄影历",

    /* movements grid */
    "movements.heading": "流派 · 运动",
    "movements.intro":
      "按高峰年份排列的 {n} 个摄影流派/运动。点入查看兴衰、代表人物和承接关系。",

    /* about */
    "about.heading": "关于这个站点",
    "about.byline": "制作人 · 赤拔",

    /* drawer */
    "drawer.title": "人物词条",
    "drawer.openStandalone": "独立页",
    "drawer.close": "关闭抽屉",
  },

  en: {
    /* brand */
    "brand.zh": "Photo History",
    "brand.en": "Photography History",
    "brand.full": "Photography History",

    /* nav / shell */
    "nav.about": "About",
    "locale.aria": "Switch language",

    /* view switcher */
    "view.timeline": "Timeline",
    "view.timeline.sub": "时间线",
    "view.network": "Influence",
    "view.network.sub": "影响网络",
    "view.movements": "Movements",
    "view.movements.sub": "流派",
    "view.lineage": "Lineage",
    "view.lineage.sub": "传承",

    /* filter bar */
    "filter.label": "Filter",
    "filter.movements": "Movements",
    "filter.regions": "Region",
    "filter.all": "All",
    "filter.nItems": "{n} selected",
    "filter.clear": "Clear filters",

    /* regions */
    "region.europe": "Europe",
    "region.n-america": "N. America",
    "region.latin": "Latin Am.",
    "region.asia": "Asia",
    "region.africa": "Africa",
    "region.oceania": "Oceania",
    "region.middle-east": "Mid. East",

    /* canvas hints */
    "hint.zoomPan": "Wheel zoom · Drag pan",
    "hint.reset": "Reset",
    "hint.network.detail": "Click node · Open detail · Wheel zoom · Drag pan",
    "hint.network.ego": "Click node · Focus ego · Wheel zoom · Drag pan",

    /* network rail */
    "rail.click": "Click behaviour",
    "rail.click.detail": "Open detail",
    "rail.click.ego": "Focus ego",
    "rail.movements": "Movements",
    "rail.ego.title": "Focused · Ego",
    "rail.ego.openDetail": "→ Open detail",
    "rail.ego.exit": "✕ Clear focus",

    /* page titles / metadata */
    "page.timeline.title": "Timeline · Photography History",
    "page.network.title": "Influence Network · Photography History",
    "page.movements.title": "Movements · Photography History",
    "page.lineage.title": "Lineage · Photography History",
    "page.about.title": "About · Photography History",

    /* movements grid */
    "movements.heading": "Movements",
    "movements.intro":
      "{n} photographic movements, arranged by peak year. Click into a card to read the rise, peak and succession.",

    /* about */
    "about.heading": "About this site",
    "about.byline": "Curated by Chiba",

    /* drawer */
    "drawer.title": "Photographer entry",
    "drawer.openStandalone": "Standalone",
    "drawer.close": "Close drawer",
  },
};

/** Look up a key for the given locale, with optional {n} interpolation. */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const raw = dict[locale]?.[key] ?? dict.zh[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

/** Hook variant — pulls locale from context. */
export function useT() {
  const { locale } = useLocale();
  return (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}

/* ── name helpers ──────────────────────────────────────────────── */

/** Pick the right primary display name for a photographer, given locale. */
export function getPhotographerName(p: Photographer, locale: Locale): string {
  return locale === "en" ? p.name : p.nameZh;
}

/** Pick the right secondary (subtitle) display name. */
export function getPhotographerSubname(
  p: Photographer,
  locale: Locale
): string {
  return locale === "en" ? p.nameZh : p.name;
}

/** Pick the right primary movement name. */
export function getMovementName(m: Movement, locale: Locale): string {
  return locale === "en" ? m.nameEn : m.nameZh;
}

/** Pick the right subtitle movement name. */
export function getMovementSubname(m: Movement, locale: Locale): string {
  return locale === "en" ? m.nameZh : m.nameEn;
}
