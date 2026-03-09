import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use /tmp for SQLite on Railway (ephemeral but works for demos)
const dbPath = process.env.NODE_ENV === "production"
  ? path.join("/tmp", "ecolis.db")
  : "ecolis.db";

const db = new Database(dbPath);

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    role TEXT,
    name TEXT,
    profile_data TEXT
  );

  CREATE TABLE IF NOT EXISTS deliveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merchant_id INTEGER,
    courier_id INTEGER,
    status TEXT,
    pickup_address TEXT,
    delivery_address TEXT,
    weight REAL,
    price REAL,
    eta TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(merchant_id) REFERENCES users(id),
    FOREIGN KEY(courier_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS courier_stats (
    courier_id INTEGER PRIMARY KEY,
    points INTEGER DEFAULT 0,
    deliveries_completed INTEGER DEFAULT 0,
    rating REAL DEFAULT 5.0,
    level INTEGER DEFAULT 1,
    FOREIGN KEY(courier_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courier_id INTEGER,
    badge_type TEXT,
    awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(courier_id) REFERENCES users(id)
  );
`);

// Seed demo data for presentation
const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
if (userCount === 0) {
  const merchant = db.prepare("INSERT INTO users (email, role, name) VALUES (?, ?, ?)").run("marc@boutique.fr", "merchant", "Marc C.");
  const courier1 = db.prepare("INSERT INTO users (email, role, name) VALUES (?, ?, ?)").run("karim@livreur.fr", "courier", "Karim B.");
  const courier2 = db.prepare("INSERT INTO users (email, role, name) VALUES (?, ?, ?)").run("amara@livreur.fr", "courier", "Amara D.");
  const admin = db.prepare("INSERT INTO users (email, role, name) VALUES (?, ?, ?)").run("admin@ecolis.fr", "admin", "Admin");

  db.prepare("INSERT INTO courier_stats (courier_id, points, deliveries_completed, rating, level) VALUES (?, ?, ?, ?, ?)").run(courier1.lastInsertRowid, 980, 142, 4.9, 9);
  db.prepare("INSERT INTO courier_stats (courier_id, points, deliveries_completed, rating, level) VALUES (?, ?, ?, ?, ?)").run(courier2.lastInsertRowid, 850, 121, 4.8, 8);

  const addresses = [
    ["Entrepôt Nord, Saint-Denis", "23 Rue de la Paix, Paris 1er", 2.5, "delivered"],
    ["10 Bd Haussmann, Paris 9e", "8 Avenue Kléber, Paris 16e", 1.2, "picked_up"],
    ["Boutique Centre, Paris 3e", "45 Rue Oberkampf, Paris 11e", 1.8, "assigned"],
    ["Entrepôt Sud, Ivry", "17 Rue de Rivoli, Paris 4e", 2.1, "pending"],
    ["10 Bd Haussmann, Paris 9e", "5 Rue du Faubourg, Paris 10e", 0.8, "pending"],
  ];

  for (const [pickup, delivery, weight, status] of addresses) {
    const price = 5 + (weight as number) * 0.5;
    db.prepare(`INSERT INTO deliveries (merchant_id, courier_id, status, pickup_address, delivery_address, weight, price)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(merchant.lastInsertRowid, status !== "pending" ? courier1.lastInsertRowid : null, status, pickup, delivery, weight, price);
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, role } = req.body;
    let user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user) {
      const result = db.prepare("INSERT INTO users (email, role, name) VALUES (?, ?, ?)").run(email, role, email.split("@")[0]);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
      if (role === "courier") {
        db.prepare("INSERT INTO courier_stats (courier_id) VALUES (?)").run((user as any).id);
      }
    }
    res.json(user);
  });

  // Deliveries
  app.get("/api/deliveries", (req, res) => {
    const { role, userId } = req.query;
    let deliveries;
    if (role === "merchant") {
      deliveries = db.prepare("SELECT * FROM deliveries WHERE merchant_id = ? ORDER BY created_at DESC").all(userId as string);
    } else if (role === "courier") {
      deliveries = db.prepare("SELECT * FROM deliveries WHERE courier_id = ? OR status = 'pending' ORDER BY created_at DESC").all(userId as string);
    } else {
      deliveries = db.prepare("SELECT * FROM deliveries ORDER BY created_at DESC").all();
    }
    res.json(deliveries);
  });

  app.post("/api/deliveries", (req, res) => {
    const { merchantId, pickupAddress, deliveryAddress, weight } = req.body;
    const price = 5 + weight * 0.5;
    const result = db.prepare(`
      INSERT INTO deliveries (merchant_id, status, pickup_address, delivery_address, weight, price)
      VALUES (?, 'pending', ?, ?, ?, ?)
    `).run(merchantId, pickupAddress, deliveryAddress, weight, price);
    res.json({ id: result.lastInsertRowid, price });
  });

  app.patch("/api/deliveries/:id", (req, res) => {
    const { id } = req.params;
    const { status, courierId } = req.body;

    if (courierId && status === "assigned") {
      db.prepare("UPDATE deliveries SET status = ?, courier_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, courierId, id);
    } else {
      db.prepare("UPDATE deliveries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    }

    if (status === "delivered") {
      const delivery: any = db.prepare("SELECT courier_id FROM deliveries WHERE id = ?").get(id);
      if (delivery?.courier_id) {
        db.prepare("UPDATE courier_stats SET points = points + 10, deliveries_completed = deliveries_completed + 1 WHERE courier_id = ?").run(delivery.courier_id);
      }
    }
    res.json({ success: true });
  });

  app.get("/api/track/:id", (req, res) => {
    const delivery: any = db.prepare(`
      SELECT d.*, u.name as merchant_name FROM deliveries d
      JOIN users u ON d.merchant_id = u.id WHERE d.id = ?
    `).get(req.params.id);
    if (!delivery) return res.status(404).json({ error: "Not found" });
    res.json(delivery);
  });

  app.get("/api/courier/:id/stats", (req, res) => {
    const stats = db.prepare("SELECT * FROM courier_stats WHERE courier_id = ?").get(req.params.id);
    const badges = db.prepare("SELECT * FROM badges WHERE courier_id = ?").all(req.params.id);
    res.json({ ...stats as object, badges });
  });

  app.get("/api/leaderboard", (req, res) => {
    const leaderboard = db.prepare(`
      SELECT u.name, s.points, s.deliveries_completed, s.level
      FROM courier_stats s JOIN users u ON s.courier_id = u.id
      ORDER BY s.points DESC LIMIT 10
    `).all();
    res.json(leaderboard);
  });

  // Vite / Static
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ e-Colis running on http://localhost:${PORT}`);
  });
}

startServer();
