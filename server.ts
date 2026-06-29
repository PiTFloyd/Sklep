import express from "express";
import path from "path";
import sqlite3 from "sqlite3";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import fs from "fs";
import { execSync } from "child_process";

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.sqlite");

// Auto-initialize and seed database if the file is missing or empty
try {
  let shouldInit = false;
  if (!fs.existsSync(DB_FILE)) {
    shouldInit = true;
  } else {
    const stats = fs.statSync(DB_FILE);
    if (stats.size === 0) {
      shouldInit = true;
    }
  }

  if (shouldInit) {
    console.log("Database file is missing or empty. Auto-running database initialization and seeding...");
    execSync("npm run db:init", { stdio: "inherit" });
    execSync("npm run db:seed", { stdio: "inherit" });
    console.log("Database auto-initialization completed successfully.");
  }
} catch (err: any) {
  console.error("Auto-initialization during boot failed:", err.message);
}

app.use(express.json());
app.use(cookieParser());

// Initialize SQLite Database and apply Performance Tuning (WAL mode + Synchronous Normal + Busy Timeout)
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error("Błąd podczas otwierania bazy danych SQLite:", err.message);
  } else {
    console.log("Połączono z bazą danych SQLite.");
    
    // Performance Tuning: WAL Mode allows concurrent reads and writes without blocking
    db.run("PRAGMA journal_mode = WAL;", (pragmaErr) => {
      if (pragmaErr) console.error("Błąd włączania WAL:", pragmaErr);
      else console.log("SQLite: Włączono tryb zapisu WAL (Write-Ahead Logging).");
    });

    // Performance Tuning: Synchronous NORMAL is much faster and completely safe with WAL
    db.run("PRAGMA synchronous = NORMAL;");

    // Performance Tuning: Gracefully wait up to 5000ms if the database is temporarily locked
    db.run("PRAGMA busy_timeout = 5000;");

    // Data Integrity: Enable Foreign Key constraints for relational consistency
    db.run("PRAGMA foreign_keys = ON;");

    console.log("SQLite setup successfully completed. Ready for operations.");
  }
});

// Generic In-Memory Cache Class with Time-To-Live (TTL) expiration to optimize LCP & TTFB
class InMemoryCache<T> {
  private cache: T | null = null;
  private lastFetch: number = 0;
  private ttl: number; // TTL in milliseconds

  constructor(ttlSeconds: number) {
    this.ttl = ttlSeconds * 1000;
  }

  get(): T | null {
    if (this.cache && (Date.now() - this.lastFetch < this.ttl)) {
      return this.cache;
    }
    return null;
  }

  set(data: T): void {
    this.cache = data;
    this.lastFetch = Date.now();
  }

  clear(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

// Global Products Cache with a 30-second TTL to reduce disk I/O and optimize load speeds
export const productsCache = new InMemoryCache<any[]>(30);

// Helper functions for Database Queries wrapped in Promises
const dbRun = (sql: string, params: any[] = []): Promise<{ id: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbAll = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

const dbGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
};

async function checkDatabaseSchema() {
  try {
    const userTableExists = await dbGet<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='Users'");
    if (!userTableExists) {
      console.warn("OSTRZEŻENIE: Tabela 'Users' nie istnieje! Uruchom: 'npm run db:init' na serwerze, aby utworzyć bazę danych i zasilić ją danymi.");
    } else {
      console.log("Baza danych została pomyślnie zweryfikowana.");
    }
  } catch (error) {
    console.error("Błąd podczas weryfikacji bazy danych:", error);
  }
}

// Sprawdź stan bazy danych krótko po uruchomieniu serwera
setTimeout(checkDatabaseSchema, 1000);

// -------------------------------------------------------------------------
// EXPRESS API ROUTES
// -------------------------------------------------------------------------

// JWT Configuration & Security Keys
const JWT_SECRET = process.env.JWT_SECRET || "planszowki-super-secret-key-12345";

export interface AuthenticatedRequest extends express.Request {
  user?: {
    username: string;
    role: string;
  };
}

// User Authentication Middleware (Secured against XSS and IDOR)
const checkAuth = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  let token = req.cookies?.token;
  
  // Fallback support for Authorization Header (for API-only clients or native requests)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Brak ważnej sesji. Zaloguj się ponownie." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
    req.user = decoded;
    
    // Prevent IDOR (Insecure Direct Object Reference)
    // Ensures regular clients can only access / update their own profile and records
    if (req.params.username && req.params.username !== decoded.username && decoded.role !== "Owner") {
      return res.status(403).json({ error: "Brak uprawnień do żądanych zasobów." });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: "Sesja wygasła lub jest nieprawidłowa. Zaloguj się ponownie." });
  }
};

