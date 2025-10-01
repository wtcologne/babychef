'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Dashboard() {
  const router = useRouter();
  const [ageRange, setAgeRange] = useState<'6-8'|'9-12'|'12-24'|'1-2'|'3-4'|'5+'>('9-12');
  const [available, setAvailable] = useState('');
  const [avoid, setAvoid] = useState('');
  const [image, setImage] = useState<File|null>(null);
  const [out, setOut] = useState<unknown>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      console.log('App: Checking user authentication...');
      
      // First check session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('App: Current session:', session);
      
      // Then check user
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log('App: User check:', { user: user?.email, error });
      
      if (error) {
        console.error('App: Auth error:', error);
        router.push('/login');
        return;
      }
      
      if (!user) {
        console.log('App: No user found, redirecting to login');
        router.push('/login');
      } else {
        console.log('App: User authenticated successfully:', user.email);
      }
    };
    
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('App: Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_OUT' || !session) {
        console.log('App: User signed out, redirecting to login');
        router.push('/login');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function genText() {
    try {
      console.log('Generating recipe...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOut({ error: 'Not logged in' });
        return;
      }
      
      const res = await fetch('/api/recipes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageRange,
          available: available.split(',').map(s=>s.trim()).filter(Boolean),
          avoid: avoid.split(',').map(s=>s.trim()).filter(Boolean),
          userId: user.id
        })
      });
      
      const data = await res.json();
      console.log('Recipe generation response:', data);
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        console.error('API Error details:', data);
        throw new Error(data.details || data.error || 'Failed to generate recipe');
      }
      
      setOut(data);
        } catch (error: unknown) {
          console.error('Recipe generation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setOut({ error: errorMessage });
        }
  }


  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dein BabyChef
            </h1>
            <p className="text-gray-600 mt-2">Erstelle personalisierte Rezepte für dein Baby</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white/50 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          >
            Abmelden
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Altersgruppe</label>
              <select 
                value={ageRange} 
                onChange={e=>setAgeRange(e.target.value as any)} 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 text-black"
              >
                <option value="6-8">6–8 Monate</option>
                <option value="9-12">9–12 Monate</option>
                <option value="12-24">12–24 Monate</option>
                <option value="1-2">1–2 Jahre</option>
                <option value="3-4">3–4 Jahre</option>
                <option value="5+">5+ Jahre</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Vorhandene Zutaten</label>
              
              {/* Gemüse-Buttons */}
              <div className="flex flex-wrap gap-2 mb-2">
                {[
                  { name: 'Kartoffel', emoji: '🥔' },
                  { name: 'Möhre', emoji: '🥕' },
                  { name: 'Zucchini', emoji: '🥒' },
                  { name: 'Apfel', emoji: '🍎' },
                  { name: 'Brokkoli', emoji: '🥦' },
                  { name: 'Tomate', emoji: '🍅' }
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      const current = available.trim();
                      const newValue = current 
                        ? `${current}, ${item.name}` 
                        : item.name;
                      setAvailable(newValue);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/70 hover:bg-white border border-gray-200 hover:border-blue-300 transition-all duration-200 text-2xl hover:scale-105"
                    title={item.name}
                  >
                    {item.emoji}
                  </button>
                ))}
                
                {/* Clear Button */}
                <button
                  type="button"
                  onClick={() => setAvailable('')}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200 text-lg hover:scale-105"
                  title="Alle Zutaten löschen"
                >
                  🗑️
                </button>
              </div>
              
              <input 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 text-black" 
                placeholder="z.B. Karotte, Kartoffel, Brokkoli" 
                value={available} 
                onChange={e=>setAvailable(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-black">Zu vermeiden (Allergene)</label>
              <input 
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50 text-black" 
                placeholder="z.B. Nüsse, Honig, Gluten" 
                value={avoid} 
                onChange={e=>setAvoid(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={genText} 
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200"
            >
              🍲 Rezept generieren
            </button>
            
            <div className="flex gap-2">
              <input 
                type="file" 
                accept="image/*" 
                onChange={e=>setImage(e.target.files?.[0]??null)}
                className="hidden"
                id="photo-upload"
              />
              <label 
                htmlFor="photo-upload"
                className="px-4 py-3 rounded-2xl bg-white text-gray-700 font-semibold shadow-lg hover:shadow-xl border border-gray-200 hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                📸 Foto
              </label>
            </div>
          </div>
        </div>
      </div>
      {out && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          {(out as { error?: string }).error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center space-x-2 text-red-700">
                <span className="text-2xl">⚠️</span>
                <div>
                  <strong className="font-semibold">Fehler:</strong>
                  <p className="text-sm mt-1">{(out as { error: string }).error}</p>
                </div>
              </div>
            </div>
          ) : (out as { recipe?: unknown }).recipe ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">{(out as { recipe: { title: string } }).recipe.title}</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                      <span className="mr-2">🥕</span> Zutaten
                    </h4>
                    <ul className="space-y-2">
                      {((out as { recipe: { ingredients: Array<{name: string; qty: number | null; unit: string | null}> } }).recipe.ingredients || []).map((ing, i: number) => (
                        <li key={i} className="flex items-center text-gray-700">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                          <span>
                            {ing.qty && ing.unit ? `${ing.qty} ${ing.unit} ` : ''}{ing.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {((out as { recipe: { allergens?: string[] } }).recipe.allergens || []).length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                      <h4 className="font-semibold text-orange-800 text-sm mb-2 flex items-center">
                        <span className="mr-2">⚠️</span> Allergene
                      </h4>
                      <p className="text-sm text-orange-700">{((out as { recipe: { allergens: string[] } }).recipe.allergens || []).join(', ')}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                      <span className="mr-2">👨‍🍳</span> Zubereitung
                    </h4>
                    <ol className="space-y-3">
                      {((out as { recipe: { steps: string[] } }).recipe.steps || []).map((step: string, i: number) => (
                        <li key={i} className="flex items-start text-gray-700">
                          <span className="bg-green-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {(out as { recipe: { notes?: string } }).recipe.notes && (
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                      <h4 className="font-semibold text-purple-800 text-sm mb-2 flex items-center">
                        <span className="mr-2">💡</span> Hinweise
                      </h4>
                      <p className="text-sm text-purple-700">{(out as { recipe: { notes: string } }).recipe.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-6">
              <pre className="overflow-auto text-sm text-gray-700 font-mono">{JSON.stringify(out, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-gray-500">Kein zugesetzter Zucker/Salz; beachte altersgerechte Konsistenz. Im Zweifel Fachpersonal fragen.</p>
    </main>
  );
}
