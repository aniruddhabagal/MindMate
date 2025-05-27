// app/layout.js
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

// ✅ Simplified and Working Metadata (Based on your working example)
export const metadata = {
  title: "MindMate - Your Mental Wellness Companion",
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
  icons: {
    icon: "/mindmate.png", // Simple favicon reference
    apple: "/mindmate.png", // Apple devices
  },
  metadataBase: new URL("https://mindmate.aniruddha.fyi"),
  openGraph: {
    url: "https://mindmate.aniruddha.fyi",
    title: "MindMate - Your Mental Wellness Companion",
    description:
      "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance. Your personal mental wellness companion for a healthier mind.",
    siteName: "MindMate",
    images: [
      {
        url: "/mindmate.png", // Using relative URL like your working example
        width: 1200,
        height: 630,
        alt: "MindMate - Mental Wellness Companion",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MindMate - Your Mental Wellness Companion",
    description:
      "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance.",
    images: ["/mindmate.png"], // Using relative URL
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Keep it simple - minimal additional meta tags */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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
