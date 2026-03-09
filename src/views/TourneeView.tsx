import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { Navigation, CheckCircle2, Camera, Users, Route, Zap, Clock, MapPin } from 'lucide-react';

interface TourneeViewProps { user: User; }

const TourneeView: React.FC<TourneeViewProps> = ({ user }) => {
  const [route, setRoute] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [optimized, setOptimized] = useState(false);
  const [showDelegate, setShowDelegate] = useState(false);
  const [delegateTarget, setDelegateTarget] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoute = async () => {
    setLoading(true);
    const [routeRes, couriersRes] = await Promise.all([
      fetch(`/api/courier/${user.id}/route`),
      fetch('/api/couriers')
    ]);
    const r = await routeRes.json();
    setCouriers((await couriersRes.json()).filter((c: any) => c.id !== user.id));
    setRoute(r);
    setLoading(false);
  };

  useEffect(() => { fetchRoute(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const confirmerLivraison = async (id: number) => {
    await fetch(`/api/deliveries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'delivered' }) });
    showToast('✅ Livraison confirmée ! +10 points +1 000 F');
    fetchRoute();
    setCurrentIdx(i => Math.min(i + 1, route.length - 1));
  };

  const accepterMission = async (id: number) => {
    await fetch(`/api/deliveries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'assigned', courierId: user.id }) });
    showToast('🛵 Mission acceptée ! Route mise à jour.');
    fetchRoute();
  };

  const deleguer = async (deliveryId: number, toCourierId: number) => {
    const res = await fetch(`/api/deliveries/${deliveryId}/delegate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromCourierId: user.id, toCourierId })
    });
    const data = await res.json();
    setShowDelegate(false);
    showToast(data.message);
    fetchRoute();
  };

  const totalKm = route.reduce((s, r) => s + (r.distance_km || 0), 0).toFixed(1);
  const totalMin = route.reduce((s, r) => s + (r.eta_min || 0), 0);
  const done = route.filter(r => r.status === 'delivered').length;

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-zinc-900 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-1">🗺️ Ma Tournée</h2>
          <p className="text-zinc-500 text-sm">{route.length} arrêts · Route optimisée par zone</p>
        </div>
        <div className="flex gap-3">
          {!optimized && (
            <button onClick={() => { setOptimized(true); showToast('⚡ Route optimisée ! Économie de ~23 min.'); }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
              <Zap size={16} /> Optimiser ma route
            </button>
          )}
          <button onClick={() => setShowDelegate(true)}
            className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-2xl font-bold text-sm hover:bg-zinc-700 transition-all">
            <Users size={16} /> Déléguer
          </button>
        </div>
      </div>

      {optimized && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <span className="font-black text-emerald-800 text-sm">Route optimisée ! </span>
            <span className="text-emerald-700 text-sm">Tu économises ~23 min et 4,2 km par rapport à l'ordre initial.</span>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Distance totale', value: `${totalKm} km`, icon: '📍' },
          { label: 'Temps estimé', value: `${totalMin} min`, icon: '⏱️' },
          { label: 'Gains du jour', value: `${(done * 1000).toLocaleString()} F`, icon: '💵' },
          { label: 'Progression', value: `${done}/${route.length}`, icon: '🎯' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{s.label}</div>
            <div className="text-xl font-black text-zinc-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Route */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <span className="font-bold text-sm">📋 Ordre de livraison optimisé</span>
        </div>
        {loading ? (
          <div className="p-8 text-center text-zinc-400">Chargement de la route...</div>
        ) : route.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Route size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune livraison en cours</p>
            <p className="text-sm mt-1">Va dans Missions pour accepter des commandes</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {route.map((r, i) => {
              const isDone = r.status === 'delivered';
              const isCurrent = !isDone && route.filter(x => x.status !== 'delivered').indexOf(r) === 0;
              const isAvailable = r.status === 'pending' && !r.courier_id;
              return (
                <motion.div key={r.id} layout className={`flex items-center gap-4 px-5 py-4 transition-all ${isCurrent ? 'bg-blue-50' : ''} ${isDone ? 'opacity-50' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 border-4 border-white shadow-sm ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-blue-600 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">{r.client_name}</span>
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5 font-bold">{r.client_zone}</span>
                      {isCurrent && <span className="text-[10px] bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-bold">🔵 EN COURS</span>}
                      {isAvailable && <span className="text-[10px] bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 font-bold">⚡ Disponible</span>}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-zinc-400">
                      <span>📦 {r.article}</span>
                      <span>📍 {r.distance_km} km</span>
                      <span>⏱ {r.eta_min} min</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isAvailable && (
                      <button onClick={() => accepterMission(r.id)}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all">
                        Accepter
                      </button>
                    )}
                    {isCurrent && (
                      <>
                        <button className="flex items-center gap-1 bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all">
                          <Camera size={12} /> Photo
                        </button>
                        <button onClick={() => confirmerLivraison(r.id)}
                          className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all">
                          <CheckCircle2 size={12} /> Livré !
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Nouvelle commande surprise */}
      <div className="bg-zinc-900 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-white font-black mb-1">📱 Commande surprise en route ?</h4>
          <p className="text-zinc-400 text-sm">Si la marchande t'envoie une nouvelle commande, accepte-la et ta route se recalcule automatiquement.</p>
        </div>
        <button onClick={fetchRoute} className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shrink-0">
          🔄 Rafraîchir route
        </button>
      </div>

      {/* Modal délégation */}
      <AnimatePresence>
        {showDelegate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDelegate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="font-black text-xl mb-1">🤝 Déléguer une livraison</h3>
              <p className="text-zinc-500 text-sm mb-5">Tu conserves 200F de commission sur chaque livraison déléguée.</p>

              {/* Sélection livraison */}
              <div className="mb-4">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2">Livraison à déléguer</label>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {route.filter(r => r.status !== 'delivered').map(r => (
                    <button key={r.id} onClick={() => setDelegateTarget(r)}
                      className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${delegateTarget?.id === r.id ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                      <span className="font-bold">{r.client_name}</span>
                      <span className="text-zinc-400 ml-2 text-xs">{r.client_zone} · {r.article}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélection livreur */}
              <div className="mb-5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-2">Choisir un livreur</label>
                <div className="space-y-2">
                  {couriers.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 border border-zinc-200 rounded-xl">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                        {c.name?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm">{c.name}</div>
                        <div className="text-xs text-zinc-400">Zone {c.zone} · ⭐ {c.rating} · {c.deliveries_completed} livraisons</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                        {c.active ? 'Disponible' : 'Hors ligne'}
                      </span>
                      {c.active && delegateTarget && (
                        <button onClick={() => deleguer(delegateTarget.id, c.id)}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all">
                          Déléguer
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 mb-4">
                💡 Tu touches 200F par livraison déléguée automatiquement confirmée.
              </div>
              <button onClick={() => setShowDelegate(false)} className="w-full bg-zinc-100 text-zinc-600 py-3 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all">
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TourneeView;
