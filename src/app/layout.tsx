import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Planetary — Climate Decision Engine",
  description:
    "Simulate the 10-year downstream effects of any climate intervention using NVIDIA Cosmos + NIM. Rate investments by actual climate impact, not marketing claims.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-zinc-950 text-zinc-100 antialiased`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
