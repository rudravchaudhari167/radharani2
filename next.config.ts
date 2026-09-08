import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/shop/men",
        destination: "/shop/women",
        permanent: true,
      },
      {
        source: "/shop/accessories",
        destination: "/shop/women",
        permanent: true,
      },
      {
        source: "/shop/unisex",
        destination: "/shop/women",
        permanent: true,
      },
      {
        source: "/shop/kids",
        destination: "/shop/women",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
