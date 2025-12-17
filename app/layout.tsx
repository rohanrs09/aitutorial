import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Voice Tutor - Learn Smarter with AI",
  description: "Transform your learning with AI-powered voice tutoring. Adaptive teaching that understands your emotions and adjusts to your pace.",
  keywords: "AI tutor, voice learning, adaptive education, online learning, GRE prep, programming, economics",
  authors: [{ name: "AI Voice Tutor" }],
  openGraph: {
    title: "AI Voice Tutor - Learn Smarter with AI",
    description: "Transform your learning with AI-powered voice tutoring.",
    type: "website",
  },
};

// Check if Clerk keys are configured
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // If Clerk is not configured, render without authentication
  if (!clerkPubKey) {
    return (
      <html lang="en">
        <body className="antialiased">
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#8b5cf6',
          colorBackground: '#0a0e27',
          colorInputBackground: '#1a1a2e',
          colorInputText: '#ffffff',
        },
        elements: {
          formButtonPrimary: 'bg-primary-500 hover:bg-primary-600',
          card: 'bg-surface-light border border-white/10',
          headerTitle: 'text-white',
          headerSubtitle: 'text-gray-400',
        }
      }}
    >
      <html lang="en">
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
