import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/shop/women",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/shop/men",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/shop/accessories",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/shop/unisex",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/shop/kids",
        destination: "/shop",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "onapzqiamqzincouxhxx.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
