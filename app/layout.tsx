import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.APP_URL ?? "http://localhost:3000";
const SITE_NAME = "KeepMyMotivation";
const DESCRIPTION =
  "Personalized motivational emails delivered daily, weekly, or monthly. Tell us your goal — we turn it into a motivational newsletter with AI-curated words and imagery to keep you on track.";

const KEYWORDS = [
  "motivational emails",
  "daily motivation",
  "motivation newsletter",
  "auto motivation",
  "goal tracking",
  "habit motivation",
  "self improvement emails",
  "personal growth newsletter",
  "motivational email subscription",
  "inspirational emails",
  "daily inspiration",
  "AI motivation",
  "personalized motivation",
  "email reminder",
  "motivation app",
  "stay motivated",
  "goal setting",
  "fitness motivation",
  "career motivation",
  "habit building",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — personalized motivational emails on your schedule`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Productivity",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — personalized motivational emails on your schedule`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — personalized motivational emails`,
    description: DESCRIPTION,
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#07070b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      description: DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      operatingSystem: "Web",
      applicationCategory: "LifestyleApplication",
      description: DESCRIPTION,
      offers: [
        {
          "@type": "Offer",
          name: "Spark",
          description: "1 motivational email per month",
          price: "0",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Boost",
          description: "1 motivational email per week",
          price: "1",
          priceCurrency: "USD",
        },
        {
          "@type": "Offer",
          name: "Drive",
          description: "1 motivational email per day",
          price: "5",
          priceCurrency: "USD",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is KeepMyMotivation?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KeepMyMotivation is a motivational email service that sends AI-personalized messages on your chosen schedule to help you stay on track with any goal.",
          },
        },
        {
          "@type": "Question",
          name: "How often will I receive emails?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Choose from three plans: Spark (free, monthly), Boost ($1/month, weekly), or Drive ($5/month, daily).",
          },
        },
        {
          "@type": "Question",
          name: "Are the emails AI-generated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. We use AI to tailor each motivational email to your specific goal, preferred tone, and motivational angle, paired with relevant imagery.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
