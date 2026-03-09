import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.NODE_ENV === "production"
  ? path.join("/tmp", "ecolis.db")
  : "ecolis.db";

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    role TEXT,
    name TEXT,
    phone TEXT,
    zone TEXT,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER,
    courier_id INTEGER,
    delegated_to INTEGER,
    status TEXT DEFAULT 'pending',
    wave INTEGER DEFAULT 1,
    pickup_address TEXT,
    delivery_address TEXT,
    client_name TEXT,
    client_phone TEXT,
    client_zone TEXT,
    article TEXT,
    weight REAL DEFAULT 1,
    price REAL,
    commission REAL DEFAULT 1000,
    proof_photo TEXT,
    location_requested INTEGER DEFAULT 0,
    client_lat REAL,
    client_lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(merchant_id) REFERENCES users(id),
    FOREIGN KEY(courier_id)  REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS courier_stats (
    courier_id INTEGER PRIMARY KEY,
    points INTEGER DEFAULT 0,
    deliveries_completed INTEGER DEFAULT 0,
    rating REAL DEFAULT 5.0,
    level INTEGER DEFAULT 1,
    total_earnings INTEGER DEFAULT 0,
    FOREIGN KEY(courier_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courier_id INTEGER,
    badge_type TEXT,
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS delegations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER,
    from_courier_id INTEGER,
    to_courier_id INTEGER,
    commission_split REAL DEFAULT 0.20,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ping_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_id INTEGER,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded INTEGER DEFAULT 0
  );
`);

const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
if (userCount === 0) {
  const merchant = db.prepare("INSERT INTO users (email, role, name, phone) VALUES (?, ?, ?, ?)").run("boutique@ecolis.fr", "merchant", "La Boutique", "90000001");
  const fredo = db.prepare("INSERT INTO users (email, role, name, phone, zone, active) VALUES (?, ?, ?, ?, ?, ?)").run("fredo@livreur.fr", "courier", "Fredo E.", "90112233", "Centre", 1);
  const karim = db.prepare("INSERT INTO users (email, role, name, phone, zone, active) VALUES (?, ?, ?, ?, ?, ?)").run("karim@livreur.fr", "courier", "Karim B.", "91223344", "Nord", 1);
  const amara = db.prepare("INSERT INTO users (email, role, name, phone, zone, active) VALUES (?, ?, ?, ?, ?, ?)").run("amara@livreur.fr", "courier", "Amara D.", "92334455", "Sud", 0);
  db.prepare("INSERT INTO users (email, role, name) VALUES (?, ?, ?)").run("admin@ecolis.fr", "admin", "Admin");

  db.prepare("INSERT INTO courier_stats (courier_id, points, deliveries_completed, rating, level, total_earnings) VALUES (?, ?, ?, ?, ?, ?)").run(fredo.lastInsertRowid,  980, 42, 4.9, 7, 84000);
  db.prepare("INSERT INTO courier_stats (courier_id, points, deliveries_completed, rating, level, total_earnings) VALUES (?, ?, ?, ?, ?, ?)").run(karim.lastInsertRowid,  750, 28, 4.7, 5, 56000);
  db.prepare("INSERT INTO courier_stats (courier_id, points, deliveries_completed, rating, level, total_earnings) VALUES (?, ?, ?, ?, ?, ?)").run(amara.lastInsertRowid, 1100, 61, 4.8, 8, 122000);

  const badgeInsert = db.prepare("INSERT INTO badges (courier_id, badge_type) VALUES (?, ?)");
  [["early_bird","speed_demon","heavy_lifter"].map(b => badgeInsert.run(fredo.lastInsertRowid, b))];
  badgeInsert.run(karim.lastInsertRowid, "early_bird");

  const ins = db.prepare(`INSERT INTO deliveries (merchant_id, courier_id, status, wave, pickup_address, delivery_address, client_name, client_phone, client_zone, article, weight, price, commission, client_lat, client_lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const d = fredo.lastInsertRowid;
  ins.run(merchant.lastInsertRowid, d,    "delivered",   1, "Boutique Lomé, Bè", "Sagbado près pharmacie",     "Mme Afi K.",    "90112233", "Sagbado",    "Mixeur BRANDT 600W",       3.2, 6.6, 1000, 6.148, 1.201);
  ins.run(merchant.lastInsertRowid, d,    "in_progress", 1, "Boutique Lomé, Bè", "Bè Kpota carref. école",     "M. Kodjo A.",   "91223344", "Bè Kpota",   "Fer à repasser PHILIPS",   1.5, 5.8, 1000, 6.132, 1.218);
  ins.run(merchant.lastInsertRowid, d,    "in_progress", 1, "Boutique Lomé, Bè", "Didégomé marché",            "Mme Sena D.",   "92334455", "Didégomé",   "Ventilateur BINATONE",     2.1, 6.1, 1000, 6.155, 1.225);
  ins.run(merchant.lastInsertRowid, null, "pending",     1, "Boutique Lomé, Bè", "Zongo derrière mosquée",     "M. Kwame T.",   "93445566", "Zongo",      "Bouilloire RUSSELL 1.7L",  0.9, 5.5, 1000, 6.140, 1.195);
  ins.run(merchant.lastInsertRowid, null, "pending",     1, "Boutique Lomé, Bè", "Sagbado rue principale",     "Mme Akosua M.", "94556677", "Sagbado",    "Blender MOULINEX 700W",    2.8, 6.4, 1000, 6.150, 1.205);
  ins.run(merchant.lastInsertRowid, null, "pending",     2, "Boutique Lomé, Bè", "Adidogomé cité OUA",         "M. Edem F.",    "95667788", "Adidogomé",  "Grille-pain TEFAL",        1.4, 5.7, 1000, 6.170, 1.215);
  ins.run(merchant.lastInsertRowid, null, "pending",     2, "Boutique Lomé, Bè", "Togblékopé carref. UPRA",    "Mme Yawa B.",   "96778899", "Togblékopé", "Cafetière DELONGHI",       2.0, 6.0, 1000, 6.178, 1.222);
  ins.run(merchant.lastInsertRowid, null, "pending",     2, "Boutique Lomé, Bè", "Bè Kpota avenue du 24",      "M. Koffi S.",   "97889900", "Bè Kpota",   "Aspirateur HOOVER 1800W",  4.5, 7.3, 1000, 6.133, 1.220);
}

function checkBadges(courierId: number) {
  const stats: any = db.prepare("SELECT * FROM courier_stats WHERE courier_id = ?").get(courierId);
  if (!stats) return;
  const existing = (db.prepare("SELECT badge_type FROM badges WHERE courier_id = ?").all(courierId) as any[]).map((b:any) => b.badge_type);
  const awards: string[] = [];
  if (!existing.includes("early_bird") && stats.deliveries_completed >= 1) awards.push("early_bird");
  if (!existing.includes("speed_demon") && stats.deliveries_completed >= 5) awards.push("speed_demon");
  if (!existing.includes("perfect_5") && stats.deliveries_completed >= 5 && stats.rating >= 4.9) awards.push("perfect_5");
  if (!existing.includes("heavy_lifter") && stats.deliveries_completed >= 20) awards.push("heavy_lifter");
  const ins = db.prepare("INSERT INTO badges (courier_id, badge_type) VALUES (?, ?)");
  for (const b of awards) ins.run(courierId, b);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  app.use(express.json({ limit: "10mb" }));

  app.post("/api/auth/login", (req, res) => {
    const { email, role } = req.body;
    let user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      const result = db.prepare("INSERT INTO users (email, role, name) VALUES (?, ?, ?)").run(email, role, email.split("@")[0]);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      if (role === "courier") db.prepare("INSERT INTO courier_stats (courier_id) VALUES (?)").run((user as any).id);
    }
    res.json(user);
  });

  app.get("/api/deliveries", (req, res) => {
    const { role, userId, wave } = req.query;
    let deliveries;
    if (role === "merchant") {
      const base = `SELECT d.*, u.name as courier_name FROM deliveries d LEFT JOIN users u ON d.courier_id = u.id WHERE d.merchant_id = ?`;
      deliveries = wave ? db.prepare(base + " AND d.wave = ? ORDER BY d.created_at DESC").all(userId as string, wave as string)
                        : db.prepare(base + " ORDER BY d.wave ASC, d.created_at DESC").all(userId as string);
    } else if (role === "courier") {
      deliveries = db.prepare(`SELECT d.*, u.name as merchant_name FROM deliveries d LEFT JOIN users u ON d.merchant_id = u.id WHERE d.courier_id = ? OR (d.status = 'pending' AND d.courier_id IS NULL) ORDER BY d.wave ASC, d.created_at ASC`).all(userId as string);
    } else {
      deliveries = db.prepare(`SELECT d.*, m.name as merchant_name, c.name as courier_name FROM deliveries d LEFT JOIN users m ON d.merchant_id = m.id LEFT JOIN users c ON d.courier_id = c.id ORDER BY d.wave ASC, d.created_at DESC`).all();
    }
    res.json(deliveries);
  });

  app.post("/api/deliveries", (req, res) => {
    const { merchantId, pickupAddress, deliveryAddress, clientName, clientPhone, clientZone, article, weight, wave } = req.body;
    const price = 5 + (weight || 1) * 0.5;
    const result = db.prepare(`INSERT INTO deliveries (merchant_id, status, wave, pickup_address, delivery_address, client_name, client_phone, client_zone, article, weight, price, commission) VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1000)`).run(merchantId, wave || 1, pickupAddress, deliveryAddress, clientName || "", clientPhone || "", clientZone || "", article || "", weight || 1, price);
    res.json({ id: result.lastInsertRowid, price });
  });

  app.patch("/api/deliveries/:id", (req, res) => {
    const { id } = req.params;
    const { status, courierId, proofPhoto } = req.body;
    if (courierId && status === "assigned") {
      db.prepare("UPDATE deliveries SET status = ?, courier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, courierId, id);
    } else if (proofPhoto) {
      db.prepare("UPDATE deliveries SET proof_photo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(proofPhoto, id);
    } else if (status) {
      db.prepare("UPDATE deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    }
    if (status === "delivered") {
      const del: any = db.prepare("SELECT courier_id FROM deliveries WHERE id = ?").get(id);
      if (del?.courier_id) {
        db.prepare("UPDATE courier_stats SET points = points + 10, deliveries_completed = deliveries_completed + 1, total_earnings = total_earnings + 1000 WHERE courier_id = ?").run(del.courier_id);
        checkBadges(del.courier_id);
        const deleg: any = db.prepare("SELECT * FROM delegations WHERE delivery_id = ?").get(id);
        if (deleg) db.prepare("UPDATE courier_stats SET total_earnings = total_earnings + 200 WHERE courier_id = ?").run(deleg.from_courier_id);
      }
    }
    res.json({ success: true });
  });

  app.get("/api/track/:id", (req, res) => {
    const delivery: any = db.prepare(`SELECT d.*, u.name as merchant_name, c.name as courier_name FROM deliveries d JOIN users u ON d.merchant_id = u.id LEFT JOIN users c ON d.courier_id = c.id WHERE d.id = ?`).get(req.params.id);
    if (!delivery) return res.status(404).json({ error: "Not found" });
    res.json(delivery);
  });

  app.get("/api/courier/:id/stats", (req, res) => {
    const stats = db.prepare("SELECT * FROM courier_stats WHERE courier_id = ?").get(req.params.id);
    const badges = db.prepare("SELECT * FROM badges WHERE courier_id = ?").all(req.params.id);
    res.json({ ...(stats as object), badges });
  });

  app.get("/api/courier/:id/journal", (req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const deliveries = db.prepare(`SELECT d.*, m.name as merchant_name FROM deliveries d LEFT JOIN users m ON d.merchant_id = m.id WHERE d.courier_id = ? AND DATE(d.updated_at) = ? ORDER BY d.updated_at DESC`).all(req.params.id, today);
    const done = (deliveries as any[]).filter(d => d.status === "delivered").length;
    const delegComm = (db.prepare(`SELECT COUNT(*) as c FROM delegations del JOIN deliveries d ON del.delivery_id = d.id WHERE del.from_courier_id = ? AND d.status = 'delivered' AND DATE(d.updated_at) = ?`).get(req.params.id, today) as any).c;
    res.json({ deliveries, summary: { total: done, gains: done * 1000, delegCommissions: delegComm, delegGains: delegComm * 200 } });
  });

  app.get("/api/courier/:id/route", (req, res) => {
    const pending = db.prepare(`SELECT * FROM deliveries WHERE (courier_id = ? OR (status = 'pending' AND courier_id IS NULL)) AND status != 'delivered' ORDER BY wave ASC, client_zone ASC`).all(req.params.id);
    const base = { lat: 6.1375, lng: 1.2123 };
    const withDist = (pending as any[]).map(d => {
      const dlat = (d.client_lat || base.lat) - base.lat;
      const dlng = (d.client_lng || base.lng) - base.lng;
      const dist = Math.round(Math.sqrt(dlat * dlat + dlng * dlng) * 111 * 10) / 10;
      return { ...d, distance_km: dist, eta_min: Math.round(dist / 30 * 60) };
    });
    withDist.sort((a, b) => a.distance_km - b.distance_km);
    res.json(withDist);
  });

  app.post("/api/deliveries/:id/delegate", (req, res) => {
    const { id } = req.params;
    const { fromCourierId, toCourierId } = req.body;
    db.prepare("UPDATE deliveries SET courier_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(toCourierId, id);
    db.prepare("INSERT INTO delegations (delivery_id, from_courier_id, to_courier_id) VALUES (?, ?, ?)").run(id, fromCourierId, toCourierId);
    res.json({ success: true, message: "Délégué avec succès. Tu toucheras 200F de commission." });
  });

  app.post("/api/deliveries/:id/ping", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE deliveries SET location_requested = 1 WHERE id = ?").run(id);
    db.prepare("INSERT INTO ping_requests (delivery_id) VALUES (?)").run(id);
    const delivery: any = db.prepare("SELECT * FROM deliveries WHERE id = ?").get(id);
    res.json({ success: true, message: `Demande de localisation envoyée à ${delivery?.client_name || "le client"}` });
  });

  app.get("/api/couriers", (_req, res) => {
    const couriers = db.prepare(`SELECT u.*, s.points, s.deliveries_completed, s.rating, s.level, s.total_earnings FROM users u LEFT JOIN courier_stats s ON u.id = s.courier_id WHERE u.role = 'courier' ORDER BY s.points DESC`).all();
    res.json(couriers);
  });

  app.get("/api/leaderboard", (_req, res) => {
    const lb = db.prepare(`SELECT u.name, u.zone, s.points, s.deliveries_completed, s.level, s.rating, s.total_earnings FROM courier_stats s JOIN users u ON s.courier_id = u.id ORDER BY s.points DESC LIMIT 10`).all();
    res.json(lb);
  });

  app.get("/api/admin/stats", (_req, res) => {
    const total = (db.prepare("SELECT COUNT(*) as c FROM deliveries").get() as any).c;
    const delivered = (db.prepare("SELECT COUNT(*) as c FROM deliveries WHERE status = 'delivered'").get() as any).c;
    const inProgress = (db.prepare("SELECT COUNT(*) as c FROM deliveries WHERE status IN ('assigned','in_progress','picked_up')").get() as any).c;
    const pending = (db.prepare("SELECT COUNT(*) as c FROM deliveries WHERE status = 'pending'").get() as any).c;
    const activeCouriers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'courier' AND active = 1").get() as any).c;
    const revenue = (db.prepare("SELECT SUM(commission) as s FROM deliveries WHERE status = 'delivered'").get() as any).s || 0;
    res.json({ total, delivered, inProgress, pending, activeCouriers, revenue, deliveryRate: total > 0 ? Math.round(delivered / total * 100) : 0 });
  });

  app.get("/api/waves", (req, res) => {
    const { merchantId } = req.query;
    const waves = [1, 2].map(w => {
      const all = db.prepare("SELECT * FROM deliveries WHERE merchant_id = ? AND wave = ?").all(merchantId as string, w) as any[];
      return { wave: w, label: w === 1 ? "Live du matin" : "Live du midi", total: all.length, delivered: all.filter(d => d.status === "delivered").length, inProgress: all.filter(d => ["assigned","in_progress","picked_up"].includes(d.status)).length, pending: all.filter(d => d.status === "pending").length };
    });
    res.json(waves);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`✅ e-Colis v2 running on http://localhost:${PORT}`));
}

startServer();
