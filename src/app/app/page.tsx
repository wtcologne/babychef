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
  const [out, setOut] = useState<{ error?: string; recipe?: { title: string; ingredients: Array<{name: string; qty: number | null; unit: string | null}>; steps: string[]; allergens?: string[]; notes?: string } } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [uploadedPhotoPath, setUploadedPhotoPath] = useState<string | null>(null);

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

  // Compress image to reduce storage size
  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Max dimensions
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = (height * MAX_WIDTH) / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = (width * MAX_HEIGHT) / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression (0.7 quality)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  async function genText() {
        try {
          setIsGenerating(true);
          setOut(null);
          console.log('Generating recipe...');
          
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            setOut({ error: 'Not logged in' });
            return;
          }
          
          // Check if we have a photo uploaded - use vision API
          if (uploadedPhotoUrl && uploadedPhotoPath) {
            console.log('Using photo for recipe generation:', uploadedPhotoUrl);
            
            const res = await fetch('/api/recipes/from-photo', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ageRange,
                imagePublicUrl: uploadedPhotoUrl,
                storagePath: uploadedPhotoPath,
                userId: user.id
              })
            });
            
            const data = await res.json();
            console.log('Vision API response:', data);
            
            if (!res.ok) {
              throw new Error(data.error || 'Foto-Analyse fehlgeschlagen');
            }
            
            // Show first recipe proposal
            if (data.proposals && data.proposals.length > 0) {
              setOut({ recipe: data.proposals[0] });
            } else {
              setOut({ error: 'Keine Rezepte gefunden' });
            }
            
            // Schedule photo deletion after 1 hour
            if (uploadedPhotoPath) {
              setTimeout(async () => {
                try {
                  await supabase.storage
                    .from('fridge-photos')
                    .remove([uploadedPhotoPath]);
                  console.log('Photo automatically deleted after 1 hour');
                } catch (error) {
                  console.error('Failed to auto-delete photo:', error);
                }
              }, 60 * 60 * 1000); // 1 hour in milliseconds
            }
          } else {
            // Use text-based generation
            console.log('Using text-based recipe generation');
            
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
          }
        } catch (error: unknown) {
          console.error('Recipe generation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setOut({ error: errorMessage });
        } finally {
          setIsGenerating(false);
        }
  }

  async function handlePhotoCapture() {
    try {
      setIsUploadingPhoto(true);
      
      // Create file input for camera
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use back camera on mobile
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          setIsUploadingPhoto(false);
          return;
        }
        
        // Compress image before upload
        const compressedFile = await compressImage(file);
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(compressedFile);
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setOut({ error: 'Not logged in' });
          setIsUploadingPhoto(false);
          return;
        }
        
        // Upload to Supabase Storage
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('fridge-photos')
          .upload(fileName, compressedFile);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          setOut({ error: `Upload fehlgeschlagen: ${uploadError.message}` });
          setIsUploadingPhoto(false);
          return;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('fridge-photos')
          .getPublicUrl(fileName);
        
        console.log('Photo uploaded successfully:', publicUrl);
        
        // Store URL and path for later use
        setUploadedPhotoUrl(publicUrl);
        setUploadedPhotoPath(fileName);
        
        setIsUploadingPhoto(false);
      };
      
      input.click();
    } catch (error: unknown) {
      console.error('Photo capture error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setOut({ error: errorMessage });
      setIsUploadingPhoto(false);
    }
  }


  return (
    <main className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BabyChef
            </h1>
            <p className="text-gray-600 mt-2">Erstelle personalisierte Rezepte für dein Baby</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-2xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 active:scale-95 shadow-sm hover:shadow transition-all duration-150 touch-manipulation select-none"
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
                onChange={e=>setAgeRange(e.target.value as '6-8'|'9-12'|'12-24'|'1-2'|'3-4'|'5+')} 
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
                  { name: 'Tomate', emoji: '🍅' },
                  { name: 'Banane', emoji: '🍌' }
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
                    className="px-3 py-2 rounded-xl bg-white/70 hover:bg-white border border-gray-200 hover:border-blue-300 transition-all duration-150 text-2xl hover:scale-105 active:scale-95 active:bg-blue-100 touch-manipulation select-none"
                    title={item.name}
                  >
                    {item.emoji}
                  </button>
                ))}
                
                {/* Clear Button */}
                <button
                  type="button"
                  onClick={() => setAvailable('')}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-150 text-lg hover:scale-105 active:scale-95 active:bg-red-200 touch-manipulation select-none"
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
              disabled={isGenerating || isUploadingPhoto}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isGenerating ? '⏳ Lädt...' : '🍲 Rezept generieren'}
            </button>
            
            <button 
              onClick={handlePhotoCapture}
              disabled={isGenerating || isUploadingPhoto}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isUploadingPhoto ? '⏳ Lädt...' : '📸 Foto aufnehmen'}
            </button>
          </div>
          
          {photoPreview && (
            <div className="mt-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <span className="text-2xl">✅</span>
                  <div>
                    <strong className="font-semibold">Foto hochgeladen!</strong>
                    <p className="text-sm mt-1">
                      Klicke auf &quot;Rezept generieren&quot; um ein Rezept aus dem Foto zu erstellen. 
                      Du kannst auch noch Allergene angeben.
                    </p>
                  </div>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={photoPreview} 
                alt="Vorschau" 
                className="w-full max-w-md rounded-2xl shadow-lg border-2 border-gray-200 mx-auto"
              />
              <button
                onClick={() => {
                  setPhotoPreview(null);
                  setUploadedPhotoUrl(null);
                  setUploadedPhotoPath(null);
                }}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 active:bg-red-200 transition-all duration-150 touch-manipulation select-none"
              >
                🗑️ Foto entfernen
              </button>
            </div>
          )}
        </div>
      </div>
      {out && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
          {out.error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center space-x-2 text-red-700">
                <span className="text-2xl">⚠️</span>
                <div>
                  <strong className="font-semibold">Fehler:</strong>
                  <p className="text-sm mt-1">{out.error}</p>
                </div>
              </div>
            </div>
          ) : out.recipe ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">{out.recipe.title}</h3>
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                      <span className="mr-2">🥕</span> Zutaten
                    </h4>
                    <ul className="space-y-2">
                      {(out.recipe.ingredients || []).map((ing, i: number) => (
                        <li key={i} className="flex items-center text-gray-700">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                          <span>
                            {ing.qty && ing.unit ? `${ing.qty} ${ing.unit} ` : ''}{ing.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {(out.recipe.allergens || []).length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                      <h4 className="font-semibold text-orange-800 text-sm mb-2 flex items-center">
                        <span className="mr-2">⚠️</span> Allergene
                      </h4>
                      <p className="text-sm text-orange-700">{(out.recipe.allergens || []).join(', ')}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                      <span className="mr-2">👨‍🍳</span> Zubereitung
                    </h4>
                    <ol className="space-y-3">
                      {(out.recipe.steps || []).map((step: string, i: number) => (
                        <li key={i} className="flex items-start text-gray-700">
                          <span className="bg-green-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  {out.recipe.notes && (
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                      <h4 className="font-semibold text-purple-800 text-sm mb-2 flex items-center">
                        <span className="mr-2">💡</span> Hinweise
                      </h4>
                      <p className="text-sm text-purple-700">{out.recipe.notes}</p>
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
