'use client';
import { createClient } from '@supabase/supabase-js';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Account erstellt! Du kannst dich jetzt anmelden.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        console.log('Login successful:', data);
        setMessage('Erfolgreich angemeldet! Weiterleitung...');
        
        // Wait a bit for session to be properly set
        setTimeout(async () => {
          console.log('Checking session after login...');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('Current session:', session);
          
          if (session) {
            console.log('Session found, navigating to /app');
            window.location.href = '/app';
          } else {
            console.log('No session found, trying router push');
            router.push('/app');
          }
        }, 1500);
        
        // Also set a flag to show manual link
        setTimeout(() => {
          setMessage('Erfolgreich angemeldet! Falls die Weiterleitung nicht funktioniert, klicke hier: → App öffnen');
        }, 3000);
      }
        } catch (error: unknown) {
          console.error('Auth error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setMessage(errorMessage);
        } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto p-8 space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isSignUp ? 'Account erstellen' : 'Willkommen zurück'}
          </h1>
          <p className="text-gray-600">
            {isSignUp ? 'Erstelle deinen BabyChef Account' : 'Melde dich in deinem Account an'}
          </p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <input 
              type="email" 
              placeholder="dein@email.de" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
            />
            <input 
              type="password" 
              placeholder="Passwort" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-white/50"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transform hover:scale-105 active:scale-95 transition-all duration-150 touch-manipulation select-none"
          >
            {loading ? 'Lädt...' : (isSignUp ? 'Account erstellen' : 'Anmelden')}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-4 rounded-2xl ${message.includes('erstellt') || message.includes('Erfolgreich') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <p className="text-sm">{message}</p>
            {message.includes('Falls die Weiterleitung nicht funktioniert') && (
              <Link href="/app" className="inline-block mt-3 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
                → App öffnen
              </Link>
            )}
          </div>
        )}

        <div className="space-y-3 mt-6">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-xl hover:bg-blue-50 active:bg-blue-100 transition-all duration-150 touch-manipulation select-none"
          >
            {isSignUp ? 'Bereits einen Account? Anmelden' : 'Noch keinen Account? Registrieren'}
          </button>
          <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700 text-center py-2 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 touch-manipulation select-none">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </main>
  );
}
