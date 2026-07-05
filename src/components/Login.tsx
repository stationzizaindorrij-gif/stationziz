import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, Fuel } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <span className="text-3xl">⛽</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Station ERP Pro</h1>
          <p className="text-blue-100 mt-2 text-sm">Gérez votre station-service dans le cloud</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {isSignUp ? 'Créer un compte' : 'Connexion à votre espace'}
          </h2>
          
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4 border border-rose-100 text-center">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-4 border border-emerald-100 text-center">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="admin@station.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSignUp ? "Créer mon compte" : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              {isSignUp ? "Déjà un compte ? Se connecter" : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
