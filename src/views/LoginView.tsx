import React, { useState } from 'react';
import { Package, Truck, ShieldCheck, Mail, Lock, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

interface LoginViewProps {
  onLogin: (user: any) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('merchant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const user = await res.json();
      onLogin(user);
    } catch (err) {
      setError('Connexion impossible. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'merchant' as UserRole, label: 'Marchand', icon: <Package size={15} /> },
    { id: 'courier' as UserRole, label: 'Livreur',  icon: <Truck size={15} /> },
    { id: 'admin'   as UserRole, label: 'Admin',    icon: <LayoutDashboard size={15} /> },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-3xl shadow-xl shadow-emerald-600/20 mb-6">
            <Package className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-2">e-Colis</h1>
          <p className="text-zinc-500 font-medium">Gestion intelligente des livraisons.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl shadow-zinc-200/50"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection du rôle */}
            <div className="flex p-1 bg-zinc-100 rounded-2xl gap-1">
              {roles.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    role === r.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-sm"
                    placeholder="••••••••"
                    defaultValue="password"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <button
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-400 font-medium flex items-center justify-center gap-2">
              <ShieldCheck size={14} />
              Authentification sécurisée
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { email: 'marc@boutique.fr', role: 'Marchand' },
                { email: 'karim@livreur.fr', role: 'Livreur' },
                { email: 'admin@ecolis.fr',  role: 'Admin' },
              ].map(d => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setRole(d.role === 'Marchand' ? 'merchant' : d.role === 'Livreur' ? 'courier' : 'admin');
                  }}
                  className="p-2 bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-200 rounded-xl transition-all"
                >
                  <p className="text-[10px] font-bold text-zinc-500">{d.role}</p>
                  <p className="text-[9px] text-zinc-400 truncate">{d.email.split('@')[0]}</p>
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] text-zinc-400 mt-2">Cliquez pour remplir un compte de démo</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginView;
