import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  LayoutDashboard, 
  User as UserIcon, 
  LogOut, 
  PlusCircle, 
  MapPin, 
  Clock, 
  Award, 
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole } from './types';

// Views (to be created in separate files or defined here for simplicity in this turn)
import LoginView from './views/LoginView';
import MerchantDashboard from './views/MerchantDashboard';
import CourierDashboard from './views/CourierDashboard';
import AdminDashboard from './views/AdminDashboard';

import PublicTrackingView from './views/PublicTrackingView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('ecolis_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('ecolis_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ecolis_user');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
        <Routes>
          <Route path="/track/:id" element={<PublicTrackingView />} />
          {!user ? (
            <>
              <Route path="/login" element={<LoginView onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route path="*" element={
              <div className="flex flex-col md:flex-row min-h-screen">
                {/* Sidebar */}
                <aside className="w-full md:w-64 bg-white border-r border-zinc-200 p-5 flex flex-col shrink-0">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-600 p-2 rounded-xl">
                        <Package className="text-white w-5 h-5" />
                      </div>
                      <h1 className="text-lg font-black tracking-tight">e-Colis</h1>
                    </div>
                    {/* Bouton déconnexion visible en haut sur mobile */}
                    <button
                      onClick={handleLogout}
                      title="Se déconnecter"
                      className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold border border-red-100 hover:bg-red-100 transition-all"
                    >
                      <LogOut size={14} />
                      Quitter
                    </button>
                  </div>

                  <nav className="flex-1 space-y-1">
                    <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    {user.role === 'merchant' && (
                      <NavLink to="/new-delivery" icon={<PlusCircle size={20} />} label="Nouvelle livraison" />
                    )}
                    {user.role === 'courier' && (
                      <>
                        <NavLink to="/missions" icon={<Truck size={20} />} label="Missions" />
                        <NavLink to="/rewards" icon={<Award size={20} />} label="Récompenses" />
                      </>
                    )}
                    <NavLink to="/profile" icon={<UserIcon size={20} />} label="Profil" />
                  </nav>

                  <div className="mt-auto pt-5 border-t border-zinc-100">
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <p className="text-sm font-semibold truncate">{user.name}</p>
                        <p className="text-xs text-zinc-400 capitalize">
                          {user.role === 'merchant' ? 'Marchand' : user.role === 'courier' ? 'Livreur' : 'Admin'}
                        </p>
                      </div>
                    </div>
                    {/* Bouton déconnexion principal - visible sur desktop */}
                    <button
                      onClick={handleLogout}
                      className="hidden md:flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all"
                    >
                      <LogOut size={16} />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-10 overflow-y-auto min-h-screen">
                  <Routes>
                    <Route path="/" element={
                      user.role === 'merchant' ? <MerchantDashboard user={user} /> : 
                      user.role === 'courier' ? <CourierDashboard user={user} /> :
                      <AdminDashboard />
                    } />
                    <Route path="/new-delivery" element={user.role === 'merchant' ? <NewDeliveryView user={user} /> : <Navigate to="/" />} />
                    <Route path="/missions" element={user.role === 'courier' ? <CourierMissions user={user} /> : <Navigate to="/" />} />
                    <Route path="/rewards" element={user.role === 'courier' ? <RewardsView user={user} /> : <Navigate to="/" />} />
                    <Route path="/profile" element={<ProfileView user={user} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            } />
          )}
        </Routes>
      </div>
    </BrowserRouter>
  );
};

const NavLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <Link 
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        isActive 
          ? 'bg-emerald-50 text-emerald-700' 
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

// --- Placeholder Views (To be moved to separate files) ---

