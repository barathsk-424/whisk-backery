const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Polyfill global WebSocket for Node.js environments where native WebSocket is missing (< Node 22)
let ws;
try {
  ws = require('ws');
} catch (e) {
  // ws module fallback
}

if (typeof globalThis.WebSocket === 'undefined' && ws) {
  globalThis.WebSocket = ws;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

// Client configuration disabling unnecessary Realtime WebSocket connections
const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    autoConnect: false,
    ...(ws ? { WebSocket: ws } : {}),
  },
};

// Default backend Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

// Helper function to create custom client with specific token / options
const createUserClient = (accessToken) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...clientOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

module.exports = { supabase, createUserClient, clientOptions };
