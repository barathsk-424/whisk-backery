/**
 * StockAnalysisDashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * Advanced Stock Analysis & Inventory Management for The Whisk
 *
 * ✅ KPI cards (total products, stock, low stock, out of stock)
 * ✅ Full sortable/filterable stock table with status badges
 * ✅ Product detail slide-over (stock history, revenue, prediction)
 * ✅ Restock button with quantity input (writes to DB + restock_history)
 * ✅ Restock history log
 * ✅ Charts: Line (stock usage), Bar (top sellers), Pie (category distribution)
 * ✅ AI stock shortage prediction
 * ✅ CSV + PDF export
 * ✅ Low-stock alert banner + toast
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
const CATEGORIES = ['Cakes','Cupcakes','Pastries','Cookies','Bread','Custom','Bundles','Other'];
const PIE_COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];
const LOW = 10;

const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);
const todayStr = () => new Date().toISOString().split('T')[0];

function ChartTip({active,payload,label}){
  if(!active||!payload?.length) return null;
  return(
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p=>(
        <p key={p.dataKey} style={{color:p.color}} className="font-medium">
          {p.name}: {typeof p.value==='number'&&p.value>100?fmt(p.value):p.value}
        </p>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
export default function StockAnalysisDashboard(){
  const navigate = useNavigate();
  const [products,  setProducts]  = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [restocks,  setRestocks]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // UI
  const [detail,     setDetail]     = useState(null);
  const [restockId,  setRestockId]  = useState(null);
  const [restockQty, setRestockQty] = useState('50');
  const [restockNote,setRestockNote]= useState('');
  const [saving,     setSaving]     = useState(false);

  // Filters
  const [search,    setSearch]    = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [sortKey,   setSortKey]   = useState('remaining');
  const [sortAsc,   setSortAsc]   = useState(true);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchAll = useCallback(async()=>{
    setLoading(true);
    try{
      const [p,a,o,r] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('product_analytics').select('*'),
        supabase.from('orders').select('id,product_id,quantity,total_price,created_at').order('created_at',{ascending:true}),
        supabase.from('restock_history').select('*').order('created_at',{ascending:false}).limit(100),
      ]);
      setProducts(p.data||[]); setAnalytics(a.data||[]); setOrders(o.data||[]); setRestocks(r.data||[]);
    }catch(err){ toast.error('Failed to load: '+err.message); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  // ── Derived stock data ────────────────────────────────────────
  const stockRows = useMemo(()=>{
    return products.map(p=>{
      const pa = analytics.find(a=>a.id===p.id)||{};
      const totalStock = p.stock ?? p.stock_quantity ?? 0;
      const sold = Number(pa.units_sold||0);
      const remaining = Math.max(0, totalStock);
      const revenue = Number(pa.total_revenue||0);
      const orderCount = Number(pa.order_count||0);
      // daily sell rate (approx 14-day avg)
      const dailyRate = sold>0 ? sold/14 : 0;
      const daysLeft = dailyRate>0 ? Math.floor(remaining/dailyRate) : 999;
      const status = remaining===0?'out': remaining<LOW?'low':'ok';
      return { ...p, totalStock, sold, remaining, revenue, orderCount, dailyRate, daysLeft, status };
    });
  },[products,analytics]);

  // ── Filtered + sorted ─────────────────────────────────────────
  const filtered = useMemo(()=>{
    let rows = [...stockRows];
    if(search.trim()) rows = rows.filter(r=>r.name?.toLowerCase().includes(search.toLowerCase()));
    if(catFilter!=='all') rows = rows.filter(r=>r.category===catFilter);
    rows.sort((a,b)=>{
      let av=a[sortKey], bv=b[sortKey];
      if(typeof av==='string') av=av.toLowerCase();
      if(typeof bv==='string') bv=bv.toLowerCase();
      return sortAsc?(av>bv?1:-1):(av<bv?1:-1);
    });
    return rows;
  },[stockRows,search,catFilter,sortKey,sortAsc]);

  const toggleSort=(k)=>{ if(sortKey===k) setSortAsc(!sortAsc); else{setSortKey(k);setSortAsc(true);} };

  // ── KPIs ──────────────────────────────────────────────────────
  const totalProducts = products.length;
  const totalStock    = stockRows.reduce((s,r)=>s+r.remaining,0);
  const lowCount      = stockRows.filter(r=>r.status==='low').length;
  const outCount      = stockRows.filter(r=>r.status==='out').length;
  const totalSold     = stockRows.reduce((s,r)=>s+r.sold,0);
  const totalRevenue  = stockRows.reduce((s,r)=>s+r.revenue,0);

  // ── Restock handler ───────────────────────────────────────────
  const handleRestock = async()=>{
    if(!restockQty||Number(restockQty)<=0){ toast.error('Enter valid quantity'); return; }
    setSaving(true);
    try{
      const product = products.find(p=>p.id===restockId);
      if(!product) throw new Error('Product not found');
      const newStock = (product.stock??product.stock_quantity??0)+Number(restockQty);

      const [upd, hist] = await Promise.all([
        supabase.from('products').update({ stock:newStock, stock_quantity:newStock }).eq('id',restockId),
        supabase.from('restock_history').insert({ product_id:restockId, quantity:Number(restockQty), note:restockNote||'' }),
      ]);
      if(upd.error) throw upd.error;
      if(hist.error) throw hist.error;

      toast.success(`📦 Restocked ${product.name} with +${restockQty} units!`);
      setRestockId(null); setRestockQty('50'); setRestockNote('');
      fetchAll();
    }catch(err){ toast.error(err.message); }
    finally{ setSaving(false); }
  };

  // ── Chart data ────────────────────────────────────────────────
  // Stock usage by day (last 14 days)
  const stockUsage = useMemo(()=>{
    const map={};
    const last14 = Array.from({length:14},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(13-i)); return d.toISOString().split('T')[0]; });
    last14.forEach(d=>{ map[d]={date:d, unitsSold:0, ordersPlaced:0}; });
    orders.forEach(o=>{ const d=o.created_at?.split('T')[0]; if(map[d]){ map[d].unitsSold+=Number(o.quantity||0); map[d].ordersPlaced++; }});
    return Object.values(map);
  },[orders]);

  // Top sold products
  const topSold = [...stockRows].sort((a,b)=>b.sold-a.sold).slice(0,6).filter(r=>r.sold>0);

  // Category distribution (by current stock)
  const catStock = stockRows.reduce((acc,r)=>{
    const cat=r.category||'Other';
    acc[cat]=(acc[cat]||0)+r.remaining;
    return acc;
  },{});
  const catPieData = Object.entries(catStock).map(([name,value])=>({name,value}));

  // ── AI Predictions ────────────────────────────────────────────
  const predictions = useMemo(()=>{
    return stockRows
      .filter(r=>r.dailyRate>0.1)
      .map(r=>({
        id:r.id, name:r.name, remaining:r.remaining,
        dailyRate: r.dailyRate.toFixed(1),
        daysLeft: r.daysLeft,
        predictedDate: (() => {
          const d = new Date(); d.setDate(d.getDate()+r.daysLeft);
          return r.daysLeft<999 ? d.toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—';
        })(),
        suggestedRestock: Math.max(50, Math.ceil(r.dailyRate*14)),
        urgency: r.daysLeft<=3?'critical': r.daysLeft<=7?'warning':'ok',
      }))
      .filter(r=>r.urgency!=='ok')
      .sort((a,b)=>a.daysLeft-b.daysLeft);
  },[stockRows]);

  // ── CSV Export ────────────────────────────────────────────────
  const exportCSV = ()=>{
    const h = ['Name','Category','Total Stock','Sold','Remaining','Status','Revenue','Daily Rate','Days Left'];
    const rows = filtered.map(r=>[r.name,r.category,r.totalStock,r.sold,r.remaining,r.status,r.revenue,r.dailyRate.toFixed(1),r.daysLeft].join(','));
    const a = Object.assign(document.createElement('a'),{
      href:URL.createObjectURL(new Blob([[h.join(','),...rows].join('\n')],{type:'text/csv'})),
      download:`stock-analysis-${todayStr()}.csv`,
    }); a.click();
    toast.success('📊 Stock CSV exported!');
  };

  // ── PDF Export ────────────────────────────────────────────────
  const exportPDF = ()=>{
    const doc=new jsPDF(); const pw=doc.internal.pageSize.getWidth();
    doc.setFillColor(79,70,229); doc.rect(0,0,pw,28,'F');
    doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont('helvetica','bold');
    doc.text('The Whisk — Stock Analysis Report',14,12);
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`,14,22);

    doc.setTextColor(40,40,40); doc.setFontSize(10); doc.setFont('helvetica','bold');
    doc.text('Summary',14,38);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,80,80);
    doc.text(`Products: ${totalProducts}`,14,46);
    doc.text(`Total Stock: ${totalStock}`,60,46);
    doc.text(`Low Stock: ${lowCount}`,110,46);
    doc.text(`Out of Stock: ${outCount}`,155,46);

    let y=60;
    doc.setFillColor(245,243,255); doc.rect(10,y-5,pw-20,8,'F');
    doc.setTextColor(79,70,229); doc.setFont('helvetica','bold'); doc.setFontSize(8);
    ['Name','Category','Stock','Sold','Remaining','Status','Revenue'].forEach((h,i)=>{
      doc.text(h,[14,55,88,105,125,150,172][i],y);
    }); y+=6;
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(70,70,70);
    filtered.forEach((r,idx)=>{
      if(y>275){doc.addPage();y=20;}
      if(idx%2===0){doc.setFillColor(249,250,251);doc.rect(10,y-4,pw-20,7,'F');}
      doc.text(String(r.name||'').slice(0,20),14,y);
      doc.text(String(r.category||''),55,y);
      doc.text(String(r.totalStock),88,y);
      doc.text(String(r.sold),105,y);
      doc.setTextColor(r.status==='out'?220:r.status==='low'?180:22,r.status==='out'?38:r.status==='low'?100:163,r.status==='out'?38:r.status==='low'?0:74);
      doc.text(String(r.remaining),125,y);
      doc.text(r.status==='out'?'OUT':r.status==='low'?'LOW':'OK',150,y);
      doc.setTextColor(70,70,70);
      doc.text(fmt(r.revenue),185,y,{align:'right'});
      y+=7;
    });
    const pages=doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(180,180,180);doc.text(`Page ${i}/${pages} | The Whisk`,pw/2,290,{align:'center'});}
    doc.save(`stock-report-${todayStr()}.pdf`);
    toast.success('📄 Stock PDF downloaded!');
  };

  // ── Sort header ───────────────────────────────────────────────
  const SortTh=({label,col})=>(
    <th onClick={()=>toggleSort(col)} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-indigo-600 transition-colors">
      <div className="flex items-center gap-1">{label}{sortKey===col&&<span className="text-indigo-500">{sortAsc?'↑':'↓'}</span>}</div>
    </th>
  );

  // Low-stock toast
  useEffect(()=>{
    if(lowCount+outCount>0) toast(`⚠️ ${lowCount+outCount} item(s) need attention!`,{icon:'📦',duration:5000,id:'stock-warn'});
  },[lowCount,outCount]);

  // ── Detail helpers ────────────────────────────────────────────
  const detailRestocks = detail ? restocks.filter(r=>r.product_id===detail.id) : [];

  return(
    <div className="min-h-screen bg-gray-50 pt-16" style={{fontFamily:"'Inter',sans-serif"}}>

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg">
        {/* Subtle background gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left: Title + Subtitle */}
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm shadow-inner flex items-center justify-center text-2xl flex-shrink-0 border border-white/20">📊</div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold leading-tight drop-shadow-sm">Stock Analysis</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1.5">
                  <span className="flex items-center gap-1.5 text-blue-100 text-sm font-semibold whitespace-nowrap drop-shadow-sm">
                    <span className="text-base drop-shadow-sm">🧁</span> The Whisk Bakery
                  </span>
                  <span className="hidden sm:inline text-blue-300/60">•</span>
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-300 group cursor-default" title="admin@thewhisk.com">
                    <svg className="w-4 h-4 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span className="truncate max-w-[200px] sm:max-w-xs group-hover:text-white transition-colors">admin@thewhisk.com</span>
                  </span>
                </div>
              </div>
            </div>
            {/* Right: Action buttons */}
            <div className="flex gap-2 flex-wrap items-center flex-shrink-0">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">📊 CSV</button>
              <button onClick={exportPDF} className="flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">📄 PDF</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {label:'Total Products',value:totalProducts,icon:'🛍️',color:'#8b5cf6',bg:'#f5f3ff',border:'#c4b5fd',isCount:true},
            {label:'Stock Available',value:totalStock,icon:'📦',color:'#06b6d4',bg:'#ecfeff',border:'#a5f3fc',isCount:true},
            {label:'Low Stock',value:lowCount,icon:'⚠️',color:'#f59e0b',bg:'#fffbeb',border:'#fcd34d',isCount:true},
            {label:'Out of Stock',value:outCount,icon:'🚫',color:'#ef4444',bg:'#fef2f2',border:'#fca5a5',isCount:true},
          ].map(c=>(
            <motion.div key={c.label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
              className="rounded-2xl p-5 shadow-sm" style={{backgroundColor:c.bg,border:`1px solid ${c.border}`}}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs font-bold px-2 py-1 rounded-full" style={{color:c.color,background:c.color+'20'}}>{c.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{color:c.color}}>{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.isCount?'items':'all time'}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {label:'Total Sold',value:totalSold,icon:'🛒',color:'#ec4899'},
            {label:'Total Revenue',value:fmt(totalRevenue),icon:'💰',color:'#22c55e'},
            {label:'Avg Stock/Product',value:totalProducts?Math.round(totalStock/totalProducts):0,icon:'📈',color:'#8b5cf6'},
            {label:'Stock Turnover',value:totalStock>0?(totalSold/totalStock*100).toFixed(1)+'%':'0%',icon:'🔄',color:'#f59e0b'},
          ].map(s=>(
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              </div>
              <p className="text-xl font-bold mt-1" style={{color:s.color}}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* AI Shortage Predictions */}
        {predictions.length>0&&(
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <span className="text-2xl">🤖</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-50 animate-pulse"/>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Shortage Predictions</h2>
                <p className="text-xs text-gray-400">AI-estimated based on sell velocity</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.slice(0,6).map(p=>(
                <div key={p.id} className={`rounded-2xl p-4 border shadow-sm ${
                  p.urgency==='critical'?'bg-red-50 border-red-200':'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm text-gray-800 truncate">{p.name}</p>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      p.urgency==='critical'?'bg-red-100 text-red-600':'bg-amber-100 text-amber-700'
                    }`}>{p.urgency==='critical'?'🚨 Critical':'⚠️ Warning'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-gray-400">Remaining</p>
                      <p className="text-sm font-bold text-gray-700">{p.remaining}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Sell Rate</p>
                      <p className="text-sm font-bold text-blue-600">{p.dailyRate}/day</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">Runs Out</p>
                      <p className={`text-sm font-bold ${p.urgency==='critical'?'text-red-600':'text-amber-600'}`}>
                        {p.daysLeft<999?`~${p.daysLeft}d`:'—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{borderColor:p.urgency==='critical'?'#fecaca':'#fde68a'}}>
                    <p className="text-[10px] text-gray-400">
                      Est. stockout: <span className="font-semibold text-gray-600">{p.predictedDate}</span>
                    </p>
                    <button onClick={()=>{setRestockId(p.id);setRestockQty(String(p.suggestedRestock));}}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors">
                      + Restock {p.suggestedRestock}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Low Stock Alert Banner */}
        {(lowCount+outCount)>0&&(
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div className="flex-1">
              <p className="font-bold text-red-800 text-sm">Stock Alert — {lowCount+outCount} items need attention</p>
              <p className="text-xs text-red-500">
                {stockRows.filter(r=>r.status!=='ok').map(r=>r.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all"/>
            </div>
            <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-600">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <p className="text-xs text-gray-400 ml-auto">{filtered.length} items</p>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-700">📋 Stock Inventory ({filtered.length})</h3>
          </div>

          {loading?(
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"/>
            </div>
          ):filtered.length===0?(
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">📦</p>
              <p className="font-semibold">No products found</p>
            </div>
          ):(
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <SortTh label="Product" col="name"/>
                    <SortTh label="Category" col="category"/>
                    <SortTh label="Total Stock" col="totalStock"/>
                    <SortTh label="Sold" col="sold"/>
                    <SortTh label="Remaining" col="remaining"/>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Days Left</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <SortTh label="Revenue" col="revenue"/>
                    <th className="px-4 py-3"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(r=>(
                    <tr key={r.id} className={`hover:bg-indigo-50/30 transition-colors cursor-pointer group ${r.status==='out'?'bg-red-50/40':r.status==='low'?'bg-amber-50/40':''}`}
                      onClick={()=>setDetail(r)}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                          onClick={e=>{e.stopPropagation();navigate(`/stock/${r.id}`);}}
                          title="View full details">{r.name}</p>
                        {r.description&&<p className="text-xs text-gray-400 truncate max-w-[160px]">{r.description}</p>}
                      </td>
                      <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">{r.category||'—'}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.totalStock}</td>
                      <td className="px-4 py-3 text-sm font-medium text-pink-600">{r.sold}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-bold ${r.status==='out'?'text-red-600':r.status==='low'?'text-amber-600':'text-green-600'}`}>
                          {r.remaining}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-blue-600">{r.dailyRate.toFixed(1)}/d</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${r.daysLeft<=3?'text-red-600':r.daysLeft<=7?'text-amber-600':'text-gray-500'}`}>
                          {r.daysLeft<999?`${r.daysLeft}d`:'∞'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status==='out'?(
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-100 text-red-600 animate-pulse">Out of Stock</span>
                        ):r.status==='low'?(
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Low Stock</span>
                        ):(
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-600">In Stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-600">{fmt(r.revenue)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>{setRestockId(r.id);setRestockQty('50');}} title="Restock"
                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-all text-sm">📦+</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Charts */}
        <h2 className="text-xl font-bold text-gray-700">📈 Stock Analytics</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Usage Over Time */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-4">📉 Stock Usage — Last 14 Days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stockUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={d=>d.slice(5)}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip content={<ChartTip/>}/>
                <Legend/>
                <Line type="monotone" dataKey="unitsSold" name="Units Sold" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{r:5}}/>
                <Line type="monotone" dataKey="ordersPlaced" name="Orders" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{r:5}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pie */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-4">🥧 Stock by Category</h3>
            {catPieData.length>0?(
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={catPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {catPieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {catPieData.slice(0,5).map((d,i)=>(
                    <div key={d.name} className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>{d.name}</div>
                      <span className="font-semibold">{d.value} units</span>
                    </div>
                  ))}
                </div>
              </>
            ):<div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data</div>}
          </div>
        </div>

        {/* Top Sold Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-700 mb-4">🏆 Top Sold Products</h3>
          {topSold.length>0?(
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topSold} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/>
                <XAxis type="number" tick={{fontSize:11}}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:10}} width={120}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="sold" name="Units Sold" fill="#ec4899" radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          ):<div className="h-52 flex items-center justify-center text-gray-400 text-sm">No sales data</div>}
        </div>

      </div>

      {/* ── Product Detail Slide-over ──────────────────────── */}
      <AnimatePresence>
        {detail&&(
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={()=>setDetail(null)}/>
            <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
              transition={{type:'spring',damping:25}}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Stock Details</h2>
                  <button onClick={()=>setDetail(null)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕</button>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-1">{detail.name}</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 font-medium">{detail.category||'—'}</span>
                <p className="text-gray-500 text-sm mt-3 mb-5">{detail.description||'No description.'}</p>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    {label:'Total Stock',   value:detail.totalStock,      icon:'📦', color:'#06b6d4'},
                    {label:'Units Sold',    value:detail.sold,            icon:'🛒', color:'#ec4899'},
                    {label:'Remaining',     value:detail.remaining,       icon:'📊', color:detail.status==='out'?'#ef4444':detail.status==='low'?'#f59e0b':'#22c55e'},
                    {label:'Orders',        value:detail.orderCount,      icon:'📋', color:'#8b5cf6'},
                    {label:'Revenue',       value:fmt(detail.revenue),    icon:'💰', color:'#22c55e'},
                    {label:'Daily Sell Rate',value:detail.dailyRate.toFixed(1)+'/day', icon:'⚡', color:'#f97316'},
                  ].map(s=>(
                    <div key={s.label} className="rounded-2xl p-4" style={{background:s.color+'12',border:`1px solid ${s.color}30`}}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{s.icon}</span>
                        <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                      </div>
                      <p className="text-lg font-bold" style={{color:s.color}}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Stock bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Stock Level</span>
                    <span>{detail.remaining} / {Math.max(detail.totalStock,100)}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{width:`${Math.min(100,(detail.remaining/Math.max(detail.totalStock,100))*100)}%`,
                        background:detail.status==='out'?'#ef4444':detail.status==='low'?'#f59e0b':'#22c55e'}}/>
                  </div>
                </div>

                {/* Predicted stockout */}
                {detail.dailyRate>0&&detail.daysLeft<999&&(
                  <div className={`rounded-2xl p-4 mb-5 ${detail.daysLeft<=3?'bg-red-50 border border-red-200':'bg-amber-50 border border-amber-200'}`}>
                    <p className="text-xs font-bold text-gray-700">🤖 AI Prediction</p>
                    <p className="text-sm text-gray-600 mt-1">
                      At current sell rate ({detail.dailyRate.toFixed(1)}/day), stock runs out in <span className="font-bold">{detail.daysLeft} days</span>.
                      Suggested restock: <span className="font-bold text-indigo-600">{Math.max(50,Math.ceil(detail.dailyRate*14))} units</span>
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <button onClick={()=>navigate(`/stock/${detail.id}`)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white mb-3 transition-all"
                  style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)'}}>
                  📊 View Full Details Page
                </button>
                <button onClick={()=>{setRestockId(detail.id);setRestockQty(String(Math.max(50,Math.ceil(detail.dailyRate*14))));}}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white mb-5 transition-all"
                  style={{background:'linear-gradient(135deg,#4f46e5,#06b6d4)'}}>
                  📦 Restock This Product
                </button>

                {/* Restock History */}
                <div>
                  <h4 className="font-bold text-gray-700 text-sm mb-3">📜 Restock History</h4>
                  {detailRestocks.length===0?(
                    <p className="text-xs text-gray-400">No restocks recorded yet.</p>
                  ):(
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {detailRestocks.map(r=>(
                        <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs font-semibold text-gray-700">+{r.quantity} units</p>
                            {r.note&&<p className="text-[10px] text-gray-400">{r.note}</p>}
                          </div>
                          <p className="text-[10px] text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Restock Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {restockId&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={()=>setRestockId(null)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-1">📦 Restock Product</h3>
              <p className="text-xs text-gray-400 mb-5">{products.find(p=>p.id===restockId)?.name||'Product'}</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Quantity to Add</label>
                  <input type="number" min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Note (optional)</label>
                  <input type="text" value={restockNote} onChange={e=>setRestockNote(e.target.value)} placeholder="e.g. Supplier delivery"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"/>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setRestockId(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleRestock} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{background:'linear-gradient(135deg,#4f46e5,#06b6d4)',opacity:saving?0.7:1}}>
                  {saving?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</>:'✅ Confirm Restock'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