const NewDeliveryView = ({ user }: { user: User }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickup: '',
    delivery: '',
    weight: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: user.id,
          pickupAddress: formData.pickup,
          deliveryAddress: formData.delivery,
          weight: formData.weight
        })
      });
      navigate('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Create New Delivery</h2>
        <p className="text-zinc-500">Enter the details for your parcel shipment.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Pickup Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-zinc-400" size={18} />
            <input 
              required
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Store location or warehouse"
              value={formData.pickup}
              onChange={e => setFormData({...formData, pickup: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Delivery Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-zinc-400" size={18} />
            <input 
              required
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Customer's address"
              value={formData.delivery}
              onChange={e => setFormData({...formData, delivery: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Weight (kg)</label>
            <input 
              type="number"
              step="0.1"
              min="0.1"
              className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={formData.weight}
              onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Estimated Price</label>
            <div className="px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-600 font-medium">
              ${(5 + formData.weight * 0.5).toFixed(2)}
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Confirm Delivery Request'}
        </button>
      </form>
    </div>
  );
};

const CourierMissions = ({ user }: { user: User }) => {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = async () => {
    const res = await fetch(`/api/deliveries?role=courier&userId=${user.id}`);
    const data = await res.json();
    setDeliveries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleAccept = async (id: number) => {
    await fetch(`/api/deliveries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'assigned', courierId: user.id })
    });
    fetchMissions();
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    await fetch(`/api/deliveries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchMissions();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2">Available Missions</h2>
          <p className="text-zinc-500">Find and accept new delivery tasks near you.</p>
        </div>
        <div className="bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
          <span className="text-emerald-700 text-sm font-bold">Active Status: Online</span>
        </div>
      </header>

      <div className="space-y-4">
        {deliveries.filter(d => d.status === 'pending').map(delivery => (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={delivery.id} 
            className="bg-white p-6 rounded-3xl border border-zinc-200 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-bold uppercase tracking-wider rounded">New Request</span>
                <span className="text-sm font-medium text-emerald-600">${delivery.price.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Pickup</p>
                    <p className="text-sm font-semibold">{delivery.pickup_address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">Delivery</p>
                    <p className="text-sm font-semibold">{delivery.delivery_address}</p>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleAccept(delivery.id)}
              className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-all"
            >
              Accept Mission
            </button>
          </motion.div>
        ))}

        {deliveries.filter(d => d.status !== 'pending' && d.status !== 'delivered').map(delivery => (
          <motion.div 
            layout
            key={delivery.id} 
            className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider rounded">In Progress</span>
                <span className="text-sm font-medium text-emerald-700">Order #{delivery.id}</span>
              </div>
              <p className="text-sm font-semibold mb-1">Heading to: {delivery.status === 'assigned' ? delivery.pickup_address : delivery.delivery_address}</p>
              <p className="text-xs text-emerald-600 font-medium">{delivery.status === 'assigned' ? 'Pickup required' : 'Delivery in progress'}</p>
            </div>
            <div className="flex gap-2">
              {delivery.status === 'assigned' ? (
                <button 
                  onClick={() => handleStatusUpdate(delivery.id, 'picked_up')}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all"
                >
                  Confirm Pickup
                </button>
              ) : (
                <button 
                  onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all"
                >
                  Confirm Delivery
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {deliveries.length === 0 && !loading && (
          <div className="text-center py-20 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl">
            <Package className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-zinc-500 font-medium">No missions available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RewardsView = ({ user }: { user: User }) => {
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const statsRes = await fetch(`/api/courier/${user.id}/stats`);
      setStats(await statsRes.json());
      const lbRes = await fetch('/api/leaderboard');
      setLeaderboard(await lbRes.json());
    };
    fetchData();
  }, []);

  if (!stats) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <header>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Courier Rewards</h2>
        <p className="text-zinc-500">Track your progress and unlock exclusive bonuses.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Total Points</p>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <p className="text-4xl font-bold text-zinc-900">{stats.points}</p>
          <div className="mt-4 h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${(stats.points % 100)}%` }} />
          </div>
          <p className="text-xs text-zinc-500 mt-2">{100 - (stats.points % 100)} points to next level</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Current Level</p>
            <Award className="text-orange-500" size={20} />
          </div>
          <p className="text-4xl font-bold text-zinc-900">Lvl {stats.level}</p>
          <p className="text-xs text-zinc-500 mt-2">Top 5% of couriers this week</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Rating</p>
            <div className="flex text-orange-400">
              {[1,2,3,4,5].map(i => <span key={i}>★</span>)}
            </div>
          </div>
          <p className="text-4xl font-bold text-zinc-900">{stats.rating.toFixed(1)}</p>
          <p className="text-xs text-zinc-500 mt-2">Based on {stats.deliveries_completed} deliveries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section>
          <h3 className="text-xl font-bold mb-6">Leaderboard</h3>
          <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden">
            {leaderboard.map((entry, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 border-b border-zinc-100 last:border-0 ${entry.name === user.name ? 'bg-emerald-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className={`w-6 text-center font-bold ${idx < 3 ? 'text-emerald-600' : 'text-zinc-400'}`}>{idx + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-600">
                    {entry.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{entry.name}</p>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Level {entry.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-zinc-900">{entry.points} pts</p>
                  <p className="text-[10px] text-zinc-400 font-bold">{entry.deliveries_completed} deliveries</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-6">Your Badges</h3>
          <div className="grid grid-cols-2 gap-4">
            <BadgeCard title="Early Bird" description="Completed 5 deliveries before 9 AM" unlocked={true} />
            <BadgeCard title="Speed Demon" description="Average delivery time under 20 mins" unlocked={true} />
            <BadgeCard title="Perfect 5" description="Maintain a 5.0 rating for 10 orders" unlocked={false} />
            <BadgeCard title="Heavy Lifter" description="Deliver 50kg+ total weight" unlocked={false} />
          </div>
        </section>
      </div>
    </div>
  );
};

const BadgeCard = ({ title, description, unlocked }: { title: string, description: string, unlocked: boolean }) => (
  <div className={`p-6 rounded-3xl border ${unlocked ? 'bg-white border-zinc-200' : 'bg-zinc-50 border-zinc-100 opacity-60'} flex flex-col items-center text-center`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${unlocked ? 'bg-orange-100 text-orange-600' : 'bg-zinc-200 text-zinc-400'}`}>
      <Award size={24} />
    </div>
    <h4 className="text-sm font-bold mb-1">{title}</h4>
    <p className="text-[10px] text-zinc-500 leading-relaxed">{description}</p>
  </div>
);

const ProfileView = ({ user }: { user: User }) => (
  <div className="max-w-2xl mx-auto">
    <header className="mb-8">
      <h2 className="text-3xl font-bold tracking-tight mb-2">Your Profile</h2>
      <p className="text-zinc-500">Manage your account settings and preferences.</p>
    </header>
    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white text-3xl font-bold">
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-bold">{user.name}</h3>
          <p className="text-zinc-500">{user.email}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-zinc-100 rounded-full text-xs font-bold text-zinc-600 uppercase tracking-wider">
            {user.role} Account
          </span>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <h4 className="text-sm font-bold mb-2">Account Security</h4>
          <p className="text-xs text-zinc-500 mb-4">Your account is protected with standard authentication.</p>
          <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Change Password</button>
        </div>
        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <h4 className="text-sm font-bold mb-2">Notification Preferences</h4>
          <p className="text-xs text-zinc-500 mb-4">Manage how you receive updates about your deliveries.</p>
          <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">Configure Notifications</button>
        </div>
      </div>
    </div>
  </div>
);

export default App;
