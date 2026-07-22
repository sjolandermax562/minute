import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MINUTE // 60S SOL ORACLE MARKET",
  description:
    "Sixty-second up/down rounds on the real Pyth SOL/USD print. Fake credits, real oracle, verifiable timestamps.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "MINUTE // 60S SOL ORACLE MARKET",
    description:
      "Sixty-second up/down rounds on the real Pyth SOL/USD print. Fake credits, real oracle, verifiable timestamps.",
    images: [{ url: "/banner.png", width: 1600, height: 900 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MINUTE // 60S SOL ORACLE MARKET",
    description:
      "Sixty-second up/down rounds on the real Pyth SOL/USD print. Fake credits, real oracle, verifiable timestamps.",
    images: ["/banner.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="crt-scanlines crt-flicker">
        <div className="noise-grain" />
        {children}
      </body>
    </html>
  );
}
