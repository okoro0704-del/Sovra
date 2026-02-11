/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sovrn/shared'],
  output: 'export',
}

module.exports = nextConfig
