import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Craft Market Chat Demo | Stream Integration',
  description: 'Marketplace buyer-seller chat with support escalation to Zendesk',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
