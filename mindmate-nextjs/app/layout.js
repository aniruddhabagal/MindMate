// app/layout.js
import Head from "next/head"; // For <Head> specific tags if needed inside components
import Script from "next/script"; // For external scripts
import "./globals.css"; // Import your global styles

export const metadata = {
  title: "MindMate - Your Mental Wellness Companion",
  description:
    "MindMate helps you manage stress, reflect on your emotions, and receive positive, supportive guidance.",
  // You can add more metadata here
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {" "}
        {/* Standard HTML head, Next.js handles some tags via metadata */}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* Font Awesome - can also be installed as a package */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {/* Scripts that need to be loaded globally and are not modules */}
        {/* Chart.js - consider loading it only on pages that need it via dynamic import or Script component strategy */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"
          strategy="beforeInteractive"
        />
        {/* Your api.js will be handled differently, likely not as a global script import here */}
        {/* <Script src="/js/api.js" strategy="beforeInteractive" />  <- We'll refactor this */}
        {children} {/* This is where page content will be rendered */}
      </body>
    </html>
  );
}
