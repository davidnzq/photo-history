import type { Metadata } from "next";
import { PHOTOGRAPHERS, MOVEMENTS, EVENTS } from "@/lib/data";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: "关于 · 摄影简史",
  description: "本站的初衷、数据来源、版权与鸣谢。制作人 · 赤拔。",
};

export default function AboutPage() {
  return (
    <AboutContent
      counts={{
        photographers: PHOTOGRAPHERS.length,
        movements: MOVEMENTS.length,
        events: EVENTS.length,
      }}
    />
  );
}
