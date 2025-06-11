/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // This is the reference ID from your Supabase project URL.
        hostname: 'kntltioaisfmepxgadhr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/profile-pictures/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig;