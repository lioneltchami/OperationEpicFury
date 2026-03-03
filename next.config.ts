import type { NextConfig } from "next";

const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
	{
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	},
	{
		key: "Content-Security-Policy",
		value:
			"default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://api.telegram.org https://*.telegram.org https://*.basemaps.cartocdn.com; media-src 'self' https://api.telegram.org https://*.telegram.org; connect-src 'self' https://vitals.vercel-insights.com https://api.telegram.org; font-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
	},
];

const nextConfig: NextConfig = {
	poweredByHeader: false,
	experimental: {
		optimizePackageImports: ["framer-motion"],
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "api.telegram.org",
			},
			{
				protocol: "https",
				hostname: "*.telegram.org",
			},
		],
	},
	async headers() {
		return [
			{ source: "/(.*)", headers: securityHeaders },
			{
				source: "/sw.js",
				headers: [
					{
						key: "Content-Type",
						value: "application/javascript; charset=utf-8",
					},
					{
						key: "Cache-Control",
						value: "no-cache, no-store, must-revalidate",
					},
					{
						key: "Content-Security-Policy",
						value: "default-src 'self'; script-src 'self'",
					},
				],
			},
		];
	},
};

export default nextConfig;
