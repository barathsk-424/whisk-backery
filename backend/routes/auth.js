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

// ─── EMAIL SERVICE (Resend) ─────────────────────────────────────
const { Resend } = require("resend");
const resendClient = new Resend(process.env.RESEND_API_KEY || "re_placeholder");


// ─── POST /api/auth/forgot-password ──────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  const userEmail = email.trim().toLowerCase();
  console.log(`\n[AUTH] FORGOT PASSWORD ATTEMPT: ${userEmail}`);

  try {
    // 1. Look up user in users table, then admins table
    let userId = null;
    let userSource = null;

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (user) {
      userId = user.id;
      userSource = "users";
    } else {
      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (admin) {
        userId = admin.id;
        userSource = "admins";
      }
    }

    // 2. Always return success to prevent email enumeration
    if (!userId) {
      return res.json({ success: true, message: "If this email is registered, a reset link has been sent." });
    }

    // 3. Generate cryptographically secure random token
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

    // 4. Invalidate any existing unused tokens for this user
    await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("used_at", null);

    // 5. Store hashed token in database (raw token is NEVER stored or logged)
    const { error: insertErr } = await supabase
      .from("password_reset_tokens")
      .insert([{
        user_id: userId,
        user_source: userSource,
        token_hash: tokenHash,
        expires_at: expiresAt,
      }]);

    if (insertErr) {
      console.error("   → Failed to store reset token record.");
      return res.status(500).json({ success: false, message: "Server error. Please try again." });
    }

    // 6. Construct reset URL (NO email in URL — user identified from token only)
    const origin = req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(rawToken)}`;

    // 7. Send email via Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_placeholder") {
      try {
        await resendClient.emails.send({
          from: "The Whisk <orders@resend.dev>",
          to: [userEmail],
          subject: "🔐 Password Reset — The Whisk Bakery",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 30px; background: #FFF9F5; border-radius: 20px; border: 1px solid #F0E6DC;">
              <div style="text-align: center; margin-bottom: 30px;">
                <span style="font-size: 48px;">🧁</span>
                <h1 style="color: #4A2A1A; font-size: 24px; margin: 10px 0 0;">The Whisk Bakery</h1>
              </div>
              <p style="color: #6B4C3B; font-size: 15px; line-height: 1.7;">
                We received a request to reset your password. Click the button below to set a new password:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background: #4A2A1A; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; letter-spacing: 1px;">
                  RESET PASSWORD
                </a>
              </div>
              <p style="color: #9B8578; font-size: 12px; line-height: 1.6;">
                This link expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #F0E6DC; margin: 25px 0;" />
              <p style="color: #C4B0A0; font-size: 11px; text-align: center;">
                The Whisk Bakery • Chennai
              </p>
            </div>
          `,
        });
        console.log(`   → Reset email dispatched to ${userEmail}`);
      } catch (emailErr) {
        console.error("   → Email delivery failed. Check RESEND_API_KEY configuration.");
      }
    } else {
      console.warn("   → RESEND_API_KEY not configured. Email delivery skipped.");
    }

    return res.json({ success: true, message: "If this email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("   → SYSTEM ERROR FORGOT PASSWORD:", err.message);
    res.status(500).json({ success: false, message: "Server error during password reset" });
  }
});


// ─── POST /api/auth/reset-password ──────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Reset token is required.' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  console.log(`\n[AUTH] PASSWORD RESET ATTEMPT`);

  try {
    // 1. Hash the incoming token and look it up
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: resetRecord, error: lookupErr } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, user_source, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .maybeSingle();

    if (lookupErr || !resetRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link. Please request a new one." });
    }

    // 2. Check expiration
    if (new Date(resetRecord.expires_at) < new Date()) {
      // Mark as used so it cannot be retried
      await supabase
        .from("password_reset_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", resetRecord.id);
      return res.status(400).json({ success: false, message: "This reset link has expired. Please request a new one." });
    }

    // 3. Hash the new password using the SAME method as login/signup
    const hashedPassword = hashPassword(newPassword);

    // 4. Update password in the appropriate table ('users' or 'admins')
    const { error: updateErr } = await supabase
      .from(resetRecord.user_source)
      .update({ password: hashedPassword })
      .eq("id", resetRecord.user_id);

    if (updateErr) {
      console.error("   → Failed to update password.");
      return res.status(500).json({ success: false, message: "Failed to update password. Please try again." });
    }

    // 5. Mark token as used (prevents reuse)
    await supabase
      .from("password_reset_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", resetRecord.id);

    console.log(`   → Password reset successful.`);
    return res.json({ success: true, message: "Password updated successfully! You can now sign in with your new password." });
  } catch (err) {
    console.error("   → SYSTEM ERROR RESET PASSWORD:", err.message);
    res.status(500).json({ success: false, message: "Server error during password reset." });
  }
});

module.exports = router;
