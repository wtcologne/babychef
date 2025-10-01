import Link from 'next/link';

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/logo.png" 
          alt="BabyChef Logo" 
          className="w-32 h-32 rounded-full mx-auto shadow-2xl object-cover border-4 border-white"
        />
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          AI-Rezepte für Babys & Kleinkinder. Einfach. Sicher. Allergen-Hinweise inklusive.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link 
          href="/login" 
          className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation select-none"
        >
          Loslegen
        </Link>
        <Link 
          href="/premium" 
          className="px-8 py-4 rounded-2xl bg-white text-gray-700 font-semibold text-lg shadow-lg hover:shadow-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 transform hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation select-none"
        >
          Premium
        </Link>
      </div>
      
      <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/20">
        <p className="text-sm text-gray-500 text-center">
          Hinweis: Keine medizinische Beratung. Achte auf altersgerechte Konsistenz.
        </p>
      </div>
    </main>
  );
}