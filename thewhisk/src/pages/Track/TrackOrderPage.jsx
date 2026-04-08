import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import useStore from '../../store/useStore';

/* ─── Timeline Steps ─────────────────────────────────── */
const STEPS = [
  { key: 'placed',       label: 'Order Placed',     icon: '📋', desc: 'We received your order!' },
  { key: 'preparing',    label: 'Preparing',         icon: '👩‍🍳', desc: 'Chef is baking your cake' },
  { key: 'out_delivery', label: 'Out for Delivery',  icon: '🛵', desc: 'Ravi is on the way' },
  { key: 'delivered',    label: 'Delivered',         icon: '🏠', desc: 'Enjoy your cake! 🎂' },
];

const STATUS_SEQ = STEPS.map((s) => s.key);

function getStepIdx(key) {
  const i = STATUS_SEQ.indexOf(key);
  return i === -1 ? 0 : i;
}

/* ─── Invoice helper ─────────────────────────────────── */
function downloadInvoice(order) {
  const lines = [
    '╔══════════════════════════════╗',
    '║     THE WHISK – INVOICE      ║',
    '╚══════════════════════════════╝',
    '',
    `Order ID   : ${order.id}`,
    `Date       : ${new Date(order.date || order.createdAt).toLocaleString()}`,
    `Status     : Delivered`,
    '',
    '── Items ──────────────────────',
    ...(order.items || []).map(
      (it) => `• ${it.name} x${it.quantity}  ₹${((it.base_price || it.price || 0) * it.quantity).toLocaleString()}`
    ),
    '',
    '── Address ────────────────────',
    order.address
      ? `${order.address.line1}, ${order.address.city} – ${order.address.pincode}`
      : 'N/A',
    '',
    `Payment    : ${(order.payment_method || 'N/A').toUpperCase()}`,
    `TOTAL PAID : ₹${(order.total || 0).toLocaleString()}`,
    '',
    'Thank you for choosing The Whisk!',
  ].join('\n');

  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TheWhisk_Invoice_${order.id}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Invoice downloaded!');
}

