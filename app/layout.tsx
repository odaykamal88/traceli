import { Analytics } from '@vercel/analytics/next'
import { AuthKitProvider } from '@workos-inc/authkit-nextjs/components'
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { isWorkOSConfigured } from '@/lib/workspace-access'
import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-plex-sans',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-newsreader',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://trace-li.com'),
  title: {
    default: 'Traceli — Prove the award before you sign it',
    template: '%s — Traceli',
  },
  description:
    'Award assurance for donor-funded procurement: connect governing rules, supplier evidence, human judgment and approvals before sign-off.',
  openGraph: {
    type: 'website',
    title: 'Traceli — Prove the award before you sign it',
    description: 'Award assurance for donor-funded procurement.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Traceli — Prove the award before you sign it',
    description: 'Award assurance for donor-funded procurement.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4efe4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const content = isWorkOSConfigured() ? (
    <AuthKitProvider>{children}</AuthKitProvider>
  ) : (
    children
  )

  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable}`}>
      <body className="font-sans antialiased">
        {content}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
