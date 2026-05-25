/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:7002/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
