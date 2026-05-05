import type { Metadata } from "next";
import { Timeline } from "@/components/views/Timeline";
import { PHOTOGRAPHERS, MOVEMENTS, EVENTS, YEAR_BOUNDS } from "@/lib/data";

export const metadata: Metadata = {
  title: "时间线 · 摄影简史",
  description:
    "横向年代尺铺开 180 余年摄影史。流派轨道色带,人物条按生卒铺位,关键技术与展览以纵向标记标出。",
};

export default function HomePage() {
  return (
    <Timeline
      photographers={PHOTOGRAPHERS}
      movements={MOVEMENTS}
      events={EVENTS}
      yearBounds={YEAR_BOUNDS}
    />
  );
}
