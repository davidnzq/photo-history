import type { Metadata } from "next";
import { LineageTree } from "@/components/views/LineageTree";
import { LINEAGE } from "@/lib/data";

export const metadata: Metadata = {
  title: "传承关系 · 摄影简史",
  description: "从 1826 尼埃普斯日光蚀刻起,纵向展开摄影学科的技术 · 美学传承关系。",
};

export default function LineagePage() {
  return <LineageTree root={LINEAGE} />;
}
