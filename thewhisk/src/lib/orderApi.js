/**
 * orderApi.js
 * ─────────────────────────────────────────────────────────────
 * Thin API wrapper for order operations.
 *
 * Strategy:
 *   1. Try the Node/Express backend at http://localhost:5000
 *   2. If the backend is unreachable (network error / 503) fall
 *      back to Supabase via useStore (handled in caller).
 *   3. localStorage is ALWAYS updated as an offline cache.
 * ─────────────────────────────────────────────────────────────
 */

import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * apiFetch
 * Specialized fetch wrapper for backend communication.
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/* ─────────────────────────────────────────────────── *
 *  PLACE ORDER
 * ─────────────────────────────────────────────────── */
export async function placeOrderAPI(orderPayload) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select()
      .single();

    if (error) throw error;

    // Mirror to localStorage
    _saveToLocalStorage(data);
    return { success: true, order: data, source: 'supabase' };
  } catch (err) {
    console.error('[orderApi] placeOrder error:', err.message);
    return { success: false, error: err.message };
  }
}

/* ─────────────────────────────────────────────────── *
 *  GET ALL ORDERS (HYBRID BRIDGE)
 * ─────────────────────────────────────────────────── */
export async function getOrdersAPI({ user_id, email } = {}) {
  try {
    // Stage 1: Try the Backend Resilience Bridge
    const params = new URLSearchParams();
    if (user_id) params.append('user_id', user_id);
    if (email) params.append('email', email);
    
    console.debug('[orderApi] Attempting Backend Synchronization...');
    const response = await apiFetch(`/api/orders?${params.toString()}`);
    
    if (response.ok) {
       const data = await response.json();
       console.log('[orderApi] Bridge Sync Complete (Source: Backend)');
       return { success: true, orders: data, source: 'backend' };
    }

    // Stage 2: Fallback to Direct Supabase (if backend is unreachable or fails)
    console.debug('[orderApi] Backend Silent, attempting Direct Link...');
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (user_id) query = query.eq('user_id', user_id);
    if (email) query = query.eq('user_email', email);
    
    const { data, error } = await query;
    if (error) throw error;

    return { success: true, orders: data, source: 'supabase' };
  } catch (err) {
    // Stage 3: Operational History Recovery (localStorage)
    console.warn('[orderApi] Total Network Silence. Recovering Archive from Local Cache:', err.message);
    const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    return { success: true, orders: hist.reverse(), source: 'localstorage' };
  }
}

/* ─────────────────────────────────────────────────── *
 *  GET SINGLE ORDER
 * ─────────────────────────────────────────────────── */
export async function getOrderByIdAPI(id) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, order: data, source: 'supabase' };
  } catch (_) {
    const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
    const order = hist.find((o) => o.id === id);
    if (order) return { success: true, order, source: 'localstorage' };
    return { success: false, error: 'Order not found' };
  }
}

/* ─────────────────────────────────────────────────── *
 *  UPDATE STATUS
 * ─────────────────────────────────────────────────── */
export async function updateOrderStatusAPI(id, status) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    _updateStatusInLocalStorage(id, status);
    return { success: true, order: data, source: 'supabase' };
  } catch (_) {
    _updateStatusInLocalStorage(id, status);
    return { success: true, source: 'localstorage' };
  }
}

/* ─────────────────────────────────────────────────── *
 *  DELETE ORDER
 * ─────────────────────────────────────────────────── */
export async function deleteOrderAPI(id) {
  try {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;

    _deleteFromLocalStorage(id);
    return { success: true, source: 'supabase' };
  } catch (_) {
    _deleteFromLocalStorage(id);
    return { success: true, source: 'localstorage' };
  }
}

/* ─────────────────────────────────────────────────── *
 *  CHECK BACKEND HEALTH
 * ─────────────────────────────────────────────────── */
export async function checkBackendHealth() {
  try {
    const res  = await apiFetch('/');
    const data = await res.json();
    return {
      online:  true,
      mongodb: data.mongodb,
      supabase: data.supabase,
    };
  } catch (_) {
    return { online: false, mongodb: 'disconnected', supabase: 'unknown' };
  }
}

/* ─────────────────────────────────────────────────── *
 *  localStorage helpers (private)
 * ─────────────────────────────────────────────────── */
function _saveToLocalStorage(order) {
  if (!order) return;
  const normalized = {
    id:             order.id     || order.orderId || `ORD-${Date.now()}`,
    items:          order.items  || [],
    total:          order.total  || 0,
    address:        order.address || {},
    payment_method: order.payment_method || 'upi',
    status:         order.status || 'Confirmed',
    date:           order.date   || new Date().toISOString(),
  };

  localStorage.setItem('lastOrder', JSON.stringify(normalized));

  const hist = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  // Avoid duplicates
  const withoutDupe = hist.filter((o) => o.id !== normalized.id);
  withoutDupe.push(normalized);
  localStorage.setItem('orderHistory', JSON.stringify(withoutDupe));
}

function _updateStatusInLocalStorage(id, status) {
  const hist    = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const updated = hist.map((o) => (o.id === id ? { ...o, status } : o));
  localStorage.setItem('orderHistory', JSON.stringify(updated));

  const last = JSON.parse(localStorage.getItem('lastOrder') || '{}');
  if (last.id === id) {
    localStorage.setItem('lastOrder', JSON.stringify({ ...last, status }));
  }
}

function _deleteFromLocalStorage(id) {
  const hist     = JSON.parse(localStorage.getItem('orderHistory') || '[]');
  const filtered = hist.filter((o) => o.id !== id);
  localStorage.setItem('orderHistory', JSON.stringify(filtered));
}
