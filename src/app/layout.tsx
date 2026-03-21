import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'AeroSky Aviation India - Drone Compliance Platform',
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
