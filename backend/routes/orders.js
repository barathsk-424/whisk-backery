const express = require('express');
const authenticate = require('../middleware/auth');
const router = express.Router();

// All order routes require authentication
router.use(authenticate);

// ─── POST /api/orders ───────────────────────────────────────────
// Place an order from the user's cart
router.post('/', async (req, res) => {
  try {
    // 1. Fetch the user's cart
    const { data: cartItems, error: cartError } = await req.supabase
      .from('cart')
      .select(`
        id,
        product_id,
        quantity,
        product:products ( id, name, price )
      `)
      .eq('user_id', req.user.id);

    if (cartError) {
      return res.status(500).json({ error: cartError.message });
    }

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add items before placing an order.' });
    }

    // 2. Create one order per cart item (matching your schema: each order has one product)
    const ordersToInsert = cartItems.map((item) => ({
      user_id: req.user.id,
      product_id: item.product_id,
      product_name: item.product?.name || 'Unknown Product',
      price: item.product?.price || 0,
      quantity: item.quantity,
      status: 'pending',
      address: req.body.address || {},
      total_price: (item.product?.price || 0) * item.quantity
    }));

    const { data: orders, error: orderError } = await req.supabase
      .from('orders')
      .insert(ordersToInsert)
      .select();

    if (orderError) {
      console.error('Supabase Order Insert Error:', orderError.message);
      return res.status(500).json({ error: orderError.message });
    }

    // 3. Clear the cart after successful order
    const { error: clearError } = await req.supabase
      .from('cart')
      .delete()
      .eq('user_id', req.user.id);

    if (clearError) {
      console.error('Failed to clear cart:', clearError.message);
    }

    // 4. Calculate total
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    res.status(201).json({
      message: 'Order placed successfully!',
      orders,
      total,
      items_count: orders.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error placing order' });
  }
});

// ─── GET /api/orders ────────────────────────────────────────────
// Get user's order history
router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('orders')
      .select(`
        id,
        quantity,
        status,
        created_at,
        product:products ( id, name, price, image )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ orders: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

// ─── GET /api/orders/:id ────────────────────────────────────────
// Get a single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('orders')
      .select(`
        id,
        quantity,
        status,
        created_at,
        product:products ( id, name, price, image )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching order' });
  }
});

module.exports = router;