/* ─── Main Component ─────────────────────────────────── */
export default function TrackOrderPage() {
  const navigate = useNavigate();
  const timerRefs = useRef([]);
  const [inputId, setInputId] = useState('');
  const [order, setOrder] = useState(null);
  const [statusKey, setStatusKey] = useState('placed');
  const [loading, setLoading] = useState(false);
  const [notified, setNotified] = useState({});
  const { orders, fetchOrders } = useStore();

  /* Load order from Supabase */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setInputId(id);
      loadOrder(id);
    }
    fetchOrders(); // Sync sidebar history
  }, []);

  const history = orders.map(data => ({
    id: data.id,
    items: [{
      name: data.product_name || data.products?.name || 'Custom Cake',
      quantity: data.quantity,
      price: data.price,
      image_url: data.image_url || data.products?.image_url
    }],
    total: data.total_price,
    address: data.address,
    status: data.status,
    date: data.created_at
  }));

  const loadOrder = async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, products:product_id(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        // Map Supabase data to the format used in this page
        const mappedOrder = {
          id: data.id,
          items: [{
            name: data.product_name || data.products?.name || 'Custom Cake',
            quantity: data.quantity,
            price: data.price,
            image_url: data.image_url || data.products?.image_url
          }],
          total: data.total_price,
          address: data.address,
          status: data.status,
          date: data.created_at
        };
        setOrder(mappedOrder);
        setStatusKey(data.status?.toLowerCase()?.replace(' ', '_') || 'placed');
      } else {
        toast.error('Order not found');
      }
    } catch (err) {
      console.error('Fetch order error:', err);
      toast.error('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  /* Search handler */
  const handleSearch = () => {
    if (!inputId.trim()) { toast.error('Enter an Order ID'); return; }
    loadOrder(inputId.trim());
  };

  const stepIdx = getStepIdx(statusKey);
  const progressPct = Math.max(5, (stepIdx / (STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'linear-gradient(135deg, #FFF8E7 0%, #FFF0D6 100%)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-heading text-4xl font-bold text-primary">📦 Track Order</h1>
          <p className="text-brown-400 mt-2">Real-time delivery status updates</p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Left Column ── */}
          <div className="flex-1 space-y-6">

            {/* Search Box */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex gap-2 bg-white rounded-2xl p-2 shadow border border-brown-100">
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Order ID (e.g., ORD-1234567890)"
                className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none placeholder:text-brown-300"
              />
              <button
                onClick={handleSearch}
                className="px-8 py-3 gradient-accent text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-accent/20"
              >
                Track
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              {order ? (
                <motion.div key="order" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                  {/* Status Card */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow border border-brown-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-[11px] font-bold text-brown-400 uppercase tracking-widest mb-1">Current Status</p>
                        <h2 className="font-heading text-2xl font-bold text-primary">
                          {STEPS[stepIdx].label}
                        </h2>
                      </div>
                      <span className="hidden md:block text-xs font-bold text-brown-300 bg-brown-50 border border-brown-100 px-3 py-1.5 rounded-full">
                        {order.id}
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="h-2 bg-brown-50 rounded-full my-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.9, ease: 'easeInOut' }}
                        className="h-full gradient-accent rounded-full"
                      />
                    </div>

                    {/* Steps */}
                    <div className="space-y-0">
                      {STEPS.map((step, i) => {
                        const isComplete = i < stepIdx;
                        const isCurrent  = i === stepIdx;
                        const isPending  = i > stepIdx;
                        return (
                          <div key={step.key} className="flex gap-4 relative">
                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                              <div className={`absolute left-[19px] top-10 w-0.5 h-10 z-0 transition-colors duration-700 ${isComplete ? 'bg-accent' : 'bg-brown-100'}`} />
                            )}
                            {/* Icon dot */}
                            <motion.div
                              animate={isCurrent ? { scale: [1, 1.18, 1], boxShadow: ['0 0 0px rgba(255,107,53,0)', '0 0 18px rgba(255,107,53,0.4)', '0 0 0px rgba(255,107,53,0)'] } : {}}
                              transition={{ repeat: Infinity, duration: 1.8 }}
                              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all duration-500 ${
                                isComplete ? 'bg-accent border-accent text-white'
                                : isCurrent ? 'bg-white border-accent text-accent'
                                : 'bg-white border-brown-200 text-brown-300'
                              }`}
                            >
                              {isComplete ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <span className="text-lg leading-none">{step.icon}</span>
                              )}
                            </motion.div>
                            {/* Label */}
                            <div className={`pb-8 pt-1.5 flex-1 ${isPending ? 'opacity-40' : ''}`}>
                              <p className={`font-bold text-sm ${isCurrent ? 'text-accent' : 'text-primary'}`}>{step.label}</p>
                              <p className="text-xs text-brown-400 mt-0.5">{step.desc}</p>
                              {isCurrent && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  className="inline-block mt-2 px-2.5 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-full uppercase tracking-wide">
                                  In Progress
                                </motion.span>
                              )}
                              {/* Delivery boy card */}
                              {isCurrent && step.key === 'out_delivery' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                                  className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4">
                                  <div className="w-14 h-14 bg-white rounded-full border-2 border-orange-200 flex items-center justify-center text-3xl shadow">
                                    🛵
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-[10px] font-bold text-brown-400 uppercase tracking-widest">Delivery Partner</p>
                                    <p className="font-bold text-primary text-base mt-0.5">Ravi Kumar</p>
                                    <p className="text-xs text-brown-400 mt-0.5">📞 +91 98765 43210 &nbsp;·&nbsp; Arriving ~15 min</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm shadow">📱</div>
                                  </div>
                                </motion.div>
                              )}
                              {/* "On the way" animation */}
                              {isCurrent && step.key === 'out_delivery' && (
                                <div className="mt-4 bg-brown-50 rounded-xl h-16 relative overflow-hidden flex items-center">
                                  <motion.span
                                    initial={{ x: -50 }}
                                    animate={{ x: '90vw' }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                    className="absolute text-2xl"
                                  >🛵</motion.span>
                                  <div className="absolute right-4 text-2xl">🏠</div>
                                  <div className="w-full h-0.5 bg-brown-200 absolute bottom-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items & Bill */}
                  <div className="bg-white rounded-3xl p-6 shadow border border-brown-100">
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-brown-50">
                      <h3 className="font-bold text-primary">Items & Bill</h3>
                      <button
                        onClick={() => downloadInvoice(order)}
                        className="text-xs font-bold text-accent border border-accent/20 bg-accent/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-accent hover:text-white transition-all"
                      >
                        ⬇ Download Invoice
                      </button>
                    </div>
                    <div className="space-y-4">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <img
                            src={item.image_url || item.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop'}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover border border-brown-50 shadow-sm bg-brown-50"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-primary text-sm">{item.name}</p>
                            {item.message && <p className="text-xs text-accent font-medium mt-0.5">"{item.message}"</p>}
                            <p className="text-xs text-brown-400 mt-0.5">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-bold text-primary text-sm">
                            ₹{((item.base_price || item.price || 0) * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 pt-4 border-t border-brown-50 flex justify-between items-center">
                      <span className="text-brown-400 font-medium text-sm">Grand Total</span>
                      <span className="text-xl font-bold text-accent">₹{order.total?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Address */}
                  {order.address && (
                    <div className="bg-white rounded-3xl p-6 shadow border border-brown-100">
                      <h3 className="font-bold text-primary mb-3">📍 Delivery Address</h3>
                      <p className="text-sm text-brown-500">
                        {order.address.line1}, {order.address.city} – {order.address.pincode}
                      </p>
                      <div className="mt-4 h-32 bg-brown-50 rounded-xl flex items-center justify-center border border-brown-100 overflow-hidden relative">
                        <motion.span
                          animate={{ x: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                          className="text-4xl"
                        >🗺️</motion.span>
                        <p className="absolute bottom-3 text-xs text-brown-400">Live map — On the way!</p>
                      </div>
                    </div>
                  )}

                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl p-12 text-center shadow border border-brown-100">
                  <div className="w-20 h-20 bg-brown-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🔍</div>
                  <h3 className="font-heading text-xl font-bold text-primary mb-2">No Order Found</h3>
                  <p className="text-sm text-brown-400 mb-6">Enter your Order ID above or place an order first.</p>
                  <button
                    onClick={() => navigate('/menu')}
                    className="px-6 py-3 gradient-accent text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
                  >
                    Browse Menu
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right Sidebar: Order History ── */}
          <div className="lg:w-80 shrink-0">
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow border border-brown-100 sticky top-24">
              <h3 className="font-heading font-bold text-primary text-lg mb-5">🕐 Order History</h3>

              {history.length > 0 ? (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {[...history].reverse().map((h, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setOrder(h);
                        setInputId(h.id);
                        setStatusKey('delivered');
                        setNotified({});
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        order?.id === h.id
                          ? 'border-accent bg-accent/5'
                          : 'border-brown-100 hover:border-accent/40 bg-brown-50/30 hover:bg-brown-50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-bold text-brown-400 uppercase tracking-widest truncate pr-2 max-w-[120px]">
                          {h.id}
                        </p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 shrink-0">
                          {h.status || 'Confirmed'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-primary leading-tight line-clamp-1">
                        {h.items?.[0]?.name || 'Custom Cake'}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-brown-400">
                          {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                        <p className="text-sm font-bold text-accent">₹{h.total?.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-brown-100 rounded-2xl">
                  <p className="text-4xl mb-3">🛒</p>
                  <p className="text-xs text-brown-400 font-medium px-4">
                    Your past orders will appear here after you place an order.
                  </p>
                  <button
                    onClick={() => navigate('/menu')}
                    className="mt-4 px-5 py-2 bg-white border border-brown-200 text-primary text-xs font-bold rounded-lg hover:border-accent transition-colors shadow-sm"
                  >
                    Order Now →
                  </button>
                </div>
              )}

              {history.length > 0 && (
                <button
                  onClick={() => navigate('/menu')}
                  className="w-full mt-4 py-3 text-sm font-bold text-accent border border-accent/20 rounded-xl hover:bg-accent/5 transition-colors"
                >
                  + Place New Order
                </button>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
