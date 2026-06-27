import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Platform Console',
    description: 'Wahb Platform Admin Console',
    icons: {
        icon: [
            { url: '/images/wahb_mark_transparent.png', media: '(prefers-color-scheme: light)' },
            { url: '/images/wahb_mark_transparent_dark.png', media: '(prefers-color-scheme: dark)' },
        ],
        apple: '/images/wahb_favicon_white_bg.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
