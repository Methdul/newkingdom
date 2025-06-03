// ===== frontend/next.config.js =====
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'FitZone Pro',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'auth-token',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig