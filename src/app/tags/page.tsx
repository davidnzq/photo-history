import type { Metadata } from "next";
import { allTags } from "@/lib/data";
import { TagsCloud } from "./TagsCloud";

export const metadata: Metadata = {
  title: "标签 · 摄影历",
  description:
    "技法、介质、关键词:从徕卡到 8x10、从决定性瞬间到日记式,聚合后浏览每个关键词背后的摄影师群像。",
};

export default function TagsPage() {
  const tags = allTags();
  return <TagsCloud tags={tags} />;
}
