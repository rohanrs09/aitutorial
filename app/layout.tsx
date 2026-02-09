import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0e27',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  title: "AI Voice Tutor - Learn Smarter with AI",
  description: "Transform your learning with AI-powered voice tutoring. Adaptive teaching that understands your emotions and adjusts to your pace.",
  keywords: "AI tutor, voice learning, adaptive education, online learning, GRE prep, programming, economics",
  authors: [{ name: "AI Voice Tutor" }],
  creator: "AI Voice Tutor",
  publisher: "AI Voice Tutor",
  robots: "index, follow",
  openGraph: {
    title: "AI Voice Tutor - Learn Smarter with AI",
    description: "Transform your learning with AI-powered voice tutoring.",
    type: "website",
    locale: "en_US",
    siteName: "AI Voice Tutor",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Voice Tutor - Learn Smarter with AI",
    description: "Transform your learning with AI-powered voice tutoring.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Voice Tutor",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head />
      <body className="antialiased bg-surface min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
