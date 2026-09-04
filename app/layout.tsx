import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
});

const APP_NAME = "Life — Personal Legacy & Continuity";
const APP_SHORT_NAME = "Life";
const APP_DESCRIPTION =
  "Private personal information, money management, legacy and business continuity system. AES-256 secured vault for your life's most important data.";
const APP_URL = "https://life.app";
const LOGO_URL = "/assets/images/logo.png";
const DEVELOPER_NAME = "ArtistyCode Studio";
const DEVELOPER_URL = "https://www.artistycode.studio/";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s | ${APP_SHORT_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "life",
    "legacy",
    "vault",
    "personal security",
    "continuity",
    "estate planning",
    "password manager",
    "financial ledger",
    "AES-256",
    "PWA",
  ],
  authors: [{ name: DEVELOPER_NAME, url: DEVELOPER_URL }],
  creator: DEVELOPER_NAME,
  publisher: DEVELOPER_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "productivity",
  icons: {
    icon: [
      { url: LOGO_URL, sizes: "any", type: "image/png" },
      { url: LOGO_URL, sizes: "32x32", type: "image/png" },
      { url: LOGO_URL, sizes: "16x16", type: "image/png" },
      { url: LOGO_URL, sizes: "48x48", type: "image/png" },
    ],
    shortcut: [{ url: LOGO_URL, type: "image/png" }],
    apple: [
      { url: LOGO_URL, sizes: "180x180", type: "image/png" },
      { url: LOGO_URL, sizes: "152x152", type: "image/png" },
      { url: LOGO_URL, sizes: "167x167", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: LOGO_URL,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: LOGO_URL,
        width: 1200,
        height: 630,
        alt: APP_NAME,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [LOGO_URL],
    creator: "@lifeapp",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_SHORT_NAME,
    startupImage: [{ url: LOGO_URL }],
  },
  appLinks: {
    web: {
      url: APP_URL,
      should_fallback: true,
    },
  },
  assets: LOGO_URL,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#070a12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} ${dmSerif.variable} font-sans antialiased`}
          suppressHydrationWarning
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
