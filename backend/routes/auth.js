const express = require('express');
const { supabase } = require('../config/supabase');
const jwt = require("jsonwebtoken");
const router = express.Router();

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

    // 2. Register user in Supabase Auth (auth.users)
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: userEmail,
      password: password,
      options: {
        data: { full_name: name || "New Artisan" },
      },
    });

    if (authErr) {
      console.warn("⚠️ Supabase Auth registration note:", authErr.message);
    }

    // 3. Insert into shared Artisan Ledger (users table)
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
      `   → OK: New Artisan registered in Auth & DB: ${newUser?.email || userEmail}`,
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
    // 1. MASTER VAULT SEARCH (Admins)
    const { data: masterAdmin, error: adminErr } = await supabase
      .from("admins")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();

    if (adminErr) {
      console.error("[AUTH] Admin Search ERROR:", adminErr);
      return res.status(500).json({
        success: false,
        message: "Master vault lookup failure: " + adminErr.message,
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

    // 2. SUPABASE AUTH SEARCH (auth.users)
    let authAuthenticated = false;
    let authUser = null;

    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (!authErr && authData?.user) {
      authAuthenticated = true;
      authUser = authData.user;
    }

    // 3. GENERAL USER SEARCH (public.users table)
    let { data: user, error: userErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", userEmail)
      .maybeSingle();

    if (userErr) {
      console.error("[AUTH] User Search ERROR:", userErr.message);
      return res
        .status(500)
        .json({ success: false, message: "Registry lookup failure: " + userErr.message });
    }

    // Branch A: Authenticated via Supabase Auth (e.g. after password reset)
    if (authAuthenticated) {
      console.log(`   → Success: Supabase Auth Session Verified: ${userEmail}`);

      // Keep public.users table synchronized with the new password
      if (user && user.password !== password) {
        await supabase
          .from("users")
          .update({ password: password })
          .eq("email", userEmail);
        user.password = password;
      } else if (!user) {
        const { data: createdUser } = await supabase
          .from("users")
          .insert([
            {
              name: authUser.user_metadata?.full_name || userEmail.split("@")[0],
              email: userEmail,
              password: password,
              role: "user",
              created_at: new Date(),
            },
          ])
          .select()
          .single();
        user = createdUser;
      }

      const token = jwt.sign(
        {
          id: user?.id || authUser.id,
          email: userEmail,
          role: user?.role || "user",
          source: "general",
        },
        JWT_SECRET,
        { expiresIn: "1d" },
      );

      return res.json({
        success: true,
        token,
        user: {
          id: user?.id || authUser.id,
          email: userEmail,
          role: user?.role || "user",
          name: user?.name || userEmail.split("@")[0],
        },
      });
    }

    // Branch B: Fallback check against public.users table (legacy records)
    if (user) {
      if (user.password === password) {
        console.log(`   → Success: Member Session Initialized via DB: ${user.email}`);

        // Try syncing to Supabase Auth so future resets work smoothly
        supabase.auth.signUp({ email: userEmail, password }).catch(() => {});

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
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role || "user",
            name: user.name,
          },
        });
      } else {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    }

    return res
      .status(401)
      .json({
        success: false,
        message: "Artisan not found in registry (Search: " + userEmail + ")",
      });
  } catch (err) {
    console.error("   → SYSTEM ERROR LOGIN:", err.message);
    res.status(500).json({ success: false, message: "Server error during authentication" });
  }
});

// ─── POST /api/auth/forgot-password ─────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl.replace(/\/+$/, '')}/reset-password`,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error during forgot password request' });
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

module.exports = router;
