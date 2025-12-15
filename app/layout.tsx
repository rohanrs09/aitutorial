import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Voice Tutor - Interactive Learning",
  description: "Learn with AI-powered voice tutoring. Adaptive teaching for Economics, DSA, Aptitude, GRE, and Programming.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
