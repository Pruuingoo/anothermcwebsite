import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: { default: "Your Server | Minecraft Website Template", template: "%s | Your Server" },
  description: "A responsive starter website for a Minecraft server.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Your Server | Minecraft Website Template",
    description: "A responsive starter website for a Minecraft server.",
    images: ["/server-placeholder.svg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
