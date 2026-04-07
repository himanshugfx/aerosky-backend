import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { validateEnvironment } from '@/lib/env-validator'

const outfit = Outfit({ subsets: ['latin'] })

// Validate environment on startup
if (typeof window === 'undefined') {
  validateEnvironment();
}

export const metadata: Metadata = {
    title: 'AeroSys Aviation India - Drone Compliance Platform',
    description: 'DGCA Regulatory Compliance Engine for Drone Operations',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={outfit.className}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
