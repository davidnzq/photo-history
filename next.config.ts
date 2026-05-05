import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 关掉左下角 Next.js dev 浮窗 (per UX 反馈,只是开发工具,生产无此元素).
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "live.staticflickr.com" },
      { protocol: "https", hostname: "*.staticflickr.com" },
      { protocol: "https", hostname: "*.wikimedia.org" },
    ],
  },
  experimental: {
    optimizePackageImports: ["d3-scale", "d3-zoom", "d3-array"],
  },
};

export default nextConfig;
