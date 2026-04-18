import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { loadSiteConfig, isSiteConfigError } from "@/lib/siteConfig";
import { ConfigFailure } from "@/components/ConfigFailure";
import { Providers } from "@/components/Providers";
import { AppShell } from "@/components/AppShell";
import { isLocalDevelopment, isVercelPreview } from "@/lib/appEnvironment";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await loadSiteConfig();
  if (isSiteConfigError(cfg)) {
    return { title: "Configuration error" };
  }
  return {
    title: cfg.site_name,
    description: cfg.site_subtitle,
  };
}

function bannerKind(): "none" | "staging" | "local" {
  if (isLocalDevelopment()) return "local";
  if (isVercelPreview()) return "staging";
  return "none";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cfg = await loadSiteConfig();

  if (isSiteConfigError(cfg)) {
    return (
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <ConfigFailure failure={cfg} />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <AppShell siteConfig={cfg} bannerKind={bannerKind()}>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
