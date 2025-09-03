import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: isProd ? '/g550-flight-calculator' : '',
  assetPrefix: isProd ? '/g550-flight-calculator/' : '',
  images: {
    unoptimized: true
  },
  // Disable server-only features for static export
  typescript: {
    ignoreBuildErrors: false
  },
  eslint: {
    ignoreDuringBuilds: false
  }
};

export default nextConfig;
