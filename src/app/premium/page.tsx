export default function Premium() {
  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          ✨ Premium
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Erweitere deine BabyChef-Erfahrung mit KI-gestützter Fotoanalyse
        </p>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900">Was du mit Premium bekommst:</h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📸</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Fotoanalyse</h3>
                    <p className="text-sm text-gray-600">Mache ein Foto deines Kühlschranks und lass die KI Rezepte vorschlagen</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Erweiterte KI</h3>
                    <p className="text-sm text-gray-600">Zugang zu den neuesten KI-Modellen für bessere Rezepte</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Prioritäts-Support</h3>
                    <p className="text-sm text-gray-600">Schnellere Antworten und persönlicher Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-purple-600">€9.99</div>
                <div className="text-gray-600">pro Monat</div>
                
                <form action="/api/checkout" method="POST">
                  <button className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200">
                    🚀 Jetzt upgraden
                  </button>
                </form>
                
                <p className="text-xs text-gray-500">
                  Monatlich kündbar. Nach Zahlung wird dein Account automatisch freigeschaltet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
