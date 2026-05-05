import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { TopNav } from "@/components/shell/TopNav";
import { ViewSwitcher } from "@/components/shell/ViewSwitcher";
import { FilterBar } from "@/components/shell/FilterBar";
import { LocaleProvider } from "@/components/shell/LocaleProvider";
import { LocaleAwareFooter } from "@/components/shell/LocaleAwareFooter";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://photo-history.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "摄影简史 · Brief History of Photography",
    template: "%s · 摄影简史",
  },
  description:
    "以时间线为主轴的摄影史交互站,梳理 180 余年传承图谱:同时代关系、流派兴衰、影响传承,从达盖尔法到当代。",
  keywords: [
    "摄影史",
    "Photography History",
    "摄影流派",
    "摄影师",
    "决定性瞬间",
    "新地形",
    "杜塞尔多夫学派",
  ],
  authors: [{ name: "Chiba" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "摄影简史 · Brief History of Photography",
    description: "180 年摄影传承图谱:同时代、流派、影响,一目了然。",
  },
  twitter: {
    card: "summary_large_image",
    title: "摄影简史 · Brief History of Photography",
    description: "180 年摄影传承图谱。",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-bg text-ink">
        {/* SSG-friendly: provider seeds with "zh" then reconciles to cookie
            value on client mount. Avoids cookies() in layout which would
            opt the entire route tree out of static rendering. */}
        <LocaleProvider initialLocale="zh">
          <TopNav />
          <ViewSwitcher />
          <FilterBar />
          <main className="flex-1 min-h-0 relative overflow-hidden">
            {children}
          </main>
          <LocaleAwareFooter />
          {/* Intercepting-route slot: renders the photographer drawer when
              a sibling route (timeline / network / etc.) softly navigates
              to /p/[id]. Direct visits fall through to app/p/[id]/page.tsx. */}
          {modal}
        </LocaleProvider>
      </body>
    </html>
  );
}
