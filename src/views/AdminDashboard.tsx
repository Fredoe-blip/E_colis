import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp, 
  ShieldCheck,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'motion/react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/deliveries');
      const data = await res.json();
      setDeliveries(data);
      
      // Mock stats for demo
      setStats({
        totalRevenue: data.reduce((acc: number, d: any) => acc + d.price, 0),
        activeCouriers: 24,
        totalMerchants: 12,
        successRate: 98.4
      });
    };
    fetchData();
  }, []);

  const chartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 700 },
  ];

  if (!stats) return null;

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-4xl font-black tracking-tight mb-2">Command Center</h2>
        <p className="text-zinc-500 font-medium">Platform-wide overview and analytics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={<TrendingUp size={20} />} trend="+24%" />
        <AdminStatCard label="Active Couriers" value={stats.activeCouriers} icon={<Users size={20} />} trend="+3" />
        <AdminStatCard label="Merchants" value={stats.totalMerchants} icon={<ShieldCheck size={20} />} trend="+1" />
        <AdminStatCard label="Success Rate" value={`${stats.successRate}%`} icon={<Activity size={20} />} trend="+0.2%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Delivery Volume (Weekly)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6">Courier Performance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#18181b" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminStatCard = ({ label, value, icon, trend }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-zinc-50 rounded-xl text-zinc-900">
        {icon}
      </div>
      <div className="text-[10px] font-black text-emerald-600 flex items-center gap-0.5">
        <ArrowUpRight size={12} />
        {trend}
      </div>
    </div>
    <p className="text-2xl font-black text-zinc-900 mb-1">{value}</p>
    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
  </div>
);

export default AdminDashboard;
