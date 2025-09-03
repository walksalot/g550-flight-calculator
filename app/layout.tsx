import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "G550 Flight Calculator",
  description: "Calculate precise flight times and fuel requirements for your Gulfstream G550 across 4,090 airports worldwide",
  keywords: "Gulfstream G550, flight calculator, aviation, flight planning, fuel calculation, business jet",
  authors: [{ name: "Built with AI" }],
  openGraph: {
    title: "G550 Flight Calculator",
    description: "Calculate precise flight times and fuel requirements for your Gulfstream G550",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
