import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Award, 
  TrendingUp, 
  MapPin, 
  Clock, 
  CheckCircle2,
  Navigation,
  DollarSign
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Delivery, CourierStats } from '../types';
import { format } from 'date-fns';

const CourierDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState<CourierStats | null>(null);
  const [activeDeliveries, setActiveDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [statsRes, delRes] = await Promise.all([
        fetch(`/api/courier/${user.id}/stats`),
        fetch(`/api/deliveries?role=courier&userId=${user.id}`)
      ]);
      setStats(await statsRes.json());
      const allDel = await delRes.json();
      setActiveDeliveries(allDel.filter((d: Delivery) => ['assigned', 'picked_up'].includes(d.status)));
      setLoading(false);
    };
    fetchData();
  }, [user.id]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2">Hey {user.name}! 🚀</h2>
          <p className="text-zinc-500 font-medium">You're on fire today. Ready for more missions?</p>
        </div>
        <div className="bg-emerald-600 px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/20">
          <span className="text-white text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Active & Online
          </span>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Earnings</p>
            <p className="text-4xl font-black mb-4">${((stats?.deliveries_completed || 0) * 8.5).toFixed(2)}</p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <TrendingUp size={14} />
              <span>+15% from last week</span>
            </div>
          </div>
          <DollarSign className="absolute -right-4 -bottom-4 text-white/5 w-32 h-32" />
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Gamification Points</p>
          <p className="text-4xl font-black text-zinc-900 mb-4">{stats?.points || 0}</p>
          <div className="flex items-center gap-2 text-orange-500 text-xs font-bold">
            <Award size={14} />
            <span>Level {stats?.level || 1} Pro Courier</span>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Deliveries</p>
          <p className="text-4xl font-black text-zinc-900 mb-4">{stats?.deliveries_completed || 0}</p>
          <div className="flex items-center gap-2 text-blue-500 text-xs font-bold">
            <CheckCircle2 size={14} />
            <span>{stats?.rating.toFixed(1)} Avg Rating</span>
          </div>
        </div>
      </div>

      {/* Active Missions */}
      <section>
        <h3 className="text-xl font-bold tracking-tight mb-6">Active Missions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeDeliveries.map(delivery => (
            <motion.div 
              key={delivery.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                    {delivery.status === 'assigned' ? 'To Pickup' : 'To Deliver'}
                  </span>
                  <span className="text-sm font-bold text-zinc-900">${delivery.price.toFixed(2)}</span>
                </div>
                
                <div className="space-y-6 mb-8">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div className="w-0.5 h-10 bg-zinc-100" />
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Pickup From</p>
                        <p className="text-sm font-bold text-zinc-900">{delivery.pickup_address}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Deliver To</p>
                        <p className="text-sm font-bold text-zinc-900">{delivery.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all">
                <Navigation size={18} />
                Open Navigation
              </button>
            </motion.div>
          ))}
          {activeDeliveries.length === 0 && !loading && (
            <div className="lg:col-span-2 py-16 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2.5rem] text-center">
              <Truck className="mx-auto text-zinc-300 mb-4" size={48} />
              <p className="text-zinc-500 font-bold">No active missions. Check the mission board!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CourierDashboard;