// Login Route - Signs JWT and saves to secure HttpOnly cookie
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Wymagany jest login oraz hasło." });
  }

  try {
    const user = await dbGet("SELECT * FROM Users WHERE username = ? AND password = ?", [username, password]);
    if (!user) {
      return res.status(401).json({ error: "Błędny login lub hasło." });
    }

    // Generate real secure JWT containing username and role scope
    const token = jwt.sign(
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Persist session securely in HttpOnly cookie to mitigate XSS
    res.cookie("token", token, {
      httpOnly: true, // Prevents client-side JS from reading the cookie
      secure: process.env.NODE_ENV === "production", // Transmit only over HTTPS in prod
      sameSite: "strict", // MITIGATES CSRF attacks completely
      maxAge: 1000 * 60 * 60 * 24 // 24-hour lifetime
    });

    res.json({
      username: user.username,
      role: user.role,
      token, // Kept for frontend state compatibility
      firstName: user.firstName || user.fullName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      zipCode: user.zipCode || ""
    });
  } catch (error) {
    console.error("Błąd podczas logowania:", error);
    res.status(500).json({ error: "Błąd serwera podczas logowania." });
  }
});

// Endpoint to fetch currently authenticated user (Silent hydration/F5 recovery)
app.get("/api/auth/me", checkAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Użytkownik niezalogowany." });
  }

  try {
    const user = await dbGet("SELECT * FROM Users WHERE username = ?", [req.user.username]);
    if (!user) {
      return res.status(404).json({ error: "Użytkownik nie istnieje w bazie danych." });
    }

    res.json({
      username: user.username,
      role: user.role,
      token: req.cookies?.token || `mock-token-${user.username}-${user.role}`,
      firstName: user.firstName || user.fullName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      zipCode: user.zipCode || ""
    });
  } catch (error) {
    console.error("Błąd podczas odzyskiwania sesji:", error);
    res.status(500).json({ error: "Błąd serwera podczas weryfikacji sesji." });
  }
});

// Secure Logout - clears HTTP-Only Cookie
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.json({ message: "Pomyślnie wylogowano ze sklepu." });
});

// Register Route
app.post("/api/register", async (req, res) => {
  const { username, password, firstName, lastName, email, phone, address, city, zipCode } = req.body;
  if (!username || !password || !firstName || !lastName || !email || !phone || !address || !city || !zipCode) {
    return res.status(400).json({ error: "Wszystkie dane rejestracyjne oraz adresowe są wymagane." });
  }

  try {
    const existingUser = await dbGet("SELECT * FROM Users WHERE username = ?", [username]);
    if (existingUser) {
      return res.status(400).json({ error: "Użytkownik o podanym loginie już istnieje." });
    }

    await dbRun(
      `INSERT INTO Users (username, password, role, firstName, lastName, email, phone, address, city, zipCode) 
       VALUES (?, ?, 'Client', ?, ?, ?, ?, ?, ?, ?)`,
      [username, password, firstName, lastName, email, phone, address, city, zipCode]
    );

    res.status(201).json({ message: "Rejestracja pomyślna. Możesz się teraz zalogować." });
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas rejestracji." });
  }
});

// Get User Profile Route
app.get("/api/users/:username", checkAuth, async (req, res) => {
  const { username } = req.params;
  try {
    const user = await dbGet(
      "SELECT username, role, firstName, lastName, email, phone, address, city, zipCode FROM Users WHERE username = ?",
      [username]
    );
    if (!user) {
      return res.status(404).json({ error: "Użytkownik nie znaleziony." });
    }
    res.json({
      username: user.username,
      role: user.role,
      firstName: user.firstName || user.fullName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      zipCode: user.zipCode || ""
    });
  } catch (error) {
    res.status(500).json({ error: "Błąd bazy danych podczas pobierania danych użytkownika." });
  }
});

// Get Products Route
app.get("/api/products", async (req, res) => {
  // Check if cache exists and is valid
  const cachedProducts = productsCache.get();
  if (cachedProducts) {
    return res.json(cachedProducts);
  }

  try {
    const rows = await dbAll("SELECT * FROM Products");
    // Convert under_score field names from DB to camelCase for front-end interface
    const products = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      category: r.category,
      image: r.image,
      description: r.description,
      minPlayers: r.min_players,
      maxPlayers: r.max_players,
      playTime: r.play_time,
      stock: r.stock !== undefined ? r.stock : 10
    }));

    // Save in-memory cache
    productsCache.set(products);

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas pobierania produktów." });
  }
});

