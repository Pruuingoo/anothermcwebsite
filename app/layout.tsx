import type { Metadata } from "next";
import CookieConsent from "@/components/CookieConsent";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  icons: { icon: "/server-placeholder.svg", apple: "/server-placeholder.svg" },
  openGraph: {
    title: `${siteConfig.name} Minecraft Server`,
    description: "Minecraft server website template. Replace the sample details with your own.",
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    images: [{ url: "/server-placeholder.svg", width: 96, height: 96, alt: `${siteConfig.name} placeholder logo` }],
    type: "website",
  },
  twitter: { card: "summary", title: `${siteConfig.name} Minecraft Server`, description: "Minecraft server website template." },
  title: { default: `${siteConfig.name} — Minecraft Server`, template: `%s | ${siteConfig.name}` },
  description: "A Minecraft server website template. Replace the placeholders with your server details.",
};

const stylesheets = [
  "/reference/_next/static/chunks/1bnh8r0-prf7e.css",
  "/reference/_next/static/chunks/1aftstum31ljm.css",
  "/reference/_next/static/chunks/3b7hz_ehdkwtn.css",
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        {stylesheets.map((href) => <link key={href} rel="stylesheet" href={href} />)}
        <link rel="stylesheet" href="/reference/custom.css" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
