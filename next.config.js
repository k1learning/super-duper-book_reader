/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't fail production builds on lint warnings — lint locally instead.
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
