// app/layout.js
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

// ✅ Enhanced but Clean Metadata (Based on working example + additional features)
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
  authors: [{ name: "Aniruddha Bagal" }],
  creator: "Aniruddha Bagal",
  publisher: "Aniruddha Bagal",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/mindmate.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/mindmate.png" }, // Primary apple icon
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
  metadataBase: new URL("https://mindmate.aniruddha.fyi"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://mindmate.aniruddha.fyi",
    title: "MindMate - Your Mental Wellness Companion",
    description:
      "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance. Your personal mental wellness companion for a healthier mind.",
    siteName: "MindMate",
    images: [
      {
        url: "/mindmate.png", // Using relative URL like working example
        width: 1200,
        height: 630,
        alt: "MindMate - Mental Wellness Companion",
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
    images: ["/mindmate.png"], // Using relative URL
    creator: "@mindmate",
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
        {/* Essential meta tags only - no duplicates */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Mobile and PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MindMate" />

        {/* Performance Optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
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
