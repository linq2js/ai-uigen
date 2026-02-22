import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { MobileGuard } from "@/components/MobileGuard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artifex",
  description: "Generate simple React apps with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <MobileGuard>{children}</MobileGuard>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#262626",
              border: "1px solid #404040",
              color: "#f5f5f5",
            },
            classNames: {
              toast: "!opacity-100",
              error: "!bg-[#3b1c1c] !border-red-900/60 !text-red-200",
            },
          }}
        />
      </body>
    </html>
  );
}
