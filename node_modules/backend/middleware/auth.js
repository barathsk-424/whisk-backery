const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const JWT_SECRET = process.env.JWT_SECRET || 'the-whisk-secret-key-12345';

// Middleware: Verify custom JWT and attach user info
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded user (id and role) to request
    req.user = decoded;
    
    // Attach a standard supabase client for general queries
    // Note: This no longer uses the token for RLS, but for admin bypass we'll handle that in admin routes
    req.supabase = supabase;
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
