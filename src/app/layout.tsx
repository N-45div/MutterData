import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexProvider } from "./providers/ConvexProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MutterData - Voice-Controlled Data Analytics",
  description: "Transform how you analyze data with voice commands. Upload Excel/CSV files and have natural conversations with your data.",
  keywords: ["voice analytics", "data visualization", "AI", "conversational BI", "Excel", "CSV"],
  authors: [{ name: "MutterData Team" }],
  openGraph: {
    title: "MutterData - Voice-Controlled Data Analytics",
    description: "Transform how you analyze data with voice commands",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 min-h-screen w-full`}
      >
        <ConvexProvider>
          {children}
        </ConvexProvider>
      </body>
    </html>
  );
}
