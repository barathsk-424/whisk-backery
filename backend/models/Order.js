const mongoose = require('mongoose');

/* ── Item sub-schema ──────────────────────────────── */
const ItemSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  quantity:   { type: Number, default: 1 },
  base_price: { type: Number, default: 0 },
  price:      { type: Number, default: 0 },
  image_url:  { type: String, default: '' },
  image:      { type: String, default: '' },
  message:    { type: String, default: '' },
}, { _id: false });

/* ── Address sub-schema ───────────────────────────── */
const AddressSchema = new mongoose.Schema({
  line1:   { type: String, default: '' },
  city:    { type: String, default: '' },
  pincode: { type: String, default: '' },
}, { _id: false });

/* ── Main Order schema ────────────────────────────── */
const OrderSchema = new mongoose.Schema({
  // Human-readable ID (e.g. ORD-1711619234567)
  orderId: {
    type: String,
    default: () => `ORD-${Date.now()}`,
    unique: true,
    index: true,
  },
  items:          { type: [ItemSchema], default: [] },
  total:          { type: Number, required: true },
  address:        { type: AddressSchema, default: {} },
  payment_method: { type: String, default: 'upi' },
  status: {
    type: String,
    enum: ['Confirmed', 'Preparing', 'Baking', 'Out for Delivery', 'Delivered'],
    default: 'Confirmed',
  },
  // Optional: link to Supabase user
  user_id:    { type: String, default: null },
  user_email: { type: String, default: null },
}, {
  timestamps: { createdAt: 'date', updatedAt: 'updatedAt' },
});

module.exports = mongoose.model('Order', OrderSchema);
