/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ["mdx-bundler", "shiki"],
    transpilePackages: ["ui"]
  }
}

module.exports = nextConfig
