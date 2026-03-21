import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexWithSupabaseProvider } from "../providers/ConvexWithSupabaseProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acadowl - School Management Platform",
  description: "Multi-tenant school management platform for Zambian educational institutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:left-4 focus:top-4 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <ConvexWithSupabaseProvider>
          {children}
        </ConvexWithSupabaseProvider>
      </body>
    </html>
  );
}