// Update User Profile Route
app.put("/api/users/:username", checkAuth, async (req, res) => {
  const { username } = req.params;
  const { firstName, lastName, email, phone, address, city, zipCode } = req.body;

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ error: "Imię, nazwisko, adres e-mail oraz numer telefonu są wymagane." });
  }

  try {
    const result = await dbRun(
      `UPDATE Users SET firstName = ?, lastName = ?, email = ?, phone = ?, address = ?, city = ?, zipCode = ? WHERE username = ?`,
      [firstName, lastName, email, phone, address, city, zipCode, username]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika." });
    }

    res.json({ message: "Dane profilu zostały pomyślnie zaktualizowane." });
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas aktualizacji profilu." });
  }
});

// Get User Orders Route
app.get("/api/users/:username/orders", checkAuth, async (req, res) => {
  const { username } = req.params;
  try {
    const rows = await dbAll("SELECT * FROM Orders WHERE username = ? ORDER BY id DESC", [username]);
    const orders = rows.map((r: any) => ({
      id: r.id,
      customerFirstName: r.customer_first_name || (r.customer_name ? r.customer_name.split(" ")[0] : ""),
      customerLastName: r.customer_last_name || (r.customer_name ? r.customer_name.split(" ").slice(1).join(" ") : ""),
      customerEmail: r.customer_email,
      address: r.address,
      city: r.city,
      zipCode: r.zip_code,
      phone: r.phone,
      totalAmount: r.total_amount,
      status: r.status,
      createdAt: r.created_at,
      items: JSON.parse(r.items || "[]")
    }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas pobierania historii zamówień." });
  }
});

// Get Saved Cart Route
app.get("/api/users/:username/cart", checkAuth, async (req, res) => {
  const { username } = req.params;
  try {
    const user = await dbGet("SELECT cart, deliveryType FROM Users WHERE username = ?", [username]);
    if (!user) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika." });
    }
    res.json({
      cart: JSON.parse(user.cart || "[]"),
      deliveryType: user.deliveryType || ""
    });
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas pobierania koszyka." });
  }
});

// Save Cart Route
app.post("/api/users/:username/cart", checkAuth, async (req, res) => {
  const { username } = req.params;
  const { cart, deliveryType } = req.body;
  try {
    const cartJson = JSON.stringify(cart || []);
    const delType = deliveryType || "";
    await dbRun(
      "UPDATE Users SET cart = ?, deliveryType = ? WHERE username = ?",
      [cartJson, delType, username]
    );
    res.json({ message: "Koszyk został pomyślnie zapisany." });
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas zapisywania koszyka." });
  }
});

// Helper to serialize database transactions and prevent SQLite race conditions/concurrency errors
let activeTransactionPromise = Promise.resolve();

async function runInTransaction<T>(callback: () => Promise<T>): Promise<T> {
  const previous = activeTransactionPromise;
  let resolveLock: () => void;
  const next = new Promise<void>((resolve) => {
    resolveLock = resolve;
  });
  activeTransactionPromise = next;

  try {
    await previous;
  } catch (e) {
    // Ignore errors from previous transactions in queue
  }

  try {
    await dbRun("BEGIN TRANSACTION");
    const result = await callback();
    await dbRun("COMMIT");
    return result;
  } catch (error) {
    try {
      await dbRun("ROLLBACK");
    } catch (rollbackErr) {
      console.error("Błąd podczas rollbacku transakcji:", rollbackErr);
    }
    throw error;
  } finally {
    resolveLock!();
  }
}

// Create Order Route
app.post("/api/orders", async (req, res) => {
  const { customerFirstName, customerLastName, customerEmail, address, city, zipCode, phone, items, totalAmount, username } = req.body;

  if (!customerFirstName || !customerLastName || !customerEmail || !address || !city || !zipCode || !phone || !items || !totalAmount) {
    return res.status(400).json({ error: "Wszystkie dane zamówienia są wymagane." });
  }

  try {
    const orderId = await runInTransaction(async () => {
      // 1. Verify stock levels for all products in the cart first
      for (const item of items) {
        const prodId = item.productId || (item.product && item.product.id);
        if (prodId) {
          const product = await dbGet("SELECT name, stock FROM Products WHERE id = ?", [prodId]);
          if (!product) {
            const err = new Error(`Produkt o ID ${prodId} nie został znaleziony.`);
            (err as any).customMessage = true;
            throw err;
          }
          if (product.stock < item.quantity) {
            const err = new Error(`Przepraszamy, produkt '${product.name}' został wykupiony przez innego klienta w międzyczasie. Zmień ilość lub usuń produkt z koszyka.`);
            (err as any).customMessage = true;
            throw err;
          }
        }
      }

      // 2. All items have sufficient stock. Update stock levels.
      for (const item of items) {
        const prodId = item.productId || (item.product && item.product.id);
        if (prodId) {
          await dbRun(
            "UPDATE Products SET stock = stock - ? WHERE id = ?",
            [item.quantity, prodId]
          );
        }
      }

      // 3. Save the order to SQLite
      const status = "Złożone";
      const createdAt = new Date().toISOString();
      const itemsJson = JSON.stringify(items);

      const result = await dbRun(
        `INSERT INTO Orders (customer_first_name, customer_last_name, customer_email, address, city, zip_code, phone, total_amount, status, created_at, items, username)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customerFirstName, customerLastName, customerEmail, address, city, zipCode, phone, totalAmount, status, createdAt, itemsJson, username || null]
      );

      // 4. If logged in, clear saved cart in DB as order is completed
      if (username) {
        await dbRun("UPDATE Users SET cart = '[]' WHERE username = ?", [username]);
      }

      return result.id;
    });

    // Invalidate product cache as stock levels have decreased
    productsCache.clear();

    res.status(201).json({ id: orderId, message: "Zamówienie zostało złożone pomyślnie." });
  } catch (error: any) {
    if (error.customMessage) {
      res.status(400).json({ success: false, message: error.message });
    } else {
      console.error("Błąd podczas zapisywania zamówienia i sprawdzania stanu magazynowego:", error);
      res.status(500).json({ error: "Błąd serwera podczas składania zamówienia." });
    }
  }
});

// Admin Authorization Middleware with JWT integration and support for legacy token
const checkAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  let token = req.cookies?.token;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Support legacy mock token if still used by older components/renders
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer mock-token-admin-Owner")) {
    req.user = { username: "admin", role: "Owner" };
    return next();
  }

  if (!token) {
    return res.status(403).json({ error: "Brak dostępu. Wymagane są uprawnienia właściciela." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
    if (decoded.role !== "Owner") {
      return res.status(403).json({ error: "Brak dostępu. Wymagane są uprawnienia właściciela." });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Nieprawidłowa lub wygasła sesja administratora." });
  }
};

// Get Orders Route (Admin only)
app.get("/api/orders", checkAdmin, async (req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM Orders ORDER BY id DESC");
    const orders = rows.map((r: any) => ({
      id: r.id,
      customerFirstName: r.customer_first_name || (r.customer_name ? r.customer_name.split(" ")[0] : ""),
      customerLastName: r.customer_last_name || (r.customer_name ? r.customer_name.split(" ").slice(1).join(" ") : ""),
      customerEmail: r.customer_email,
      address: r.address,
      city: r.city,
      zipCode: r.zip_code,
      phone: r.phone,
      totalAmount: r.total_amount,
      status: r.status,
      createdAt: r.created_at,
      items: JSON.parse(r.items || "[]")
    }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas pobierania zamówień." });
  }
});

// Update Order Status Route (Admin only)
app.put("/api/orders/:id/status", checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["Złożone", "W realizacji", "Zrealizowane"].includes(status)) {
    return res.status(400).json({ error: "Nieprawidłowy status zamówienia." });
  }

  try {
    const result = await dbRun("UPDATE Orders SET status = ? WHERE id = ?", [status, id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Nie znaleziono zamówienia o podanym ID." });
    }
    res.json({ message: "Status zamówienia został zaktualizowany." });
  } catch (error) {
    res.status(500).json({ error: "Błąd serwera podczas aktualizacji statusu zamówienia." });
  }
});

// Update Product Stock Route (Admin only)
app.put("/api/products/:id/stock", checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;

  if (stock === undefined || typeof stock !== "number" || stock < 0) {
    return res.status(400).json({ error: "Nieprawidłowa wartość stanu magazynowego." });
  }

  try {
    const product = await dbGet("SELECT * FROM Products WHERE id = ?", [id]);
    if (!product) {
      return res.status(404).json({ error: "Nie znaleziono produktu o podanym ID." });
    }

    await dbRun("UPDATE Products SET stock = ? WHERE id = ?", [stock, id]);
    
    // Invalidate product cache so changes reflect instantly
    productsCache.clear();

    res.json({ message: "Stan magazynowy został pomyślnie zaktualizowany.", id: Number(id), stock });
  } catch (error) {
    console.error("Błąd podczas aktualizacji stanu magazynowego:", error);
    res.status(500).json({ error: "Błąd serwera podczas aktualizacji stanu magazynowego." });
  }
});

// -------------------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION SERVING
// -------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serwer działa pod adresem http://localhost:${PORT}`);
  });
}

startServer();
