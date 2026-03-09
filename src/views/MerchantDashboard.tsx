import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { User, Delivery } from '../types';
import { format } from 'date-fns';

const MerchantDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      const res = await fetch(`/api/deliveries?role=merchant&userId=${user.id}`);
      const data = await res.json();
      setDeliveries(data);
      setLoading(false);
    };
    fetchDeliveries();
  }, [user.id]);

  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => d.status === 'pending').length,
    inProgress: deliveries.filter(d => ['assigned', 'picked_up'].includes(d.status)).length,
    completed: deliveries.filter(d => d.status === 'delivered').length,
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight mb-2">Welcome back, {user.name}</h2>
          <p className="text-zinc-500 font-medium">Here's what's happening with your deliveries today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
            <Search className="text-zinc-400" size={20} />
          </div>
          <div className="bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
            <Filter className="text-zinc-400" size={20} />
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Orders" 
          value={stats.total} 
          icon={<Package className="text-blue-600" size={20} />} 
          trend="+12%" 
          trendUp={true}
        />
        <StatCard 
          label="Pending" 
          value={stats.pending} 
          icon={<Clock className="text-orange-600" size={20} />} 
          trend="-2%" 
          trendUp={false}
        />
        <StatCard 
          label="In Transit" 
          value={stats.inProgress} 
          icon={<TrendingUp className="text-emerald-600" size={20} />} 
          trend="+5%" 
          trendUp={true}
        />
        <StatCard 
          label="Delivered" 
          value={stats.completed} 
          icon={<CheckCircle2 className="text-emerald-600" size={20} />} 
          trend="+18%" 
          trendUp={true}
        />
      </div>

      {/* Recent Deliveries Table */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold tracking-tight">Recent Deliveries</h3>
          <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">View All Orders</button>
        </div>

        <div className="bg-white rounded-[2rem] border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Destination</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-zinc-900">#EC-{delivery.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-zinc-900 truncate max-w-[200px]">{delivery.delivery_address}</p>
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={delivery.status} />
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-zinc-900">${delivery.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-medium text-zinc-500">{format(new Date(delivery.created_at), 'MMM d, HH:mm')}</span>
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Package className="text-zinc-200" size={48} />
                        <p className="text-zinc-400 font-medium">No deliveries found. Create your first one!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value, icon, trend, trendUp }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100">
        {icon}
      </div>
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
        {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
      </div>
    </div>
    <p className="text-3xl font-black text-zinc-900 mb-1">{value}</p>
    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
  </motion.div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: 'bg-orange-50 text-orange-600 border-orange-100',
    assigned: 'bg-blue-50 text-blue-600 border-blue-100',
    picked_up: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    delivered: 'bg-zinc-100 text-zinc-900 border-zinc-200',
    returned: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

export default MerchantDashboard;
