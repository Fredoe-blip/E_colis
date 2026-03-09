import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package, MapPin, CheckCircle2, Truck, ArrowLeft, ShieldCheck, Phone
} from 'lucide-react';

declare const L: any;

// Coordonnées simulées pour la démo (quartiers de Lomé)
const LOME_ZONES: Record<string, [number, number]> = {
  default:   [6.1375, 1.2123],
  nord:      [6.1700, 1.2200],
  sud:       [6.1100, 1.2050],
  est:       [6.1400, 1.2450],
  ouest:     [6.1350, 1.1800],
  centre:    [6.1375, 1.2123],
};

function getCoords(address: string): [number, number] {
  const lower = address.toLowerCase();
  if (lower.includes('nord') || lower.includes('saint-denis') || lower.includes('haussmann')) return LOME_ZONES.nord;
  if (lower.includes('sud') || lower.includes('ivry'))   return LOME_ZONES.sud;
  if (lower.includes('est') || lower.includes('oberkampf')) return LOME_ZONES.est;
  if (lower.includes('ouest') || lower.includes('kléber'))  return LOME_ZONES.ouest;
  // Randomize slightly for variety
  const base = LOME_ZONES.default;
  return [base[0] + (Math.random() - 0.5) * 0.03, base[1] + (Math.random() - 0.5) * 0.03];
}

