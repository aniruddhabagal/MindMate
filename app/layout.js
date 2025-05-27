// app/layout.js
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

// ✅ Enhanced Metadata for SEO and Social Sharing (Next.js 13+ App Router)
export const metadata = {
  title: {
    default: "MindMate - Your Mental Wellness Companion",
    template: "%s | MindMate",
  },
  description:
    "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance. Your personal mental wellness companion for a healthier mind.",
  keywords: [
    "mental health",
    "wellness",
    "stress management",
    "emotional support",
    "mindfulness",
    "mental wellbeing",
    "self-care",
    "meditation",
    "anxiety relief",
    "depression support",
  ],
  authors: [{ name: "MindMate Team" }],
  creator: "MindMate",
  publisher: "MindMate",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://mindmate.aniruddha.fyi"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MindMate - Your Mental Wellness Companion",
    description:
      "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance. Your personal mental wellness companion for a healthier mind.",
    url: "https://mindmate.aniruddha.fyi",
    siteName: "MindMate",
    images: [
      {
        url: "https://mindmate.aniruddha.fyi/mindmate.png", // Full absolute URL
        width: 1200,
        height: 630,
        alt: "MindMate - Mental Wellness Companion",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MindMate - Your Mental Wellness Companion",
    description:
      "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance.",
    images: ["https://mindmate.aniruddha.fyi/mindmate.png"], // Full absolute URL
    creator: "@AniruddhaBagal", // Add your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/favicons/safari-pinned-tab.svg",
        color: "#5bbad5",
      },
    ],
  },
  manifest: "/favicons/site.webmanifest",
  other: {
    "msapplication-TileColor": "#da532c",
    "msapplication-config": "/favicons/browserconfig.xml",
    "theme-color": "#ffffff",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Core Open Graph Meta Tags - Required by Protocol */}
        <meta
          property="og:title"
          content="MindMate - Your Mental Wellness Companion"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:image"
          content="https://mindmate.aniruddha.fyi/mindmate.png"
        />
        <meta property="og:url" content="https://mindmate.aniruddha.fyi" />
        <meta
          property="og:description"
          content="MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance. Your personal mental wellness companion for a healthier mind."
        />
        <meta property="og:site_name" content="MindMate" />
        <meta property="og:locale" content="en_US" />

        {/* Enhanced Open Graph Image Properties */}
        <meta
          property="og:image:secure_url"
          content="https://mindmate.aniruddha.fyi/mindmate.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="MindMate - Mental Wellness Companion"
        />
        <meta property="og:image:type" content="image/png" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AniruddhaBagal" />
        <meta name="twitter:creator" content="@AniruddhaBagal" />
        <meta
          name="twitter:title"
          content="MindMate - Your Mental Wellness Companion"
        />
        <meta
          name="twitter:description"
          content="MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance."
        />
        <meta
          name="twitter:image"
          content="https://mindmate.aniruddha.fyi/mindmate.png"
        />
        <meta
          name="twitter:image:alt"
          content="MindMate - Mental Wellness Companion"
        />

        {/* Additional Social Media Meta Tags */}
        <meta property="article:author" content="MindMate Team" />
        <meta
          property="article:publisher"
          content="https://mindmate.aniruddha.fyi"
        />

        {/* Mobile and App Meta Tags */}
        <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MindMate" />

        {/* Preconnect for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />

        {/* DNS Prefetch for External Resources */}
        <link rel="dns-prefetch" href="//vercel.com" />
        <link rel="dns-prefetch" href="//analytics.vercel.com" />

        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"
          strategy="beforeInteractive"
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
