import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  "Schedule any recurring email and let AI write it. Describe what you want — news recap, study drill, motivational nudge, recipe idea — delivered daily, weekly, or monthly in your timezone.";

const KEYWORDS = [
  "scheduled emails",
  "recurring email",
  "AI email",
  "personal newsletter",
  "automated emails",
  "daily reminder",
  "weekly digest",
  "monthly summary",
  "AI newsletter",
  "personalized email",
  "email automation",
  "scheduled newsletter",
  "habit reminders",
  "study reminders",
  "motivational emails",
  "daily learning email",
  "AI inbox assistant",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — schedule any email, written by AI`,
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
    title: `${SITE_NAME} — schedule any email, written by AI`,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — schedule any email, written by AI`,
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
      offers: {
        "@type": "Offer",
        name: "Pro",
        description:
          "7-day free trial, then full access: daily, weekly, and monthly emails with unlimited schedules",
        price: "5",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is KeepMyMotivation?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KeepMyMotivation is a scheduled-email service. Describe any recurring email you want and AI writes and delivers it on a daily, weekly, or monthly cadence.",
          },
        },
        {
          "@type": "Question",
          name: "How often will I receive emails?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Start with a 7-day free trial, then $5/month for full access — daily, weekly, or monthly emails with unlimited schedules.",
          },
        },
        {
          "@type": "Question",
          name: "Are the emails AI-generated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Each email is generated from scratch against your prompt and brief, so it stays relevant across sends.",
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
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "wnfmq63ub6");`}
        </Script>
      </body>
    </html>
  );
}
