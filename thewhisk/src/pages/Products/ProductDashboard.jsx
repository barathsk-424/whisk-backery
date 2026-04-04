/**
 * ProductDashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * Full Product Management + Order Analytics system for The Whisk
 *
 * Features:
 *  ✅ CRUD Products (create, read, update, delete)
 *  ✅ Image URL preview
 *  ✅ Stock tracking — Out-of-Stock badge, Low-stock alerts
 *  ✅ Searchable + filterable + sortable product table
 *  ✅ Product detail slide-over (revenue, orders, stock)
 *  ✅ Order Analytics: Bar chart (top sellers), Pie chart (categories)
 *  ✅ Line chart (order growth daily)
 *  ✅ Pagination
 *  ✅ Best Seller + Trending badges
 *  ✅ Export analytics as CSV + PDF
 *  ✅ Toast notifications, loading spinners
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { supabase } from '../../lib/supabase';

// ── Config ───────────────────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  'Cakes', 'Cupcakes', 'Pastries', 'Cookies', 'Bread', 'Custom', 'Bundles', 'Other',
];
const PAGE_SIZE    = 8;
const PIE_COLORS   = ['#f59e0b','#8b5cf6','#06b6d4','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];
const LOW_STOCK_QTY = 10;

// ── Helpers ──────────────────────────────────────────────────────
const fmt     = (n) => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(Number(n)||0);
const todayStr = () => new Date().toISOString().split('T')[0];

const emptyForm = () => ({
  name:'', price:'', category:'Cakes', description:'',
  image_url:'', stock:'100',
});

// ── Custom Tooltip ────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function ProductDashboard() {
  const location = useLocation();
  const tableRef = useRef(null);

  // ── Data state ───────────────────────────────────────────────
  const [products,  setProducts]  = useState([]);
  const [analytics, setAnalytics] = useState([]);   // product_analytics view rows
  const [orders,    setOrders]    = useState([]);    // raw orders for charts
  const [loading,   setLoading]   = useState(true);
  const [fetchError,setFetchError]= useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [newProductName, setNewProductName] = useState(null);  // highlight newly added

  // ── UI state ─────────────────────────────────────────────────
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(emptyForm());
  const [detail,    setDetail]    = useState(null);   // selected product analytics row
  const [deletingId,setDeletingId]= useState(null);

  // ── Filter / search / sort / pagination ──────────────────────
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sortKey,   setSortKey]   = useState('name');
  const [sortAsc,   setSortAsc]   = useState(true);
  const [page,      setPage]      = useState(1);

  // ── Fetch products + analytics ────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Fetch each independently so one failure doesn't block all
      const pRes = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (pRes.error) { console.error('[ProductDashboard] products fetch error:', pRes.error); throw pRes.error; }
      console.log('[ProductDashboard] products:', pRes.data?.length, 'rows', pRes.data);
      setProducts(pRes.data || []);

      const aRes = await supabase.from('product_analytics').select('*');
      if (aRes.error) { console.error('[ProductDashboard] product_analytics fetch error:', aRes.error); }
      console.log('[ProductDashboard] analytics:', aRes.data?.length, 'rows', aRes.data);
      setAnalytics(aRes.data || []);

      const oRes = await supabase.from('orders').select('id, product_id, total_price, quantity, created_at').order('created_at', { ascending: true });
      if (oRes.error) { console.error('[ProductDashboard] orders fetch error:', oRes.error); }
      console.log('[ProductDashboard] orders:', oRes.data?.length, 'rows', oRes.data);
      setOrders(oRes.data || []);
    } catch (err) {
      console.error('[ProductDashboard] Critical fetch error:', err);
      setFetchError(err.message || 'Unknown error loading data');
      toast.error('Failed to load products: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Detect new product added (from AddCakePage navigation state) ──
  useEffect(() => {
    if (location.state?.newProduct && location.state?.productName) {
      setNewProductName(location.state.productName);
      // Force re-fetch to get the newly inserted product
      fetchAll();
      // Scroll to product table after data loads
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);
      // Clear the highlight after 8 seconds
      const timer = setTimeout(() => setNewProductName(null), 8000);
      // Clear location state to avoid re-triggering on refresh
      window.history.replaceState({}, document.title);
      return () => clearTimeout(timer);
    }
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Low stock alert on load ───────────────────────────────────
  useEffect(() => {
    const lowStock = products.filter(p => (p.stock ?? p.stock_quantity ?? 100) < LOW_STOCK_QTY);
    if (lowStock.length > 0) {
      toast(`⚠️ ${lowStock.length} product(s) have low stock!`, { icon: '📦', duration: 5000, id: 'low-stock' });
    }
  }, [products]);

  // ── CRUD: Submit ──────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())           { toast.error('Product name is required'); return; }
    if (!form.price || Number(form.price) <= 0) { toast.error('Enter a valid price'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name:           form.name.trim(),
        price:          Number(form.price),
        category:       form.category,
        description:    form.description || '',
        image_url:      form.image_url  || '',
        image:          form.image_url  || '',   // keep legacy column in sync
        stock:          Number(form.stock) || 100,
        stock_quantity: Number(form.stock) || 100,
      };

      let error;
      if (editId) {
        ({ error } = await supabase.from('products').update(payload).eq('id', editId));
      } else {
        ({ error } = await supabase.from('products').insert(payload));
      }
      if (error) throw error;

      toast.success(editId ? '✏️ Product updated!' : '✅ Product added!');
      setForm(emptyForm()); setEditId(null); setShowForm(false);
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── CRUD: Delete ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast.error('Delete failed: ' + error.message);
    else { toast.success('🗑️ Product deleted'); fetchAll(); }
    setDeletingId(null);
  };

  // ── CRUD: Edit ────────────────────────────────────────────────
  const startEdit = (p) => {
    setForm({
      name:        p.name,
      price:       p.price,
      category:    p.category || 'Cakes',
      description: p.description || '',
      image_url:   p.image_url || p.image || '',
      stock:       String(p.stock ?? p.stock_quantity ?? 100),
    });
    setEditId(p.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Filtered + sorted + paginated products ────────────────────
  const filtered = useMemo(() => {
    let rows = [...products];
    if (search.trim())        rows = rows.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'all')  rows = rows.filter(p => p.category === catFilter);
    rows.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return rows;
  }, [products, search, catFilter, sortKey, sortAsc]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
    setPage(1);
  };

  // ── Analytics helpers ─────────────────────────────────────────
  const topSellers  = [...analytics].sort((a, b) => Number(b.order_count) - Number(a.order_count)).slice(0, 6);
  const catRevenue  = analytics.reduce((acc, p) => {
    const cat = p.category || 'Other';
    acc[cat]  = (acc[cat] || 0) + Number(p.total_revenue);
    return acc;
  }, {});
  const catPieData  = Object.entries(catRevenue).map(([name, value]) => ({ name, value }));

  // Daily order growth (last 14 days)
  const orderGrowth = useMemo(() => {
    const map = {};
    const last14 = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });
    last14.forEach(d => { map[d] = { date: d, orders: 0, revenue: 0 }; });
    orders.forEach(o => {
      const d = o.created_at?.split('T')[0];
      if (map[d]) { map[d].orders++; map[d].revenue += Number(o.total_price); }
    });
    return Object.values(map);
  }, [orders]);

  // ── KPIs ─────────────────────────────────────────────────────
  const totalRevenue = analytics.reduce((s, p) => s + Number(p.total_revenue), 0);
  const totalOrders  = analytics.reduce((s, p) => s + Number(p.order_count), 0);
  const totalStock   = products.reduce((s, p) => s + (p.stock ?? p.stock_quantity ?? 0), 0);
  const outOfStock   = products.filter(p => (p.stock ?? p.stock_quantity ?? 0) === 0).length;

  // ── Analytics Row for a product ──────────────────────────────
  const getAnalytics = (id) => analytics.find(a => a.id === id) || {};

  // ═══════════════════════════════════════════════════════════════
  // ── AI Insights Engine (heuristic-based on real data) ─────────
  // ═══════════════════════════════════════════════════════════════
  const aiInsights = useMemo(() => {
    if (!analytics.length || !products.length) return null;

    // 1. Predicted Best Seller
    //    Score = (order_count * 3) + (revenue / avg_revenue) + (momentum from recency)
    const avgRevenue = totalRevenue / (analytics.length || 1);
    const scored = analytics.map(p => {
      const recentOrders = orders.filter(o => {
        if (o.product_id !== p.id) return false;
        const d = new Date(o.created_at);
        return (Date.now() - d.getTime()) < 7 * 86400000; // last 7 days
      }).length;
      const momentum = recentOrders * 5; // recent orders weigh more
      const score = (Number(p.order_count) * 3) + (Number(p.total_revenue) / (avgRevenue || 1)) + momentum;
      return { ...p, score, recentOrders };
    }).sort((a, b) => b.score - a.score);
    const bestSeller = scored[0] || null;
    const confidence = scored.length >= 2
      ? Math.min(98, Math.round(50 + (scored[0].score / (scored[0].score + scored[1].score)) * 48))
      : 75;

    // 2. Sales Trend Prediction
    //    Compare orders in last 7 days vs previous 7 days
    const now = Date.now();
    const last7  = orders.filter(o => (now - new Date(o.created_at).getTime()) < 7  * 86400000).length;
    const prev7  = orders.filter(o => {
      const age = now - new Date(o.created_at).getTime();
      return age >= 7 * 86400000 && age < 14 * 86400000;
    }).length;
    const growthPct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 > 0 ? 100 : 0);
    let trend, trendIcon, trendColor, trendReason;
    if (growthPct > 15)       { trend = 'Rising';  trendIcon = '📈'; trendColor = '#22c55e'; trendReason = `Orders up ${growthPct}% vs previous week`; }
    else if (growthPct < -15) { trend = 'Falling'; trendIcon = '📉'; trendColor = '#ef4444'; trendReason = `Orders down ${Math.abs(growthPct)}% vs previous week`; }
    else                      { trend = 'Stable';  trendIcon = '➡️'; trendColor = '#f59e0b'; trendReason = `Steady order volume (${growthPct >= 0 ? '+' : ''}${growthPct}%)`; }

    // 3. Restock Suggestions
    //    stock < 10 OR (stock < 20 AND high order velocity)
    const restockList = products.map(p => {
      const stock  = p.stock ?? p.stock_quantity ?? 100;
      const pa     = analytics.find(a => a.id === p.id);
      const oc     = Number(pa?.order_count || 0);
      const us     = Number(pa?.units_sold  || 0);
      const dailyRate = us > 0 ? (us / 14) : 0; // approx avg daily sell
      const daysLeft  = dailyRate > 0 ? Math.floor(stock / dailyRate) : 999;
      let urgency = 'ok';
      if (stock === 0)           urgency = 'critical';
      else if (stock < 5)        urgency = 'urgent';
      else if (stock < 10)       urgency = 'warning';
      else if (daysLeft < 5)     urgency = 'warning';
      return { id: p.id, name: p.name, stock, dailyRate: dailyRate.toFixed(1), daysLeft, urgency, suggestedOrder: Math.max(50, Math.ceil(dailyRate * 14)) };
    }).filter(r => r.urgency !== 'ok').sort((a, b) => {
      const pri = { critical: 0, urgent: 1, warning: 2 };
      return (pri[a.urgency] ?? 3) - (pri[b.urgency] ?? 3);
    });

    // 4. Top Performing Category
    const catStats = {};
    analytics.forEach(p => {
      const cat = p.category || 'Other';
      if (!catStats[cat]) catStats[cat] = { revenue: 0, orders: 0, products: 0 };
      catStats[cat].revenue  += Number(p.total_revenue);
      catStats[cat].orders   += Number(p.order_count);
      catStats[cat].products += 1;
    });
    const topCat = Object.entries(catStats)
      .map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.revenue - a.revenue)[0] || { name: 'N/A', revenue: 0, orders: 0, products: 0 };

    // 5. Bonus: next-week revenue forecast (simple linear)
    const last7Revenue = orders
      .filter(o => (now - new Date(o.created_at).getTime()) < 7 * 86400000)
      .reduce((s, o) => s + Number(o.total_price), 0);
    const forecastRevenue = Math.round(last7Revenue * (1 + growthPct / 100));

    return {
      bestSeller, confidence, scored: scored.slice(0, 3),
      trend, trendIcon, trendColor, trendReason, growthPct,
      last7, prev7,
      restockList,
      topCat,
      forecastRevenue, last7Revenue,
    };
  }, [analytics, products, orders, totalRevenue]);

  // ── CSV Export ────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Name','Category','Price','Stock','Orders','Revenue','Units Sold'];
    const rows = analytics.map(p =>
      [p.name, p.category, p.price, p.stock ?? p.stock_quantity, p.order_count, p.total_revenue, p.units_sold].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const a   = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type:'text/csv' })),
      download: `products-analytics-${todayStr()}.csv`,
    });
    a.click();
    toast.success('📊 CSV exported!');
  };

  // ── PDF Export ────────────────────────────────────────────────
  const exportPDF = () => {
    const doc  = new jsPDF();
    const pw   = doc.internal.pageSize.getWidth();

    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, pw, 28, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text('The Whisk — Product & Analytics Report', 14, 12);
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 22);

    // KPIs
    doc.setTextColor(40,40,40);
    doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('Summary', 14, 38);
    doc.setFont('helvetica','normal'); doc.setFontSize(9);
    doc.setTextColor(80,80,80);
    doc.text(`Total Products: ${products.length}`, 14, 46);
    doc.text(`Total Orders: ${totalOrders}`, 60, 46);
    doc.text(`Total Revenue: ${fmt(totalRevenue)}`, 110, 46);
    doc.text(`Out of Stock: ${outOfStock}`, 170, 46);

    // Table
    let y = 60;
    doc.setFillColor(245,243,255);
    doc.rect(10, y-5, pw-20, 8, 'F');
    doc.setTextColor(109,40,217); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    ['Name','Category','Price','Stock','Orders','Revenue'].forEach((h, i) => {
      doc.text(h, [14,65,98,120,145,168][i], y);
    });
    y += 6;
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(70,70,70);
    analytics.forEach((p, idx) => {
      if (y > 275) { doc.addPage(); y = 20; }
      if (idx % 2 === 0) { doc.setFillColor(249,250,251); doc.rect(10, y-4, pw-20, 7, 'F'); }
      doc.text(String(p.name||'').slice(0,22),  14,  y);
      doc.text(String(p.category||''),           65,  y);
      doc.text(fmt(p.price),                     96,  y, { align:'right' });
      doc.text(String(p.stock ?? p.stock_quantity ?? 0), 120, y);
      doc.text(String(p.order_count),            145, y);
      doc.text(fmt(p.total_revenue),             180, y, { align:'right' });
      y += 7;
    });

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(180,180,180);
      doc.text(`Page ${i} of ${pages} | The Whisk Bakery`, pw/2, 290, { align:'center' });
    }
    doc.save(`products-report-${todayStr()}.pdf`);
    toast.success('📄 PDF report downloaded!');
  };

  // ── Sort header helper ────────────────────────────────────────
  const SortTh = ({ label, col }) => (
    <th onClick={() => toggleSort(col)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-purple-600 transition-colors">
      <div className="flex items-center gap-1">
        {label}
        {sortKey === col && <span className="text-purple-500">{sortAsc ? '↑' : '↓'}</span>}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16" style={{ fontFamily:"'Inter',sans-serif" }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
        {/* Subtle background gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Title + Subtitle */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm shadow-inner flex items-center justify-center text-2xl flex-shrink-0 border border-white/20">📦</div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm">Product Dashboard</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1.5">
                  <span className="flex items-center gap-1.5 text-purple-100 text-sm font-semibold whitespace-nowrap drop-shadow-sm">
                    <span className="text-base drop-shadow-sm">🧁</span> The Whisk Bakery
                  </span>
                  <span className="hidden sm:inline text-purple-300/60">•</span>
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm text-purple-300 group cursor-default" title="admin@thewhisk.com">
                    <svg className="w-4 h-4 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span className="truncate max-w-[200px] sm:max-w-xs group-hover:text-white transition-colors">admin@thewhisk.com</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Right: Action buttons */}
            <div className="flex gap-2 flex-wrap items-center flex-shrink-0">
              <button onClick={exportCSV}  className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">📊 CSV</button>
              <button onClick={exportPDF}  className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">📄 PDF</button>
              <button onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-700 rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                + Add Product
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Loading State ─────────────────────────────────── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="mt-4 text-gray-400 text-sm">Loading products & analytics...</p>
          </div>
        )}

        {/* ── Fetch Error Banner ─────────────────────────────── */}
        {fetchError && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-red-800 text-sm">Failed to load dashboard data</p>
              <p className="text-xs text-red-500 mt-0.5">{fetchError}</p>
            </div>
            <button onClick={fetchAll}
              className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all">
              🔄 Retry
            </button>
          </div>
        )}

        {/* ── Empty State (no products at all) ────────────────── */}
        {!loading && !fetchError && products.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-5xl mb-4">📦</p>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Products Yet</h3>
            <p className="text-gray-400 text-sm mb-5">Start by adding your first product to the dashboard.</p>
            <button onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(true); }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">
              + Add Your First Product
            </button>
          </div>
        )}

        {/* ── Main Dashboard Content (only render when data is ready) ── */}
        {!loading && products.length > 0 && (
        <>

        {/* ── KPI Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label:'Total Products', value: products.length,    icon:'🛍️', color:'#8b5cf6', bg:'#f5f3ff', border:'#c4b5fd', isCount:true },
            { label:'Total Orders',   value: totalOrders,         icon:'📋', color:'#06b6d4', bg:'#ecfeff', border:'#a5f3fc', isCount:true },
            { label:'Total Revenue',  value: totalRevenue,        icon:'💰', color:'#22c55e', bg:'#f0fdf4', border:'#86efac' },
            { label:'Out of Stock',   value: outOfStock,          icon:'🚫', color:'#ef4444', bg:'#fef2f2', border:'#fca5a5', isCount:true },
          ].map(card => (
            <motion.div key={card.label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor:card.bg, border:`1px solid ${card.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ color:card.color, background:card.color+'20' }}>{card.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color:card.color }}>
                {card.isCount ? card.value : fmt(card.value)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{card.isCount ? 'items' : 'all time'}</p>
            </motion.div>
          ))}
        </div>

        {/* ── AI Insights Panel ────────────────────────────── */}
        {aiInsights && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <span className="text-2xl">🤖</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-50 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">AI Insights</h2>
                <p className="text-xs text-gray-400">Smart predictions based on your sales data</p>
              </div>
              <span className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 uppercase tracking-wider">AI-Powered</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Predicted Best Seller */}
              <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 rounded-2xl p-5 border border-purple-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🏆</span>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">Predicted Best Seller</p>
                </div>
                <p className="text-lg font-bold text-gray-800 truncate">{aiInsights.bestSeller?.name || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width:`${aiInsights.confidence}%` }} />
                  </div>
                  <span className="text-xs font-bold text-purple-600">{aiInsights.confidence}%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">Confidence score</p>
                {aiInsights.scored.length > 1 && (
                  <div className="mt-3 pt-3 border-t border-purple-100">
                    <p className="text-[10px] text-gray-400 mb-1.5">Runner-ups:</p>
                    {aiInsights.scored.slice(1,3).map((p, i) => (
                      <p key={p.id} className="text-xs text-gray-600 truncate">#{i+2} {p.name}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Sales Trend Prediction */}
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50 rounded-2xl p-5 border border-green-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{aiInsights.trendIcon}</span>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: aiInsights.trendColor }}>Sales Trend</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: aiInsights.trendColor }}>{aiInsights.trend}</p>
                <p className="text-xs text-gray-500 mt-1">{aiInsights.trendReason}</p>
                <div className="mt-3 pt-3 border-t border-green-100 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400">This week</p>
                    <p className="text-sm font-bold text-gray-700">{aiInsights.last7} orders</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Last week</p>
                    <p className="text-sm font-bold text-gray-700">{aiInsights.prev7} orders</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-[10px] text-gray-400">Forecast next week</p>
                  <p className="text-sm font-bold" style={{ color: aiInsights.trendColor }}>{fmt(aiInsights.forecastRevenue)}</p>
                </div>
              </div>

              {/* Restock Suggestions */}
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-5 border border-amber-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📦</span>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wide">Restock Suggestions</p>
                </div>
                {aiInsights.restockList.length === 0 ? (
                  <div>
                    <p className="text-lg font-bold text-green-600">All Good ✅</p>
                    <p className="text-xs text-gray-500 mt-1">No products need restocking right now</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {aiInsights.restockList.slice(0, 4).map(r => (
                      <div key={r.id} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          r.urgency === 'critical' ? 'bg-red-500 animate-pulse' :
                          r.urgency === 'urgent'   ? 'bg-orange-500' : 'bg-amber-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-700 truncate">{r.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {r.stock} left · {r.daysLeft < 999 ? `~${r.daysLeft}d left` : 'low velocity'} · order {r.suggestedOrder}
                          </p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          r.urgency === 'critical' ? 'bg-red-100 text-red-600' :
                          r.urgency === 'urgent'   ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {r.urgency}
                        </span>
                      </div>
                    ))}
                    {aiInsights.restockList.length > 4 && (
                      <p className="text-[10px] text-amber-500 font-medium">+{aiInsights.restockList.length - 4} more items need attention</p>
                    )}
                  </div>
                )}
              </div>

              {/* Top Performing Category */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -translate-y-8 translate-x-8" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🥇</span>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Top Category</p>
                </div>
                <p className="text-xl font-bold text-gray-800">{aiInsights.topCat.name}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-100">
                  <div>
                    <p className="text-[10px] text-gray-400">Revenue</p>
                    <p className="text-sm font-bold text-green-600">{fmt(aiInsights.topCat.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Orders</p>
                    <p className="text-sm font-bold text-blue-600">{aiInsights.topCat.orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Products</p>
                    <p className="text-sm font-bold text-purple-600">{aiInsights.topCat.products}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Share</p>
                    <p className="text-sm font-bold text-indigo-600">
                      {totalRevenue > 0 ? Math.round((aiInsights.topCat.revenue / totalRevenue) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ── Low Stock Alert ───────────────────────────────── */}
        {products.some(p => (p.stock ?? p.stock_quantity ?? 100) < LOW_STOCK_QTY) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800 text-sm">Low Stock Alert</p>
              <p className="text-xs text-amber-600">
                {products.filter(p => (p.stock ?? p.stock_quantity ?? 100) < LOW_STOCK_QTY).map(p => p.name).join(', ')} — restock needed
              </p>
            </div>
          </div>
        )}

        {/* ── Add / Edit Form ──────────────────────────────── */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-gray-800">{editId ? '✏️ Edit Product' : '➕ New Product'}</h2>
                  <button onClick={() => { setShowForm(false); setForm(emptyForm()); setEditId(null); }}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">

                    {/* Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Product Name *</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Chocolate Truffle Cake"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all" />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Price (₹) *</label>
                      <input type="number" min="1" value={form.price} onChange={e => setForm({...form, price:e.target.value})} placeholder="999"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all" />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                      <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all bg-white">
                        {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Stock */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Stock Quantity</label>
                      <input type="number" min="0" value={form.stock} onChange={e => setForm({...form, stock:e.target.value})} placeholder="100"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all" />
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Image URL</label>
                      <input type="url" value={form.image_url} onChange={e => setForm({...form, image_url:e.target.value})} placeholder="https://..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all" />
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                      <textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={2} placeholder="Short product description..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all resize-none" />
                    </div>

                    {/* Image Preview */}
                    {form.image_url && (
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Image Preview</p>
                        <img src={form.image_url} alt="preview"
                          className="h-32 w-32 object-cover rounded-2xl border border-gray-200 shadow-sm"
                          onError={e => { e.target.style.display='none'; }} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" disabled={submitting}
                      className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
                      style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)', opacity:submitting?0.7:1 }}>
                      {submitting
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                        : editId ? '💾 Update Product' : '✅ Add Product'
                      }
                    </button>
                    {editId && (
                      <button type="button" onClick={() => { setForm(emptyForm()); setEditId(null); setShowForm(false); }}
                        className="px-6 py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search + Filter ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all" />
            </div>
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white text-gray-600">
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <p className="text-xs text-gray-400 ml-auto">{filtered.length} products</p>
          </div>
        </div>

        {/* ── New Product Added Banner ────────────────────────── */}
        <AnimatePresence>
          {newProductName && (
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4 flex items-center gap-4">
              <span className="text-3xl">🎉</span>
              <div className="flex-1">
                <p className="font-bold text-green-800 text-sm">New product added successfully!</p>
                <p className="text-xs text-green-600 mt-0.5">"{newProductName}" has been added to your product list. Stock and dashboard data have been updated.</p>
              </div>
              <button onClick={() => setNewProductName(null)}
                className="text-green-400 hover:text-green-600 text-lg font-bold">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Product Table ─────────────────────────────────── */}
        <div ref={tableRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-700">🛍️ Products ({filtered.length})</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">📦</p>
              <p className="font-semibold">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left w-12" />
                    <SortTh label="Name"     col="name" />
                    <SortTh label="Category" col="category" />
                    <SortTh label="Price"    col="price" />
                    <SortTh label="Stock"    col="stock" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Orders</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {paginated.map((p, idx) => {
                      const a     = getAnalytics(p.id);
                      const stock = p.stock ?? p.stock_quantity ?? 0;
                      const isTop = analytics.length > 0 && analytics.sort((a,b) => Number(b.order_count)-Number(a.order_count))[0]?.id === p.id;
                      const isTrending = Number(a.order_count) >= 3;
                      const imgSrc = p.image_url || p.image || '';

                      const isNew = newProductName && p.name?.toLowerCase() === newProductName?.toLowerCase();

                      return (
                        <motion.tr key={p.id}
                          initial={{ opacity:0, ...(isNew ? { backgroundColor: '#dcfce7' } : {}) }}
                          animate={{ opacity:1, backgroundColor: isNew ? ['#dcfce7','#ffffff'] : '#ffffff' }}
                          transition={{ backgroundColor: { duration: 3, delay: 1 } }}
                          className={`hover:bg-purple-50/30 transition-colors group cursor-pointer ${isNew ? 'ring-2 ring-green-300 ring-inset' : ''}`}
                          onClick={() => setDetail(a.id ? a : { ...p, order_count:0, total_revenue:0, units_sold:0 })}>
                          {/* Image */}
                          <td className="px-4 py-3">
                            {imgSrc ? (
                              <img src={imgSrc} alt={p.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100" onError={e => e.target.style.display='none'} />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-xl">🎂</div>
                            )}
                          </td>
                          {/* Name + badges */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold text-sm text-gray-800">{p.name}</p>
                              {isTop     && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">🏆 Best</span>}
                              {isTrending && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-pink-100 text-pink-600 rounded-full">🔥 Trending</span>}
                              {isNew      && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-600 rounded-full animate-pulse">✨ NEW</span>}
                            </div>
                            {p.description && <p className="text-xs text-gray-400 truncate max-w-[180px] mt-0.5">{p.description}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600 font-medium">{p.category || '—'}</span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{fmt(p.price)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{stock}</td>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">{a.order_count || 0}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">{fmt(a.total_revenue || 0)}</td>
                          <td className="px-4 py-3">
                            {stock === 0 ? (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-600">Out of Stock</span>
                            ) : stock < LOW_STOCK_QTY ? (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Low Stock</span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">In Stock</span>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                              <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-all" title="Edit">✏️</button>
                              <button onClick={() => setDeletingId(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all" title="Delete">🗑️</button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all">← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: page===n ? '#7c3aed' : 'white', color: page===n ? 'white' : '#6b7280', border: '1px solid #e5e7eb' }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-all">Next →</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Analytics Charts ──────────────────────────────── */}
        <div>
          <h2 className="text-xl font-bold text-gray-700 mb-5">📊 Order Analytics</h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Top Selling Bar */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-700 mb-4">🏆 Top Selling Products</h3>
              {topSellers.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topSellers} layout="vertical" barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize:10 }} width={120} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="order_count" name="Orders" fill="#8b5cf6" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No order data yet</div>}
            </div>

            {/* Category Pie */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-700 mb-4">🥧 Revenue by Category</h3>
              {catPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={catPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                        {catPieData.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {catPieData.slice(0,4).map((d,i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background:PIE_COLORS[i%PIE_COLORS.length] }} />
                          {d.name}
                        </div>
                        <span className="font-semibold">{fmt(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
            </div>
          </div>

          {/* Order Growth Line */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-4">📈 Order Growth — Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={orderGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize:10 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize:11 }} />
                <Tooltip content={<ChartTip />} />
                <Legend />
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r:5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        </>
        )}

      </div>

      {/* ── Product Detail Slide-over ─────────────────────── */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setDetail(null)} />
            <motion.div initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
              transition={{ type:'spring', damping:25 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Product Details</h2>
                  <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕</button>
                </div>

                {/* Image */}
                {(detail.image_url || detail.image) && (
                  <img src={detail.image_url || detail.image} alt={detail.name}
                    className="w-full h-48 object-cover rounded-2xl mb-5 border border-gray-100"
                    onError={e => e.target.style.display='none'} />
                )}

                {/* Name + badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <h3 className="text-2xl font-bold text-gray-800">{detail.name}</h3>
                  {Number(detail.order_count) >= 3 && <span className="text-xs font-bold px-2 py-1 bg-pink-100 text-pink-600 rounded-full">🔥 Trending</span>}
                </div>

                <p className="text-gray-500 text-sm mb-5 leading-relaxed">{detail.description || 'No description provided.'}</p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label:'Price',      value:fmt(detail.price),          icon:'💰', color:'#22c55e' },
                    { label:'Category',   value:detail.category||'—',       icon:'🏷️', color:'#8b5cf6' },
                    { label:'In Stock',   value:detail.stock ?? detail.stock_quantity ?? 0, icon:'📦', color:'#06b6d4' },
                    { label:'Total Orders',  value:detail.order_count||0,   icon:'📋', color:'#f59e0b' },
                    { label:'Units Sold',    value:detail.units_sold||0,    icon:'🛒', color:'#ec4899' },
                    { label:'Total Revenue', value:fmt(detail.total_revenue||0), icon:'💵', color:'#22c55e' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl p-4" style={{ background:s.color+'12', border:`1px solid ${s.color}30` }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{s.icon}</span>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                      </div>
                      <p className="text-lg font-bold" style={{ color:s.color }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Stock bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Stock Level</span>
                    <span>{detail.stock ?? detail.stock_quantity ?? 0} / {Math.max(Number(detail.stock) || Number(detail.stock_quantity) || 0, 100)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, ((detail.stock ?? detail.stock_quantity ?? 0) / 100) * 100)}%`,
                        background: (detail.stock ?? detail.stock_quantity ?? 0) < 10 ? '#ef4444' : '#22c55e',
                      }} />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button onClick={() => { setDetail(null); startEdit(products.find(p => p.id === detail.id) || detail); }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all"
                    style={{ background:'linear-gradient(135deg,#7c3aed,#db2777)' }}>
                    ✏️ Edit Product
                  </button>
                  <button onClick={() => { setDetail(null); setDeletingId(detail.id); }}
                    className="px-5 py-3 rounded-xl border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-all">
                    🗑️
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm ────────────────────────────────── */}
      <AnimatePresence>
        {deletingId && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setDeletingId(null)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
              <p className="text-4xl mb-3">🗑️</p>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Product?</h3>
              <p className="text-sm text-gray-500 mb-6">Order history will be preserved. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={() => handleDelete(deletingId)} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
