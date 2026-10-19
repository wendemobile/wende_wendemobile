import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Wende Mobile Butajira | Smartphones & AirPods Max / Audio',
  description: 'Wende Mobile Butajira - Premier flagship smartphones, AirPods Max, and retail Point of Sale system in Butajira, Ethiopia.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b10' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Inline script to set the theme class before first paint (prevents dark-mode flash)
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var m = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (!t && m) || t === 'system' && m) {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
