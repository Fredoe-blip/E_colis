import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Truck,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

const PublicTrackingView: React.FC = () => {
  const { id } = useParams();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await fetch(`/api/track/${id}`);
        if (res.ok) {
          setDelivery(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  if (!delivery) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
      <Package className="text-zinc-300 mb-6" size={64} />
      <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
      <p className="text-zinc-500 mb-8">We couldn't find a delivery with ID #{id}.</p>
      <Link to="/login" className="text-emerald-600 font-bold flex items-center gap-2">
        <ArrowLeft size={18} />
        Back to Login
      </Link>
    </div>
  );

  const steps = [
    { label: 'Order Placed', status: 'pending', icon: <Package size={18} /> },
    { label: 'Courier Assigned', status: 'assigned', icon: <ShieldCheck size={18} /> },
    { label: 'Picked Up', status: 'picked_up', icon: <Truck size={18} /> },
    { label: 'Delivered', status: 'delivered', icon: <CheckCircle2 size={18} /> },
  ];

  const currentStepIdx = steps.findIndex(s => s.status === delivery.status);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-600 p-1.5 rounded-lg">
                <Package className="text-white" size={16} />
              </div>
              <span className="text-sm font-black tracking-widest uppercase text-zinc-400">Tracking Order</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">#EC-{delivery.id.toString().padStart(4, '0')}</h1>
          </div>
          <div className="bg-white px-6 py-4 rounded-3xl border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Estimated Arrival</p>
            <p className="text-xl font-black text-zinc-900">Today, 14:30</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Progress Bar */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
              <div className="relative flex justify-between">
                <div className="absolute top-5 left-0 w-full h-0.5 bg-zinc-100" />
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }} 
                />
                {steps.map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all ${
                      idx <= currentStepIdx ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-zinc-400'
                    }`}>
                      {step.icon}
                    </div>
                    <p className={`mt-3 text-[10px] font-black uppercase tracking-widest text-center max-w-[80px] ${
                      idx <= currentStepIdx ? 'text-zinc-900' : 'text-zinc-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Card */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Delivery Destination</p>
                  <p className="text-lg font-bold text-zinc-900">{delivery.delivery_address}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                  <Package size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Merchant</p>
                  <p className="text-lg font-bold text-zinc-900">{delivery.merchant_name}</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white">
              <h3 className="text-lg font-bold mb-4">Need Help?</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Our support team is available 24/7 to assist with your delivery.
              </p>
              <button className="w-full bg-white text-zinc-900 py-3 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all">
                Contact Support
              </button>
            </div>
            
            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
              <p className="text-emerald-700 text-xs font-bold leading-relaxed">
                Your delivery is protected by e-Colis Secure Guarantee.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PublicTrackingView;
