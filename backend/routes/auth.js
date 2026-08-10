const express = require('express');
const { supabase } = require('../config/supabase');
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const JWT_SECRET = process.env.JWT_SECRET || "SECRET";

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


// ─── POST /api/auth/signup ──────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || typeof email !== 'string' || !password || !name) {
    return res.status(400).json({ success: false, message: 'Valid name, email, and password are required' });
  }
  const userEmail = email.trim().toLowerCase();

  console.log(`\n[MEMBERSHIP] Registration attempt: ${userEmail}`);

  // ── Email Guard ──
  const validation = isValidEmail(userEmail);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
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
        .json({ success: false, message: "Artisan already exists in the registry." });
    }

    // 2. Insert the public profile into the users table with a hashed password
    const newUserId = crypto.randomUUID();
    const { data: newUser, error: regError } = await supabase
      .from("users")
      .insert([
        {
          id: newUserId,
          name: name || "New Artisan",
          email: userEmail,
          password: hashPassword(password),
          role: "user",
        },
      ])
      .select()
      .single();

    if (regError) {
      console.error("   → Database insert error:", regError.message);
      return res.status(500).json({ 
        success: false, 
        message: "Registration failed due to database error. Please try again." 
      });
    }

    console.log(
      `   → OK: New Artisan registered in DB: ${newUser?.email || userEmail}`,
    );
    res
      .status(201)
      .json({ success: true, message: "Registration successful. Welcome to the community!" });
  } catch (err) {
    console.error("   → SYSTEM ERROR SIGNUP:", err.message);
    res.status(500).json({ success: false, message: "Backend error during registration." });
  }
});


// ─── POST /api/auth/login ───────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || typeof email !== 'string' || !password) {
    return res.status(400).json({ success: false, message: 'Valid email and password are required' });
  }
  const userEmail = email.trim().toLowerCase();

  console.log(`\n[AUTH] LOGIN ATTEMPT: ${userEmail}`);

  try {
    // 1. Check if user is a Master Admin (Admins Table)
    const { data: masterAdmin, error: adminErr } = await supabase
      .from("admins")
      .select("id, name, email, password")
      .eq("email", userEmail)
      .maybeSingle();

    if (masterAdmin && !adminErr) {
      // Legacy compatibility: check plain text and hashed
      if (masterAdmin.password === password || masterAdmin.password === hashPassword(password)) {
        console.log(`   → Success: Master Admin Access Granted: ${masterAdmin.email}`);
        const token = jwt.sign(
          {
            id: masterAdmin.id,
            email: masterAdmin.email,
            role: "admin",
            source: "master",
          },
          JWT_SECRET,
          { expiresIn: "1d" }
        );
        return res.json({
          success: true,
          token,
          user: {
            id: masterAdmin.id,
            email: masterAdmin.email,
            role: "admin",
            name: masterAdmin.name,
          },
        });
      }
    }

    // 2. Fetch public profile (users table)
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, name, email, role, password")
      .eq("email", userEmail)
      .maybeSingle();

    if (userErr || !user) {
      console.error("[AUTH] Login failed: User not found");
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Legacy compatibility: check plain text and hashed
    if (user.password !== password && user.password !== hashPassword(password)) {
      console.error("[AUTH] Login failed: Incorrect password");
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    console.log(`   → Success: User Session Verified: ${userEmail}`);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || "user",
        source: "database",
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || "user",
        name: user.name || user.email.split("@")[0],
      },
    });
  } catch (err) {
    console.error("   → SYSTEM ERROR LOGIN:", err.message);
    res.status(500).json({ success: false, message: "Server error during authentication" });
  }
});

// ─── GET /api/auth/profile (protected) ──────────────────────────
const authenticate = require('../middleware/auth');

router.get('/profile', authenticate, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.json({ success: true, user: data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  const userEmail = email.trim().toLowerCase();
  console.log(`\n[AUTH] FORGOT PASSWORD ATTEMPT: ${userEmail}`);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail);

    if (error) {
      console.error("[AUTH] Forgot password error:", error.message);
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.json({ success: true, message: "Reset link sent! Please check your inbox. 📧" });
  } catch (err) {
    console.error("   → SYSTEM ERROR FORGOT PASSWORD:", err.message);
    res.status(500).json({ success: false, message: "Server error during password reset" });
  }
});

module.exports = router;
