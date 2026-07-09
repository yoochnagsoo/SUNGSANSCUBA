import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d2ck1cgvtnr7j2.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;