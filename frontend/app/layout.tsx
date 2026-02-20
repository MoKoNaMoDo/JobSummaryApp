import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Correct import if it was Geist_Mono
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { LanguageProvider } from "@/components/LanguageProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export const metadata: Metadata = {
  title: "Work Log App",
  description: "Track your daily work and expenses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground selection:bg-primary/20 min-h-screen flex flex-col`}
      >
        <LanguageProvider>
          <div className="absolute top-4 right-4 z-50">
            <LanguageSwitcher />
          </div>
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
            {children}
          </main>
          <Navbar />
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
