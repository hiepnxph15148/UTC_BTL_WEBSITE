import type { NextConfig } from "next";

const apiOrigin =
  process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, "") ||
  "https://utc-btl-website.onrender.com/";

const nextConfig: NextConfig = {
  // Ẩn badge "N" góc dưới trong chế độ dev
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/media/**",
      },
    ],
  },
  async rewrites() {
    // Giữ rewrite cũ (tuỳ chọn). Auth/cart dùng /api/abp proxy + cookie.
    return [
      {
        source: "/backend-api/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
