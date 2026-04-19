import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "PropCare CRM", template: "%s | PropCare CRM" },
  description: "Premium Real Estate Customer Care Management System",
  keywords: ["real estate", "CRM", "customer care", "property management"],
  authors: [{ name: "PropCare" }],
  creator: "PropCare CRM",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C9A84C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfairDisplay.variable} dark`}>
      <body className={`${inter.className} antialiased`} style={{ backgroundColor: 'var(--black-950)' }}>
        {children}
      </body>
    </html>
  );
}
