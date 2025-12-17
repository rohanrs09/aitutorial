/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack (Next.js 16+)
  turbopack: {},
  // Webpack config for fallback/compatibility
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
}

module.exports = nextConfig
