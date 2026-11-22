import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'ZENITH LIVE — Global Connect, Dating & Live Play',
  description: 'Real-life global dating, live voice/video calls, interactive games & VIP rooms.',
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport = {
  themeColor: '#06060c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#06060c] text-white antialiased">
        <Script src="https://paystack.co" strategy="lazyOnload" />
        {children}
      </body>
    </html>
  );
}
