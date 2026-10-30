import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { DeviceCapabilities } from "@/components/vybe/device-capabilities";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "VYBE: find someone on your wavelength", template: "%s · VYBE" },
  description:
    "Discover someone's world before their face. Anonymous, interest-first friendship, dating and community for adults in Sydney.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0d0b17",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`dark ${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <DeviceCapabilities />
        {children}
      </body>
    </html>
  );
}
