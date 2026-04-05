const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "SECRET";

// ─── Supabase Configuration ──────────────────────────────────────
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  "https://cqdxnjhyoxqxofyhzgov.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxZHhuamh5b3hxeG9meWh6Z292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1ODYzNjcsImV4cCI6MjA5MDE2MjM2N30.gOMC8DwXfGPM1IOwwpJdOU6YVoAQCHvuF1tW5Sd3WzI",
);

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
app.use(cors());
app.use(express.json());

// ─── EMAIL VALIDATION UTILITY ───
const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "tempmail.com",
  "guerrillamail.com",
  "10minutemail.com",
  "yopmail.com",
  "throwawaymail.com",
  "sharklasers.com",
  "getnada.com",
  "dispostable.com",
  "trashmail.com",
  "maildrop.cc",
];

const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  const match = email.match(regex);
  if (!match)
    return {
      valid: false,
      message: "Please provide a valid artisan email format.",
    };

  const domain = match[1].toLowerCase();
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return {
      valid: false,
      message: "Disposable artisan identities are not permitted for registry.",
    };
  }

  return { valid: true };
};

// ─── Route Registration ──────────────────────────────────────────
const productRoutes = require("./routes/products");
const invoiceRoutes = require("./routes/invoices");

app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);

// ─── ARTISAN MEMBERSHIP (SIGNUP) ──────────────────────
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  const userEmail = email?.trim().toLowerCase();

  console.log(`\n[MEMBERSHIP] Registration attempt: ${userEmail}`);

  // ── Email Guard ──
  const validation = isValidEmail(userEmail);
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  try {
    // 1. Validate if user already exists
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (existingAdmin || existingUser) {
      return res
        .status(400)
        .json({ message: "Artisan already exists in the registry." });
    }

    // 2. Insert into shared Artisan Ledger (users table)
    const { data: newUser, error: regError } = await supabase
      .from("users")
      .insert([
        {
          name: name || "New Artisan",
          email: userEmail,
          password: password,
          role: "user",
          created_at: new Date(),
        },
      ])
      .select()
      .single();

    if (regError) throw regError;

    console.log(
      `   → OK: New Artisan registered: ${newUser?.email || userEmail}`,
    );
    res
      .status(201)
      .json({ message: "Registration successful. Welcome to the community!" });
  } catch (err) {
    console.error("   → SYSTEM ERROR SIGNUP:", err.message);
    res.status(500).json({ message: "Backend error during registration." });
  }
});

// ─── ARTISAN AUTHENTICATION (LOGIN) ─────────────────────────────
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userEmail = email?.trim().toLowerCase();

  console.log(`\n[AUTH] LOGIN ATTEMPT: ${userEmail}`);

  try {
    // 1. MASTER VAULT SEARCH
    const { data: masterAdmin, error: adminErr } = await supabase
      .from("admins")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();

    if (adminErr) {
      console.error("[AUTH] Admin Search ERROR:", adminErr);
      return res.status(500).json({
        message: "Master vault lookup failure: " + adminErr.message,
        details: adminErr,
      });
    }

    if (masterAdmin && masterAdmin.password === password) {
      console.log(
        `   → Success: Master Admin Access Granted: ${masterAdmin.email}`,
      );
      const token = jwt.sign(
        {
          id: masterAdmin.id,
          email: masterAdmin.email,
          role: "admin",
          source: "master",
        },
        JWT_SECRET,
        { expiresIn: "1d" },
      );
      return res.json({
        token,
        user: {
          id: masterAdmin.id,
          email: masterAdmin.email,
          role: "admin",
          name: masterAdmin.name,
        },
      });
    }

    // 2. GENERAL USER SEARCH (MEMBERS)
    let { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();

    if (userErr) {
      console.error("[AUTH] User Search ERROR:", userErr.message);
      return res
        .status(500)
        .json({ message: "Registry lookup failure: " + userErr.message });
    }

    if (user) {
      if (user.password === password) {
        console.log(`   → Success: Member Session Initialized: ${user.email}`);
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role || "user",
            source: "general",
          },
          JWT_SECRET,
          { expiresIn: "1d" },
        );
        return res.json({
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role || "user",
            name: user.name,
          },
        });
      } else {
        return res.status(401).json({ message: "Invalid password" });
      }
    }

    return res
      .status(401)
      .json({
        message: "Artisan not found in registry (Search: " + userEmail + ")",
      });
  } catch (err) {
    console.error("   → SYSTEM ERROR LOGIN:", err.message);
    res.status(500).json({ message: "Server error during authentication" });
  }
});

// ─── FORGOT PASSWORD (REQUEST RECOVERY) ───────────────────
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const userEmail = email?.trim().toLowerCase();

  console.log(`\n[AUTH] PASSWORD RESET REQUEST: ${userEmail}`);

  try {
    const { data, error } =
      await supabase.auth.resetPasswordForEmail(userEmail);
    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: "Recovery instructions sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Recovery relay failure." });
  }
});

// ─── RESET PASSWORD (UPDATE CIPHER) ─────────────────────────────
app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  console.log(`\n[AUTH] PASSWORD UPDATE ATTEMPT`);

  try {
    // We need to use the token to authenticate the request for password update
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );

    const { data, error } = await userSupabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.log(`   → RESET FAILED: ${error.message}`);
      return res.status(400).json({ message: error.message });
    }

    console.log(`   → SUCCESS: Cipher updated for ${data.user.email}`);
    res.json({ message: "Cipher updated successfully. Identity re-secured." });
  } catch (err) {
    console.error("   → SYSTEM ERROR RESET PWD:", err.message);
    res.status(500).json({ message: "Master vault update failure." });
  }
});

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

app.listen(PORT, () => {
  console.log(`\n🚀 ARTISAN BACKEND ONLINE → http://localhost:${PORT}`);
  console.log(`📦 MONITORING CHANNEL: cqdxnjhyoxqxofyhzgov.supabase.co\n`);
});
