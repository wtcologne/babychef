import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'BabyChef', description: 'Rezepte für Babys & Kleinkinder' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 font-sans">{children}</body>
    </html>
  );
}
