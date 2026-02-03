import type { Metadata } from "next";
import { Outfit, Fraunces } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "UniBench - University Analytics Platform",
  description: "Enterprise-grade analytics platform for university portfolio and benchmark analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const metabaseUrl = process.env.NEXT_PUBLIC_METABASE_URL || "http://localhost:3001";
  
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans`}>
        {/* Metabase Embed Script */}
        {metabaseUrl && (
          <>
            <Script
              id="metabase-config"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  function defineMetabaseConfig(config) {
                    window.metabaseConfig = config;
                  }
                `,
              }}
            />
            <Script
              src={`${metabaseUrl}/app/embed.js`}
              strategy="lazyOnload"
            />
          </>
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
