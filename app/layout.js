export const metadata = {
  title: 'ZENITH LIVE — Global Connect, Dating & Live Play',
  description: 'Real-life global dating, live voice/video calls, interactive games & VIP rooms.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://tailwindcss.com"></script>
        <style>{`
          body { background-color: #06060c !important; color: #f8fafc !important; font-family: system-ui, -apple-system, sans-serif; }
          .zenith-card { background: linear-gradient(145deg, #10101e, #0a0a14); border: 1px solid rgba(245, 158, 11, 0.22); }
          .zenith-gold { background: linear-gradient(135deg, #f59e0b, #d97706, #b45309); color: #06060c; }
          .zenith-royal { background: linear-gradient(135deg, #c026d3, #7c3aed); color: #ffffff; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
