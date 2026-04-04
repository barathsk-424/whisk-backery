const express = require('express');
const router  = express.Router();
let Order;

// Lazy-load the model (only works when Mongo is connected)
function getModel() {
  if (!Order) {
    try { Order = require('../models/Order'); } catch (_) {}
  }
  return Order;
}

/* ── POST /api/order  — Place a new order ─────────── */
router.post('/', async (req, res) => {
  try {
    const Model = getModel();
    if (!Model) return res.status(503).json({ error: 'MongoDB not connected' });

    const { items, total, address, payment_method, user_id, user_email } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in order' });
    }
    if (!total || total <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    const newOrder = new Model({
      items,
      total,
      address:        address        || {},
      payment_method: payment_method || 'upi',
      user_id:        user_id        || null,
      user_email:     user_email     || null,
      status: 'Confirmed',
    });

    const saved = await newOrder.save();

    res.status(201).json({
      success: true,
      order: {
        id:             saved.orderId,
        _id:            saved._id,
        items:          saved.items,
        total:          saved.total,
        address:        saved.address,
        payment_method: saved.payment_method,
        status:         saved.status,
        date:           saved.date,
      },
    });
  } catch (err) {
    console.error('POST /api/order error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/order  — All orders (admin / public) ── */
router.get('/', async (req, res) => {
  try {
    const Model = getModel();
    if (!Model) return res.status(503).json({ error: 'MongoDB not connected' });

    const { status, user_id } = req.query;
    const filter = {};
    if (status)  filter.status  = status;
    if (user_id) filter.user_id = user_id;

    const orders = await Model.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => ({
        id:             o.orderId,
        _id:            o._id,
        items:          o.items,
        total:          o.total,
        address:        o.address,
        payment_method: o.payment_method,
        status:         o.status,
        date:           o.date,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── GET /api/order/:id  — Single order ─────────── */
router.get('/:id', async (req, res) => {
  try {
    const Model = getModel();
    if (!Model) return res.status(503).json({ error: 'MongoDB not connected' });

    // Support both orderId (ORD-xxx) and Mongo _id
    const query = req.params.id.startsWith('ORD-')
      ? { orderId: req.params.id }
      : { _id:    req.params.id };

    const order = await Model.findOne(query);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── PUT /api/order/:id  — Update status ────────── */
router.put('/:id', async (req, res) => {
  try {
    const Model = getModel();
    if (!Model) return res.status(503).json({ error: 'MongoDB not connected' });

    const { status } = req.body;
    const validStatuses = ['Confirmed', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Use one of: ${validStatuses.join(', ')}` });
    }

    const query = req.params.id.startsWith('ORD-')
      ? { orderId: req.params.id }
      : { _id:    req.params.id };

    const updated = await Model.findOneAndUpdate(
      query,
      { ...(status && { status }) },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── DELETE /api/order/:id  — Delete order ──────── */
router.delete('/:id', async (req, res) => {
  try {
    const Model = getModel();
    if (!Model) return res.status(503).json({ error: 'MongoDB not connected' });

    const query = req.params.id.startsWith('ORD-')
      ? { orderId: req.params.id }
      : { _id:    req.params.id };

    const deleted = await Model.findOneAndDelete(query);
    if (!deleted) return res.status(404).json({ error: 'Order not found' });

    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
