import type { Metadata } from "next";
import { InfluenceNetwork } from "@/components/views/InfluenceNetwork";
import { PHOTOGRAPHERS, MOVEMENTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "影响网络 · 摄影简史",
  description: "节点-连线力图,梳理 56 位摄影师之间的影响关系。点击节点进入 ego 模式,右键进入词条。",
};

export default function NetworkPage() {
  return <InfluenceNetwork photographers={PHOTOGRAPHERS} movements={MOVEMENTS} />;
}
