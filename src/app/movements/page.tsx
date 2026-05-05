import type { Metadata } from "next";
import { MovementsGrid } from "@/components/views/MovementsGrid";
import { MOVEMENTS } from "@/lib/data";

export const metadata: Metadata = {
  title: "流派 · 摄影简史",
  description: `${MOVEMENTS.length} 个摄影流派与运动 — 画意主义、直接摄影、人文主义、街拍、新地形、杜塞尔多夫学派……`,
};

export default function MovementsPage() {
  return <MovementsGrid movements={MOVEMENTS} />;
}
