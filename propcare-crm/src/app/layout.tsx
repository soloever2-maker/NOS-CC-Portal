import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";

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
  title: { default: "Nations of Sky CRM", template: "%s | NOS CRM" },
  description: "Nations of Sky — Customer Care Management System",
  keywords: ["real estate", "CRM", "customer care", "Nations of Sky"],
  authors: [{ name: "Nations of Sky" }],
  creator: "Nations of Sky CRM",
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C9A84C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent flash of unstyled content on theme load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('nos-theme') || 'dark';
                var l = localStorage.getItem('nos-line-mode') === 'true';
                document.documentElement.setAttribute('data-theme', t);
                if (l) document.documentElement.classList.add('line-mode');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfairDisplay.variable} ${inter.className} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
