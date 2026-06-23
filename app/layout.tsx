import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import SmoothScroll from "./components/SmoothScroll";
import ScrollProgress from "./components/ScrollProgress";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jnsconsulting.ai"),
  title: {
    default: "JNS Consulting — Smart Solutions, Built for You.",
    template: "%s · JNS Consulting",
  },
  description:
    "Custom KPI dashboards, CRM workflows, AI automations, growth tracking, and security systems for small businesses ready to operate with clarity.",
  openGraph: {
    title: "JNS Consulting",
    description:
      "Smart Solutions, Built for You. Custom business-performance command centers for small businesses.",
    url: "https://jnsconsulting.ai",
    siteName: "JNS Consulting",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "JNS Consulting",
    description:
      "Custom KPI dashboards, CRM workflows, AI automations, growth tracking, and security systems for small businesses.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-navy">
        <SmoothScroll />
        <ScrollProgress />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
