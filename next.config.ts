import type { NextConfig } from "next";

const isGithubPages = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  ...(isGithubPages && {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
  }),
  trailingSlash: true,
};

export default nextConfig;
