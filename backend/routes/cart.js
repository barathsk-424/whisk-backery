const express = require('express');
const authenticate = require('../middleware/auth');
const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// ─── GET /api/cart ───────────────────────────────────────────────
// Get user's cart with product details
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('cart')
      .select(`
        id,
        quantity,
        created_at,
        product:products ( id, name, price, image )
      `)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Calculate total
    const total = data.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    res.json({ cart: data, total });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching cart' });
  }
});

// ─── POST /api/cart ─────────────────────────────────────────────
// Add a product to cart (or increment quantity if already exists)
router.post('/', async (req, res) => {
  const { product_id, quantity = 1 } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'product_id is required' });
  }

  try {
    // Check if item already in cart
    const { data: existing } = await req.supabase
      .from('cart')
      .select('id, quantity')
      .eq('user_id', req.user.id)
      .eq('product_id', product_id)
      .maybeSingle();

    if (existing) {
      // Update quantity
      const { data, error } = await req.supabase
        .from('cart')
        .update({ quantity: existing.quantity + quantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ message: 'Cart updated', item: data });
    }

    // Insert new item
    const { data, error } = await req.supabase
      .from('cart')
      .insert({
        user_id: req.user.id,
        product_id,
        quantity,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ message: 'Added to cart', item: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error adding to cart' });
  }
});

// ─── PUT /api/cart/:id ──────────────────────────────────────────
// Update cart item quantity
router.put('/:id', async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'quantity must be at least 1' });
  }

  try {
    const { data, error } = await req.supabase
      .from('cart')
      .update({ quantity })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.json({ message: 'Cart updated', item: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating cart' });
  }
});

// ─── DELETE /api/cart/:id ───────────────────────────────────────
// Remove item from cart
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('cart')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Server error removing from cart' });
  }
});

module.exports = router;
