import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { Radio, MapPin, MessageSquare, CheckCircle2, Package, Clock, TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';

interface WarRoomViewProps { user: User; }

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  delivered:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '✓ Livré' },
  in_progress: { bg: 'bg-blue-100',    text: 'text-blue-700',    label: '🛵 En livraison' },
  picked_up:   { bg: 'bg-blue-100',    text: 'text-blue-700',    label: '📦 Collecté' },
  assigned:    { bg: 'bg-violet-100',  text: 'text-violet-700',  label: '🔔 Assigné' },
  pending:     { bg: 'bg-orange-100',  text: 'text-orange-700',  label: '⏳ En attente' },
};

const WarRoomView: React.FC<WarRoomViewProps> = ({ user }) => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [wave, setWave] = useState(1);
  const [waves, setWaves] = useState<any[]>([]);
  const [pingSuccess, setPingSuccess] = useState<number | null>(null);
  const [confirmSuccess, setConfirmSuccess] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ clientName: '', clientPhone: '', clientZone: '', article: '', weight: '1' });

  const fetchAll = async () => {
    const [delRes, waveRes] = await Promise.all([
      fetch(`/api/deliveries?role=merchant&userId=${user.id}&wave=${wave}`),
      fetch(`/api/waves?merchantId=${user.id}`)
    ]);
    setDeliveries(await delRes.json());
    setWaves(await waveRes.json());
  };

  useEffect(() => { fetchAll(); }, [wave]);

  const pingClient = async (id: number) => {
    await fetch(`/api/deliveries/${id}/ping`, { method: 'POST' });
    setPingSuccess(id);
    setTimeout(() => setPingSuccess(null), 3000);
  };

  const confirmLivraison = async (id: number) => {
    await fetch(`/api/deliveries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'delivered' }) });
    setConfirmSuccess(id);
    setTimeout(() => setConfirmSuccess(null), 2000);
    fetchAll();
  };

  const addCommande = async () => {
    await fetch('/api/deliveries', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: user.id, pickupAddress: 'Boutique Lomé, Bè', deliveryAddress: `${form.clientZone}`, clientName: form.clientName, clientPhone: form.clientPhone, clientZone: form.clientZone, article: form.article, weight: parseFloat(form.weight), wave })
    });
    setShowAdd(false);
    setForm({ clientName: '', clientPhone: '', clientZone: '', article: '', weight: '1' });
    fetchAll();
  };

  const livrees = deliveries.filter(d => d.status === 'delivered').length;
  const enCours = deliveries.filter(d => ['in_progress','assigned','picked_up'].includes(d.status)).length;
  const enAttente = deliveries.filter(d => d.status === 'pending').length;
  const currentWave = waves.find(w => w.wave === wave);

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black tracking-tight">🎯 War Room Live</h2>
            <span className="flex items-center gap-1.5 bg-red-100 text-red-600 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              LIVE EN COURS
            </span>
          </div>
          <p className="text-zinc-500 text-sm">Tableau de bord temps réel · Toutes vos livraisons du jour</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
          + Ajouter commande
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Livrées', value: livrees, sub: `sur ${deliveries.length}`, icon: <CheckCircle2 size={20} className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: 'En livraison', value: enCours, sub: 'En route', icon: <TrendingUp size={20} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: 'En attente', value: enAttente, sub: 'À assigner', icon: <Clock size={20} className="text-orange-500" />, color: 'bg-orange-50' },
          { label: 'Revenus', value: `${(livrees * 1000).toLocaleString()} F`, sub: 'Confirmés', icon: <DollarSign size={20} className="text-emerald-600" />, color: 'bg-emerald-50' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{s.label}</span>
              <div className={`${s.color} p-1.5 rounded-lg`}>{s.icon}</div>
            </div>
            <div className="text-2xl font-black text-zinc-900">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Vagues */}
      <div className="flex gap-3">
        {[1, 2].map(w => {
          const wv = waves.find(x => x.wave === w);
          return (
            <button key={w} onClick={() => setWave(w)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm border-2 transition-all ${wave === w ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>
              <Radio size={15} />
              Vague {w} — {w === 1 ? 'Live du matin' : 'Live du midi'}
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${wave === w ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                {wv?.total || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <span className="font-bold text-sm">Commandes — {currentWave?.label}</span>
          <span className="text-xs text-zinc-400">{deliveries.length} commandes</span>
        </div>
        {deliveries.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune commande dans cette vague</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {deliveries.map((d) => {
              const sc = statusColors[d.status] || statusColors.pending;
              const isPinged = pingSuccess === d.id;
              const isConfirmed = confirmSuccess === d.id;
              return (
                <AnimatePresence key={d.id}>
                  <motion.div
                    layout
                    className={`flex items-center gap-4 px-5 py-4 transition-all ${isConfirmed ? 'bg-emerald-50' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-xs font-black text-zinc-500 shrink-0">
                      #{d.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900">{d.client_name || '—'}</span>
                        <span className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5 font-bold">{d.client_zone}</span>
                        <span className={`text-[10px] ${sc.bg} ${sc.text} rounded-full px-2 py-0.5 font-bold`}>{sc.label}</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1 truncate">📦 {d.article} · 📞 {d.client_phone}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {d.status === 'pending' && (
                        <button onClick={() => pingClient(d.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isPinged ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                          <MapPin size={12} />
                          {isPinged ? 'Envoyé ✓' : 'Ping GPS'}
                        </button>
                      )}
                      {d.status !== 'delivered' && (
                        <button onClick={() => confirmLivraison(d.id)}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
                          <CheckCircle2 size={12} />
                          Confirmer
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Ajout commande */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <h3 className="font-black text-xl mb-1">+ Nouvelle commande</h3>
              <p className="text-zinc-500 text-sm mb-5">Vague {wave} — {wave === 1 ? 'Live du matin' : 'Live du midi'}</p>
              <div className="space-y-3">
                {[
                  { key: 'clientName', label: 'Nom du client', placeholder: 'Mme Afi K.' },
                  { key: 'clientPhone', label: 'Numéro WhatsApp', placeholder: '90 XX XX XX' },
                  { key: 'clientZone', label: 'Zone', placeholder: 'Ex: Sagbado, Didégomé...' },
                  { key: 'article', label: 'Article commandé', placeholder: 'Ex: Mixeur BRANDT 600W' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block mb-1">Poids (kg)</label>
                  <input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={addCommande} className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all">
                  ✅ Ajouter la commande
                </button>
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-zinc-100 text-zinc-600 py-3 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all">
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarRoomView;
