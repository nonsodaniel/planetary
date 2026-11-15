import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Planetary — Climate Decision Engine",
  description:
    "Simulate the 10-year downstream effects of any climate intervention using NVIDIA Cosmos + NIM. Rate investments by actual climate impact, not marketing claims.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Planetary — Climate Decision Engine",
    description:
      "Verify any climate project using real physics. NVIDIA Cosmos + NIM simulates 10-year impact and flags greenwashing.",
    type: "website",
    siteName: "Planetary",
  },
  twitter: {
    card: "summary_large_image",
    title: "Planetary — Climate Decision Engine",
    description:
      "Verify any climate project using real physics. NVIDIA Cosmos + NIM simulates 10-year impact and flags greenwashing.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        // Browser extensions (e.g. ColorZilla's cz-shortcut-listen) inject attributes
        // into <body> before React hydrates; ignore those attribute mismatches.
        suppressHydrationWarning
        className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
