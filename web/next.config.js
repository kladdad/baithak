/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: process.env.NEXT_PUBLIC_UPLOAD_DOMAINS.split(','),
  },
}

module.exports = nextConfig
