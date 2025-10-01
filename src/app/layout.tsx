import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'BabyChef', description: 'Rezepte für Babys & Kleinkinder' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 font-sans">{children}</body>
    </html>
  );
}
