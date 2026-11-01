/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server-side file system access (for local JSON store)
  serverExternalPackages: ["nodemailer"],
  // Image domains (if any hosted images)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // Expose non-secret env vars to client
  env: {
    NEXT_PUBLIC_DEMO_MODE: process.env.DEMO_MODE,
  },
};

export default nextConfig;
