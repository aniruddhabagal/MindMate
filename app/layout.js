// app/layout.js
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

// ✅ Metadata for SEO and Social Sharing (Next.js 13+ App Router)
export const metadata = {
  title: "MindMate - Your Mental Wellness Companion",
  description:
    "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance.",
  metadataBase: new URL("https://mindmate.aniruddha.fyi"), // 🔁 Replace with your actual domain
  openGraph: {
    title: "MindMate - Your Mental Wellness Companion",
    description:
      "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance.",
    url: "https://mindmate.aniruddha.fyi", // 🔁 Replace with your actual domain
    siteName: "MindMate",
    images: [
      {
        url: "/mindmate_new.png", // 🔁 Place this image in /public
        width: 1200,
        height: 630,
        alt: "MindMate preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MindMate - Your Mental Wellness Companion",
    description:
      "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/mindmate_new.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
