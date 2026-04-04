const express = require('express');
const { supabase } = require('../config/supabase');
const router = express.Router();

// ─── POST /api/auth/signup ──────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }, // This is used by the trigger to populate users.name
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
      },
      // Session is returned when email auto-confirm is enabled
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_in: data.session.expires_in,
          }
        : null,
      note: !data.session
        ? 'Email confirmation required. Check your inbox or enable auto-confirm in Supabase Dashboard → Auth → Settings.'
        : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_in: data.session.expires_in,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error during login' });
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
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

module.exports = router;
