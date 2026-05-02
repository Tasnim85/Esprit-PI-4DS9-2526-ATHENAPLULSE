import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Athena Pulse | Laboratoires Vital',
  description: 'Plateforme intelligente IA pour les délégués médicaux, médecins et pharmaciens.',
  keywords: ['délégué médical', 'IA médicale', 'formation pharmaceutique', 'Vital Labs'],
  authors: [{ name: 'Laboratoires Vital' }],
  openGraph: {
    title: 'Athena Pulse | Laboratoires Vital',
    description: 'Plateforme intelligente IA pour les professionnels de santé.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}