import './globals.css';

export const metadata = {
  title: 'ZENITH LIVE — Global Connect, Dating & Live Play',
  description: 'Real-life global dating, live voice/video calls, interactive games & VIP rooms.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#06060c] text-white antialiased">{children}</body>
    </html>
  );
}
