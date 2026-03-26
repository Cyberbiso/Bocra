import type { Metadata } from "next";
import { Inter, Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "./providers";
import FooterConditional from "@/components/FooterConditional";
import NavbarConditional from "@/components/NavbarConditional";
import ChatbotConditional from "@/components/ChatbotConditional";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOCRA | Botswana Communications Regulatory Authority",
  description: "Official portal for Botswana Communications Regulatory Authority",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, outfit.variable, "font-sans", geist.variable)}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full font-sans bg-[#FAFCFF] text-gray-900 selection:bg-[#00AEEE]/30 selection:text-[#004b87]">
        <Providers>
          <div className="flex min-h-full flex-col">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:bg-[#06193e] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold"
            >
              Skip to main content
            </a>
            <NavbarConditional />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <ChatbotConditional />
            <FooterConditional />
          </div>
        </Providers>
      </body>
    </html>
  );
}
