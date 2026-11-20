export const metadata = {
  title: 'Zenith Live — Global Connect, Dating & Live Play',
  description: 'Real-life global dating, live voice/video calls, interactive games, and VIP rooms.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://tailwindcss.com"></script>
      </head>
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
