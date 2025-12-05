import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ModelMagic - AI-Powered Product Photography',
    template: '%s | ModelMagic',
  },
  description: 'Transform your flat-lay product photos into stunning model shots with AI',
  keywords: ['product photography', 'AI photography', 'e-commerce', 'model shots'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
