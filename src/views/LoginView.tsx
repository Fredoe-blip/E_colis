import React, { useState } from 'react';
import { Package, Truck, ShieldCheck, Mail, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

interface LoginViewProps {
  onLogin: (user: any) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('merchant');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const user = await res.json();
      onLogin(user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-3xl shadow-xl shadow-emerald-600/20 mb-6">
            <Package className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-2">e-Colis</h1>
          <p className="text-zinc-500 font-medium">Smart delivery management for the modern world.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-xl shadow-zinc-200/50"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex p-1 bg-zinc-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  role === 'merchant' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Package size={16} />
                Merchant
              </button>
              <button
                type="button"
                onClick={() => setRole('courier')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  role === 'courier' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Truck size={16} />
                Courier
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="email"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="password"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                    defaultValue="password"
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-zinc-900/10 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-400 font-medium flex items-center justify-center gap-2">
              <ShieldCheck size={14} />
              Secure Enterprise Authentication
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginView;
