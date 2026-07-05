const express = require('express');
const { supabase } = require('../config/supabase');
const authenticate = require('../middleware/auth');
const router = express.Router();

// Middleware: Verify if user has admin role in JWT
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  res.status(403).json({ error: 'Access Denied: Admin role required' });
};

router.use(authenticate);
router.use(requireAdmin);

// ─── Products ───────────────────────────────────────────────────
// POST /api/admin/products
router.post('/products', async (req, res) => {
  const { name, base_price, price, image, tags, rating, description, stock_quantity } = req.body;
  if (!name || (base_price === undefined && price === undefined)) {
    return res.status(400).json({ error: 'name and price are required' });
  }

  const pPrice = base_price || price;

  try {
    const { data, error } = await req.supabase
      .from('products')
      .insert({ 
        name, 
        price: pPrice, 
        image: image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
        tags: tags || [],
        rating: rating || 5.0,
        description: description || '',
        stock_quantity: stock_quantity || 100
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ product: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error creating product' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  const updates = req.body;
  
  if (updates.base_price) {
    updates.price = updates.base_price;
    delete updates.base_price;
  }
  if (updates.image_url) {
    updates.image = updates.image_url;
    delete updates.image_url;
  }

  try {
    const { data, error } = await req.supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ product: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

// ─── Orders ─────────────────────────────────────────────────────
// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ orders: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// ─── Products ───────────────────────────────────────────────────
// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ products: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// ─── Users ──────────────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ users: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status is required' });

  try {
    const { data, error } = await req.supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ order: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating order' });
  }
});

// ─── Users ──────────────────────────────────────────────────────
// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ users: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('users')
      .delete()
      .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;
