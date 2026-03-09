import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { DollarSign, TrendingUp, Gift } from 'lucide-react';

interface RevenusViewProps { user: User; }

const RevenusView: React.FC<RevenusViewProps> = ({ user }) => {
  const [journal, setJournal] = useState<any>({ deliveries: [], summary: { total: 0, gains: 0, delegCommissions: 0, delegGains: 0 } });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courier/${user.id}/journal`).then(r => r.json()),
      fetch(`/api/courier/${user.id}/stats`).then(r => r.json()),
    ]).then(([j, s]) => { setJournal(j); setStats(s); });
  }, [user.id]);

  const { total, gains, delegCommissions, delegGains } = journal.summary;
  const totalJour = gains + delegGains;

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div>
        <h2 className="text-3xl font-black tracking-tight mb-1">💰 Mes Revenus</h2>
        <p className="text-zinc-500 text-sm">Journal du jour · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Gagné aujourd\'hui', value: `${totalJour.toLocaleString()} F`, sub: 'Total confirmé', icon: '💵' },
          { label: 'Livraisons directes', value: total, sub: 'Complétées', icon: '🛵' },
          { label: 'Commissions délég.', value: `+${delegGains.toLocaleString()} F`, sub: `${delegCommissions} délégation(s)`, icon: '🤝' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-sm">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{s.label}</div>
            <div className="text-2xl font-black text-zinc-900">{s.value}</div>
            <div className="text-xs text-zinc-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Journal */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100">
          <span className="font-bold text-sm">📒 Journal du jour</span>
        </div>
        {journal.deliveries.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-zinc-400 font-medium">Aucune livraison aujourd'hui pour l'instant.</p>
            <p className="text-zinc-400 text-sm mt-1">Va dans Ma Tournée pour commencer !</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {journal.deliveries.map((d: any) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                <span className="text-xl">🛵</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{d.client_name}</span>
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5 font-bold">{d.client_zone}</span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 truncate">📦 {d.article}</div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-base ${d.status === 'delivered' ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    +1 000 F
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {d.status === 'delivered' ? 'Payé' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total semaine */}
      <div className="bg-zinc-900 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h4 className="text-white font-black mb-1">📊 Total du mois</h4>
          <p className="text-zinc-400 text-sm">Livraisons directes + commissions de délégation</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-emerald-400">
            {stats ? `${stats.total_earnings?.toLocaleString() || 0} F` : '...'}
          </div>
          <div className="text-zinc-400 text-sm mt-1">{stats?.deliveries_completed || 0} livraisons au total</div>
        </div>
      </div>
    </div>
  );
};

export default RevenusView;