const PublicTrackingView: React.FC = () => {
  const { id } = useParams();
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await fetch(`/api/track/${id}`);
        if (res.ok) setDelivery(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [id]);

  useEffect(() => {
    if (!delivery || !mapRef.current || typeof L === 'undefined') return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const pickupCoords  = getCoords(delivery.pickup_address);
    const deliveryCoords = getCoords(delivery.delivery_address);
    const center: [number, number] = [
      (pickupCoords[0] + deliveryCoords[0]) / 2,
      (pickupCoords[1] + deliveryCoords[1]) / 2,
    ];

    const map = L.map(mapRef.current).setView(center, 13);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Marqueur collecte
    const pickupIcon = L.divIcon({
      html: `<div style="background:#059669;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">📦</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18], className: ''
    });
    L.marker(pickupCoords, { icon: pickupIcon })
      .addTo(map)
      .bindPopup(`<b>📦 Collecte</b><br/>${delivery.pickup_address}`);

    // Marqueur livraison
    const deliveryIcon = L.divIcon({
      html: `<div style="background:#f97316;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">🏠</div>`,
      iconSize: [36, 36], iconAnchor: [18, 18], className: ''
    });
    L.marker(deliveryCoords, { icon: deliveryIcon })
      .addTo(map)
      .bindPopup(`<b>🏠 Livraison</b><br/>${delivery.delivery_address}`);

    // Ligne du trajet
    L.polyline([pickupCoords, deliveryCoords], {
      color: '#059669', weight: 4, opacity: 0.8, dashArray: '8,6'
    }).addTo(map);

    // Marqueur livreur (position simulée au milieu si en cours)
    if (['assigned', 'picked_up'].includes(delivery.status)) {
      const courierLat = (pickupCoords[0] + deliveryCoords[0]) / 2 + 0.005;
      const courierLng = (pickupCoords[1] + deliveryCoords[1]) / 2 + 0.003;
      const courierIcon = L.divIcon({
        html: `<div style="background:#18181b;color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:3px solid white;">🛵</div>`,
        iconSize: [40, 40], iconAnchor: [20, 20], className: ''
      });
      L.marker([courierLat, courierLng], { icon: courierIcon })
        .addTo(map)
        .bindPopup('<b>🛵 Votre livreur</b><br/>En route...')
        .openPopup();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [delivery]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
    </div>
  );

  if (!delivery) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 p-6 text-center">
      <Package className="text-zinc-300 mb-6" size={64} />
      <h2 className="text-2xl font-bold mb-2">Colis introuvable</h2>
      <p className="text-zinc-500 mb-8">Aucune livraison trouvée avec l'ID #{id}.</p>
      <Link to="/login" className="text-emerald-600 font-bold flex items-center gap-2">
        <ArrowLeft size={18} /> Retour
      </Link>
    </div>
  );

  const steps = [
    { label: 'Commande créée',   status: 'pending',   emoji: '📋' },
    { label: 'Livreur assigné',  status: 'assigned',  emoji: '🛵' },
    { label: 'Colis collecté',   status: 'picked_up', emoji: '📦' },
    { label: 'Livré !',          status: 'delivered', emoji: '✅' },
  ];
  const currentIdx = steps.findIndex(s => s.status === delivery.status);

  const statusColors: Record<string, string> = {
    pending:   'bg-orange-50 text-orange-600 border-orange-200',
    assigned:  'bg-blue-50   text-blue-600   border-blue-200',
    picked_up: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    delivered: 'bg-zinc-100  text-zinc-600   border-zinc-200',
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center gap-3">
        <div className="bg-emerald-600 p-1.5 rounded-lg">
          <Package className="text-white" size={18} />
        </div>
        <span className="font-black text-zinc-900 text-lg">e-Colis</span>
        <span className="text-zinc-300 mx-2">|</span>
        <span className="text-zinc-500 text-sm">Suivi de colis</span>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* ID + Statut */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              #EC-{delivery.id.toString().padStart(4, '0')}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Suivi en temps réel de votre livraison</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest border ${statusColors[delivery.status] || 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
            {delivery.status === 'pending'   ? 'En attente'   :
             delivery.status === 'assigned'  ? 'En route'     :
             delivery.status === 'picked_up' ? 'En livraison' : 'Livré ✓'}
          </span>
        </div>

        {/* Étapes */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex justify-between relative">
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-zinc-100" />
            <div
              className="absolute top-5 left-5 h-0.5 bg-emerald-500 transition-all duration-700"
              style={{ width: `${currentIdx <= 0 ? 0 : (currentIdx / (steps.length - 1)) * (100 - 10)}%` }}
            />
            {steps.map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-4 border-white shadow-sm ${
                  i <= currentIdx ? 'bg-emerald-500' : 'bg-zinc-100'
                }`}>
                  {step.emoji}
                </div>
                <p className={`text-[10px] font-bold uppercase tracking-wider text-center leading-tight max-w-[70px] ${
                  i <= currentIdx ? 'text-zinc-900' : 'text-zinc-400'
                }`}>{step.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
            <MapPin size={16} className="text-emerald-600" />
            <span className="font-bold text-sm">Carte de suivi</span>
            {['assigned', 'picked_up'].includes(delivery.status) && (
              <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                EN DIRECT
              </span>
            )}
          </div>
          <div ref={mapRef} style={{ height: '300px', width: '100%' }} />
          <div className="px-5 py-3 flex gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Collecte</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />Destination</span>
            {['assigned', 'picked_up'].includes(delivery.status) && (
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-zinc-900 inline-block" />Livreur</span>
            )}
          </div>
        </div>

        {/* Détails */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-zinc-700">Détails de la livraison</h3>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <MapPin size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400">Adresse de livraison</p>
              <p className="font-semibold text-sm mt-0.5">{delivery.delivery_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0">
              <Package size={15} className="text-zinc-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-zinc-400">Marchand</p>
              <p className="font-semibold text-sm mt-0.5">{delivery.merchant_name}</p>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="bg-zinc-900 p-6 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold mb-1">Besoin d'aide ?</h3>
            <p className="text-zinc-400 text-sm">Notre équipe est disponible 7j/7.</p>
          </div>
          <button className="flex items-center gap-2 bg-white text-zinc-900 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all shrink-0">
            <Phone size={16} /> Contacter le support
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} /> Protégé par e-Colis Secure Guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicTrackingView;
