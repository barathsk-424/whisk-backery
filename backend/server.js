const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "SECRET";

// ─── Supabase Configuration ──────────────────────────────────────
const { supabase, createUserClient } = require("./config/supabase");

// ─── MongoDB Connection (Optional/Stabilization) ────────────────
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ Local Artisan Vault (MongoDB) Connected."))
    .catch((err) =>
      console.warn("⚠️ Artisan Vault (MongoDB) Unavailable:", err.message),
    );
}

// ─── Middleware ──────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    process.env.FRONTEND_URL?.replace(/\/+$/, ''), 
    "http://localhost:5174", 
    "http://localhost:5173"
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());


// ─── AUTHENTICATION MIDDLEWARE ──────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session token" });
  }
};

const adminOnly = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user && req.user.role === "admin") next();
    else res.status(403).json({ message: "Admin clearance required" });
  });
};

// ─── Route Registration ──────────────────────────────────────────
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");
const adminRoutes   = require("./routes/admin");
const authRoutes    = require("./routes/auth");
const cartRoutes    = require("./routes/cart");
const orderRoutes   = require("./routes/order");
const ordersRoutes  = require("./routes/orders");
const transactionRoutes = require("./routes/transactions");

app.use("/api/products",     productRoutes);
app.use("/api/invoices",     invoiceRoutes);
app.use("/api/admin",        adminRoutes);
app.use("/api/auth",         authRoutes);
app.use("/api/cart",         cartRoutes);
app.use("/api/order",        orderRoutes);
app.use("/api/orders",       ordersRoutes);
app.use("/api/transactions", transactionRoutes);


// ─── FINANCE TRANSACTIONS ─────────────────────────────────────────
app.get("/api/transactions", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    
    if (error) throw error;
    
    // Filter by user email if not admin
    const filtered = req.user.role === "admin" 
      ? data 
      : data.filter(t => t.user_email === req.user.email || !t.user_id); // Fallback logic
      
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: "Finance ledger unreachable." });
  }
});

app.post("/api/transactions", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .insert([{ ...req.body, user_email: req.user.email }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to record transaction." });
  }
});

app.put("/api/transactions/:id", authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to calibrate transaction record." });
  }
});

app.delete("/api/transactions/:id", authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Artisan record purged." });
  } catch (err) {
    res.status(500).json({ message: "Purge sequence failed." });
  }
});


// ─── ADMIN DASHBOARD DATA (Bypassing RLS via Backend Logic) ───────────────

app.get("/api/admin-dashboard", adminOnly, async (req, res) => {
  try {
    const [orders, products, users, bundles] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("bundles").select("*").order("created_at", { ascending: false }),
    ]);

    if (orders.error) throw orders.error;
    if (products.error) throw products.error;
    if (users.error) throw users.error;
    if (bundles.error) throw bundles.error;

    // 5. Fetch Contacts/Messages
    const { data: contacts, error: contactsErr } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });

    // 6. Fetch Global Reviews
    const { data: reviews, error: reviewsErr } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    // 7. Fetch Feedback
    const { data: feedback, error: feedbackErr } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (orders.error || products.error || users.error || bundles.error || contactsErr || reviewsErr || feedbackErr) {
      throw new Error("Complex Data Retrieval Interrupted");
    }

    res.json({
      orders: orders.data,
      products: products.data,
      users: users.data,
      bundles: bundles.data,
      contacts,
      reviews,
      feedback
    });
  } catch (err) {
    console.error("[MONITORING ERROR]:", err.message);
    res.status(500).json({ message: "Failed to harmonize artisan intelligence: " + err.message });
  }
});

// Removed duplicate /forgot-password endpoint; handled by /api/auth/forgot-password router.

// Removed backend /reset-password API. Password reset is handled purely on the client side via supabase.auth.updateUser().


app.get("/", async (req, res) => {
  let supabaseStatus = "connected";
  let mongodbStatus = "disconnected";

  try {
    // Check Supabase connection by querying products count
    const { error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (error) {
      console.error("[HEALTH] Supabase query error:", error.message);
      supabaseStatus = "unreachable";
    }
  } catch (err) {
    supabaseStatus = "error";
  }

  // Check MongoDB connection (if mongoose is supposed to be used)
  if (mongoose.connection.readyState === 1) {
    mongodbStatus = "connected";
  } else if (mongoose.connection.readyState === 2) {
    mongodbStatus = "connecting";
  }

  res.json({
    status: "ok",
    message: "🍰 The Whisk Unified Node.js API is active!",
    supabase: supabaseStatus,
    mongodb: mongodbStatus,
    timestamp: new Date(),
  });
});

app.patch("/api/orders/:id", adminOnly, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log(`[ADMIN] Status sync triggered for order ${id} -> ${status}`);

  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    if (!data) {
      return res.status(404).json({ message: "No record detected at specified coordinates. Verify ID signature." });
    }

    res.json(data);
  } catch (err) {
    console.error("[SYNC ERROR]:", err.message);
    res.status(500).json({ message: "Failed to bridge synchronize operational state: " + err.message });
  }
});

// ─── ARTISAN ORDER PROXY (RELIABILITY BRIDGE) ──────────────────────
app.get("/api/orders", async (req, res) => {
  const { user_id, email } = req.query;
  console.log(`[PROXY] Order Retrieval Request: ${email || user_id}`);

  try {
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (user_id) query = query.eq("user_id", user_id);
    else if (email) query = query.eq("user_email", email);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("[PROXY ERROR]:", err.message);
    res.status(500).json({ message: "Failed to bridge to Supabase." });
  }
});


// ─── API 404 CATCH-ALL ───────────────────────────────────────────
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found." });
});

// --- ERROR HANDLERS ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ PORT ${PORT} IS ALREADY IN USE. PLEASE KILL EXISTING PROCESSES.`);
    }
    process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 ARTISAN BACKEND ONLINE → http://localhost:${PORT}`);
  console.log(`📦 MONITORING CHANNEL: cqdxnjhyoxqxofyhzgov.supabase.co\n`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ ERROR: PORT ${PORT} IS ALREADY IN USE!`);
        console.error(`   An Artisan session is already active somewhere else.`);
        console.error(`   Please close old terminals or use "taskkill /F /IM node.exe" in Windows PowerShell.\n`);
        process.exit(1);
    }
});
