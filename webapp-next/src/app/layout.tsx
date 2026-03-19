import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import { AuthProvider } from '@/context/auth-context';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fitbites.app'),
  title: {
    default: 'FitBites – Free AI Calorie Tracker | Simple as Taking Notes',
    template: '%s | FitBites',
  },
  description:
    'FitBites is a free, open-source AI food analyzer and calorie tracker. No accounts, no subscriptions — just type your meal and get instant nutrition insights.',
  keywords: [
    'free AI calorie tracker',
    'open source calorie tracker',
    'simple calorie tracker',
    'AI food analyzer free',
    'calorie tracker like notes app',
    'FitBites app',
    'minimalist food diary app',
    'no-frills calorie counter',
    'macro tracker free',
    'calorie tracker for students India',
    'MyFitnessPal alternative free',
    'Cal AI alternative open source',
    'how many calories in dal makhani',
    'calorie tracker for intermittent fasting',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fitbites.app',
    siteName: 'FitBites',
    title: 'FitBites – Free AI Calorie Tracker | Simple as Taking Notes',
    description:
      'The simplest calorie tracker ever. Type your meal, get instant AI nutrition analysis. 100% free and open source.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FitBites – Free AI Calorie Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitBites – Free AI Calorie Tracker',
    description:
      'Log meals as easily as writing notes. AI-powered calorie tracking, 100% free and open source.',
    images: ['/og-image.png'],
  },
  icons: { icon: '/icon.png', apple: '/icon.png' },
  alternates: { canonical: 'https://fitbites.app' },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <head>
        <meta name="google-site-verification" content="fbUUp515Jhl1jDm30uz9Pmkbu45cr6jzbtEGF8dfB6M" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'FitBites',
              operatingSystem: 'Android',
              applicationCategory: 'HealthApplication',
              description:
                'Free, open-source AI calorie tracker and food analyzer. Log meals like notes and get instant nutrition insights.',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '150',
              },
              author: {
                '@type': 'Organization',
                name: 'FitBites',
                url: 'https://github.com/huamanraj/FitBites-app',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Is FitBites free?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes! FitBites is 100% free with no subscriptions, no ads, and no hidden charges. It is also fully open source.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How does FitBites analyze food?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'FitBites uses AI to instantly analyze your food descriptions. Just type what you ate naturally, like "1 roti" or "100g rice", and the AI calculates calories, protein, carbs, and fat.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Do I need to create an account?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, you need an email to sign up so your data is saved securely in the cloud and synced across devices. There is no social login or complex onboarding.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How is FitBites different from MyFitnessPal?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'FitBites is simpler, free, and open source. There is no barcode scanning, no premium tiers, and no clutter. You just type what you ate and the AI handles the rest. It works like a notes app for food.',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
