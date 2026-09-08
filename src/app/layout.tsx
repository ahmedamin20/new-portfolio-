import type { Metadata } from 'next'
import './globals.css'
import '../lib/firebase'
import ClientProtection from './ClientProtection'

const SITE_URL = 'https://ahmedamin.tech'
const SITE_TITLE = 'Ahmed Amin | Full-Stack Software Engineer'
const SITE_DESCRIPTION =
  'Ahmed Amin is a full-stack software engineer building fast, modern web applications with Next.js, React, TypeScript and AI-driven automation. Explore projects, tech stack and get in touch.'

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | Ahmed Amin',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Ahmed Amin',
    'Full-Stack Developer',
    'Software Engineer',
    'Next.js Developer',
    'React Developer',
    'TypeScript Developer',
    'Frontend Engineer',
    'Web Developer Egypt',
    'Software Engineer Giza',
    'AI Automation Engineer',
    'Portfolio',
  ],
  authors: [{ name: 'Ahmed Amin', url: SITE_URL }],
  creator: 'Ahmed Amin',
  publisher: 'Ahmed Amin',
  applicationName: 'Ahmed Amin Portfolio',
  category: 'technology',
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'profile',
    url: SITE_URL,
    siteName: 'Ahmed Amin Portfolio',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Ahmed Amin',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/icon-512.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Content Security Policy — defense-in-depth against XSS */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://firebasestorage.googleapis.com https://www.gstatic.com https://images.unsplash.com https://res.cloudinary.com https://cdn.simpleicons.org; media-src 'self' https://firebasestorage.googleapis.com https://*.firebasestorage.app https://res.cloudinary.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://images.unsplash.com; frame-src https://accounts.google.com https://*.firebaseapp.com; base-uri 'self';"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;500;600;700;800&family=Permanent+Marker&family=Caveat:wght@400;500;600;700&family=Kalam:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Ahmed Amin',
              url: SITE_URL,
              jobTitle: 'Software Engineer',
              description: SITE_DESCRIPTION,
              image: `${SITE_URL}/icon-512.png`,
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Giza',
                addressCountry: 'EG',
              },
              sameAs: [],
            }),
          }}
        />
      </head>
      <body>
        <ClientProtection />
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
