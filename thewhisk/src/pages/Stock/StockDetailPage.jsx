/**
 * StockDetailPage.jsx
 * ─────────────────────────────────────────────────────────────
 * /stock/:id — Individual product stock deep-dive
 *
 * ✅ Full product info header with status badge
 * ✅ KPI cards (total stock, sold, remaining, revenue, orders, daily rate)
 * ✅ Stock level progress bar
 * ✅ AI shortage prediction panel
 * ✅ Unified timeline (orders + restocks merged chronologically)
 * ✅ Sales over time line chart
 * ✅ Stock decrease graph
 * ✅ Restock modal (with note)
 * ✅ Edit product modal
 * ✅ Delete product with confirmation
 * ✅ Back navigation to /stock-analysis
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────
const fmt  = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);
const LOW  = 10;
const CATEGORIES = ['Cakes','Cupcakes','Pastries','Cookies','Bread','Custom','Bundles','Other'];

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
export default function StockDetailPage(){
  const { id } = useParams();
  const navigate = useNavigate();

  const [product,   setProduct]   = useState(null);
  const [orders,    setOrders]    = useState([]);
  const [restocks,  setRestocks]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Modals
  const [showRestock,  setShowRestock]  = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [restockQty,   setRestockQty]   = useState('50');
  const [restockNote,  setRestockNote]  = useState('');
  const [saving,       setSaving]       = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({name:'',category:'',price:'',stock:'',description:'',image_url:''});

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchData = useCallback(async()=>{
    setLoading(true);
    try{
      const [pRes, oRes, rRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('orders').select('*').eq('product_id', id).order('created_at',{ascending:false}),
        supabase.from('restock_history').select('*').eq('product_id', id).order('created_at',{ascending:false}),
      ]);
      if(pRes.error) throw pRes.error;
      setProduct(pRes.data);
      setOrders(oRes.data||[]);
      setRestocks(rRes.data||[]);
      setEditForm({
        name: pRes.data.name||'',
        category: pRes.data.category||'',
        price: String(pRes.data.price||''),
        stock: String(pRes.data.stock??pRes.data.stock_quantity??''),
        description: pRes.data.description||'',
        image_url: pRes.data.image_url||'',
      });
    }catch(err){ toast.error('Failed to load product: '+err.message); }
    finally{ setLoading(false); }
  },[id]);

  useEffect(()=>{ fetchData(); },[fetchData]);

  // ── Computed ──────────────────────────────────────────────────
  const totalStock  = product ? (product.stock ?? product.stock_quantity ?? 0) : 0;
  const totalSold   = orders.reduce((s,o)=>s+Number(o.quantity||0),0);
  const totalRestocked = restocks.reduce((s,r)=>s+Number(r.quantity||0),0);
  const remaining   = totalStock;
  const revenue     = orders.reduce((s,o)=>s+Number(o.total_price||0),0);
  const orderCount  = orders.length;
  const dailyRate   = totalSold>0 ? totalSold/14 : 0;
  const daysLeft    = dailyRate>0 ? Math.floor(remaining/dailyRate) : 999;
  const status      = remaining===0?'out': remaining<LOW?'low':'ok';

  // ── Timeline (merged orders + restocks) ───────────────────────
  const timeline = useMemo(()=>{
    const items = [];
    orders.forEach(o=>items.push({
      type:'order', date:o.created_at,
      title:`Order #${String(o.id).slice(0,8)}`,
      detail:`${o.quantity} unit(s) sold — ${fmt(o.total_price)}`,
      icon:'🛒', color:'#ec4899',
    }));
    restocks.forEach(r=>items.push({
      type:'restock', date:r.created_at,
      title:`Restocked +${r.quantity} units`,
      detail:r.note||'Manual restock',
      icon:'📦', color:'#06b6d4',
    }));
    items.sort((a,b)=>new Date(b.date)-new Date(a.date));
    return items;
  },[orders,restocks]);

  // ── Sales over time chart (last 14 days) ──────────────────────
  const salesChart = useMemo(()=>{
    const map={};
    const days = Array.from({length:14},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(13-i));
      return d.toISOString().split('T')[0];
    });
    days.forEach(d=>{ map[d]={date:d, unitsSold:0, revenue:0, orders:0}; });
    orders.forEach(o=>{
      const d = o.created_at?.split('T')[0];
      if(map[d]){ map[d].unitsSold+=Number(o.quantity||0); map[d].revenue+=Number(o.total_price||0); map[d].orders++; }
    });
    return Object.values(map);
  },[orders]);

  // ── Stock decrease graph (cumulative stock over time) ─────────
  const stockGraph = useMemo(()=>{
    if(!product) return [];
    // Build points from the earliest event to today
    const events = [];
    orders.forEach(o=>events.push({date:o.created_at, delta:-Number(o.quantity||0)}));
    restocks.forEach(r=>events.push({date:r.created_at, delta:+Number(r.quantity||0)}));
    events.sort((a,b)=>new Date(a.date)-new Date(b.date));

    // Walk backwards from current stock to reconstruct starting stock
    let currentStock = remaining;
    // reverse-apply events to find originalStock
    const reverseEvents = [...events].reverse();
    let startingStock = currentStock;
    reverseEvents.forEach(e=>{ startingStock -= e.delta; });

    // Now walk forward
    const points = [];
    let runningStock = startingStock;
    const days = Array.from({length:14},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(13-i));
      return d.toISOString().split('T')[0];
    });

    // Pre-group events by day
    const dayDeltas={};
    events.forEach(e=>{
      const d = e.date?.split('T')[0];
      dayDeltas[d] = (dayDeltas[d]||0)+e.delta;
    });

    // To show 14-day graph, we start from startingStock and apply each day's delta
    let stockAtDay = startingStock;
    // Apply all events before the 14-day window
    events.forEach(e=>{
      const d = e.date?.split('T')[0];
      if(d<days[0]) stockAtDay += e.delta;
    });

    days.forEach(d=>{
      stockAtDay += (dayDeltas[d]||0);
      points.push({date:d, stock: Math.max(0, stockAtDay)});
    });

    return points;
  },[orders,restocks,remaining,product]);

  // ── Restock handler ───────────────────────────────────────────
  const handleRestock = async()=>{
    if(!restockQty||Number(restockQty)<=0){ toast.error('Enter valid quantity'); return; }
    setSaving(true);
    try{
      const newStock = totalStock + Number(restockQty);
      const [upd, hist] = await Promise.all([
        supabase.from('products').update({stock:newStock,stock_quantity:newStock}).eq('id',id),
        supabase.from('restock_history').insert({product_id:id, quantity:Number(restockQty), note:restockNote||''}),
      ]);
      if(upd.error) throw upd.error;
      if(hist.error) throw hist.error;
      toast.success(`📦 Restocked +${restockQty} units!`);
      setShowRestock(false); setRestockQty('50'); setRestockNote('');
      fetchData();
    }catch(err){ toast.error(err.message); }
    finally{ setSaving(false); }
  };

  // ── Edit handler ──────────────────────────────────────────────
  const handleEdit = async()=>{
    if(!editForm.name.trim()){ toast.error('Name is required'); return; }
    setSaving(true);
    try{
      const payload = {
        name: editForm.name.trim(),
        category: editForm.category,
        price: Number(editForm.price)||0,
        stock: Number(editForm.stock)||0,
        stock_quantity: Number(editForm.stock)||0,
        description: editForm.description.trim(),
        image_url: editForm.image_url.trim(),
      };
      const {error} = await supabase.from('products').update(payload).eq('id',id);
      if(error) throw error;
      toast.success('✅ Product updated!');
      setShowEdit(false);
      fetchData();
    }catch(err){ toast.error(err.message); }
    finally{ setSaving(false); }
  };

  // ── Delete handler ────────────────────────────────────────────
  const handleDelete = async()=>{
    setSaving(true);
    try{
      const {error} = await supabase.from('products').delete().eq('id',id);
      if(error) throw error;
      toast.success('🗑️ Product deleted');
      navigate('/stock-analysis');
    }catch(err){ toast.error(err.message); }
    finally{ setSaving(false); }
  };

  // ── Loading / Not found ───────────────────────────────────────
  if(loading){
    return(
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center" style={{fontFamily:"'Inter',sans-serif"}}>
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"/>
          <p className="mt-4 text-gray-400 text-sm">Loading product data...</p>
        </div>
      </div>
    );
  }
  if(!product){
    return(
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center" style={{fontFamily:"'Inter',sans-serif"}}>
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-xl font-bold text-gray-700">Product Not Found</p>
          <button onClick={()=>navigate('/stock-analysis')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
            ← Back to Stock Analysis
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-gray-50 pt-16" style={{fontFamily:"'Inter',sans-serif"}}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white shadow-lg">
        {/* Subtle background gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back */}
          <button onClick={()=>navigate('/stock-analysis')}
            className="flex items-center gap-2 text-sm text-blue-200 hover:text-white mb-5 transition-colors">
            <span>←</span> Back to Stock Analysis
          </button>

          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Product image */}
            {product.image_url?(
              <img src={product.image_url} alt={product.name}
                className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-white/20 flex-shrink-0"/>
            ):(
              <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center text-4xl flex-shrink-0">🎂</div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {status==='out'?(
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-200 animate-pulse">Out of Stock</span>
                ):status==='low'?(
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200">Low Stock</span>
                ):(
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-400/20 text-green-200">In Stock</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 text-blue-100 font-medium">{product.category||'Uncategorized'}</span>
                <span className="text-sm text-blue-200">{fmt(product.price)}</span>
              </div>
              {product.description&&<p className="text-blue-200 text-sm mt-2 max-w-xl">{product.description}</p>}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <button onClick={()=>setShowRestock(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
                📦 Restock
              </button>
              <button onClick={()=>setShowEdit(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-all">
                ✏️ Edit
              </button>
              <button onClick={()=>setShowDelete(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/30 hover:bg-red-500/50 rounded-xl text-sm font-semibold transition-all">
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── KPI Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {label:'Total Stock',    value:totalStock,              icon:'📦', color:'#06b6d4'},
            {label:'Total Sold',     value:totalSold,               icon:'🛒', color:'#ec4899'},
            {label:'Remaining',      value:remaining,               icon:'📊', color:status==='out'?'#ef4444':status==='low'?'#f59e0b':'#22c55e'},
            {label:'Revenue',        value:fmt(revenue),            icon:'💰', color:'#22c55e'},
            {label:'Total Orders',   value:orderCount,              icon:'📋', color:'#8b5cf6'},
            {label:'Daily Sell Rate',value:dailyRate.toFixed(1)+'/d',icon:'⚡', color:'#f97316'},
          ].map(c=>(
            <motion.div key={c.label} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}
              className="rounded-2xl p-4 shadow-sm" style={{background:c.color+'12',border:`1px solid ${c.color}30`}}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{c.icon}</span>
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
              </div>
              <p className="text-xl font-bold" style={{color:c.color}}>{c.value}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Stock Level Bar + Restocked total ────────────── */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-700">Stock Level</h3>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Total Restocked: <strong className="text-cyan-600">{totalRestocked} units</strong></span>
              <span>Days Left: <strong className={daysLeft<=3?'text-red-600':daysLeft<=7?'text-amber-600':'text-gray-600'}>{daysLeft<999?daysLeft+'d':'∞'}</strong></span>
            </div>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div initial={{width:0}} animate={{width:`${Math.min(100,(remaining/Math.max(totalStock,1))*100)}%`}}
              transition={{duration:1,ease:'easeOut'}}
              className="h-full rounded-full"
              style={{background:status==='out'?'#ef4444':status==='low'?'linear-gradient(90deg,#f59e0b,#fbbf24)':'linear-gradient(90deg,#22c55e,#06b6d4)'}}/>
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-gray-400">
            <span>0</span>
            <span>{remaining} / {Math.max(totalStock,1)} units</span>
          </div>
        </div>

        {/* ── AI Prediction ────────────────────────────────── */}
        {dailyRate>0&&daysLeft<999&&(
          <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}}
            className={`rounded-2xl p-5 border shadow-sm ${daysLeft<=3?'bg-red-50 border-red-200':daysLeft<=7?'bg-amber-50 border-amber-200':'bg-blue-50 border-blue-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🤖</span>
              <h3 className="font-bold text-gray-800 text-sm">AI Stock Prediction</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 uppercase tracking-wider ml-auto">AI-Powered</span>
            </div>
            <p className="text-sm text-gray-600">
              At the current sell rate of <strong>{dailyRate.toFixed(1)} units/day</strong>, this product will be
              <strong className={daysLeft<=3?' text-red-600':daysLeft<=7?' text-amber-600':' text-blue-600'}> out of stock in ~{daysLeft} days</strong>
              {' '}({(() => { const d = new Date(); d.setDate(d.getDate()+daysLeft); return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); })()}).
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Recommended restock: <strong className="text-indigo-600">{Math.max(50, Math.ceil(dailyRate*14))} units</strong> (covers ~2 weeks)
            </p>
            <button onClick={()=>{setRestockQty(String(Math.max(50,Math.ceil(dailyRate*14))));setShowRestock(true);}}
              className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all">
              📦 Quick Restock
            </button>
          </motion.div>
        )}

        {/* ── Charts ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Sales over time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">📈 Sales Over Time (14 Days)</h3>
            {salesChart.some(d=>d.unitsSold>0)?(
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesChart} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Legend/>
                  <Bar dataKey="unitsSold" name="Units Sold" fill="#ec4899" radius={[4,4,0,0]}/>
                  <Bar dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ):(
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center"><p className="text-3xl mb-2">📊</p>No sales data yet</div>
              </div>
            )}
          </div>

          {/* Stock decrease graph */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">📉 Stock Level Over Time</h3>
            {stockGraph.length>0?(
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stockGraph}>
                  <defs>
                    <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Area type="monotone" dataKey="stock" name="Stock Level" stroke="#06b6d4" strokeWidth={2} fill="url(#stockGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            ):(
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center"><p className="text-3xl mb-2">📉</p>No stock history</div>
              </div>
            )}
          </div>

          {/* Revenue over time */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="font-bold text-gray-700 mb-4">💰 Revenue Over Time (14 Days)</h3>
            {salesChart.some(d=>d.revenue>0)?(
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={salesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                  <XAxis dataKey="date" tick={{fontSize:10}} tickFormatter={d=>d.slice(5)}/>
                  <YAxis tick={{fontSize:11}} tickFormatter={v=>fmt(v)}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Legend/>
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" strokeWidth={2.5} dot={{r:3}} activeDot={{r:6}}/>
                </LineChart>
              </ResponsiveContainer>
            ):(
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center"><p className="text-3xl mb-2">💰</p>No revenue data yet</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Timeline ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-700">🕒 Activity Timeline</h3>
            <span className="text-xs text-gray-400">{timeline.length} events</span>
          </div>

          {timeline.length===0?(
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm font-medium">No activity yet</p>
            </div>
          ):(
            <div className="p-6">
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100"/>

                <div className="space-y-4">
                  {timeline.slice(0,30).map((item,i)=>(
                    <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}}
                      className="relative flex items-start gap-4 pl-10">
                      {/* Dot */}
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                        style={{backgroundColor:item.color}}/>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                      </div>
                      <p className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        {' '}
                        {new Date(item.date).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {timeline.length>30&&(
                  <p className="text-xs text-gray-400 mt-4 text-center">+{timeline.length-30} older events not shown</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Restock History Table ─────────────────────────── */}
        {restocks.length>0&&(
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-700">📜 Restock History ({restocks.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {restocks.map(r=>(
                    <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        {' '}
                        <span className="text-gray-400">{new Date(r.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-cyan-600">+{r.quantity} units</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{r.note||'—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ═══════════════ MODALS ═══════════════════════════════ */}

      {/* ── Restock Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showRestock&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={()=>setShowRestock(false)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-1">📦 Restock Product</h3>
              <p className="text-xs text-gray-400 mb-5">{product.name}</p>
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
                <button onClick={()=>setShowRestock(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">Cancel</button>
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

      {/* ── Edit Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showEdit&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={()=>setShowEdit(false)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-800 mb-5">✏️ Edit Product</h3>
              <div className="space-y-4">
                {[
                  {key:'name',      label:'Product Name', type:'text'},
                  {key:'price',     label:'Price (₹)',    type:'number'},
                  {key:'stock',     label:'Stock',        type:'number'},
                  {key:'image_url', label:'Image URL',    type:'text'},
                ].map(f=>(
                  <div key={f.key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.label}</label>
                    <input type={f.type} value={editForm[f.key]} onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"/>
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                  <select value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50">
                    <option value="">Select...</option>
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea rows={3} value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 resize-none"/>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setShowEdit(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleEdit} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{background:'linear-gradient(135deg,#4f46e5,#06b6d4)',opacity:saving?0.7:1}}>
                  {saving?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</>:'💾 Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation ────────────────────────────── */}
      <AnimatePresence>
        {showDelete&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={()=>setShowDelete(false)}>
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
              <p className="text-4xl mb-3">⚠️</p>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Product?</h3>
              <p className="text-sm text-gray-500 mb-1">This will permanently remove</p>
              <p className="text-sm font-bold text-red-600 mb-5">"{product.name}"</p>
              <p className="text-xs text-gray-400 mb-5">All associated orders and restock history will also be deleted. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={()=>setShowDelete(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleDelete} disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                  style={{opacity:saving?0.7:1}}>
                  {saving?<><div className="w-4 h-4 border-2 border-red-300 border-t-white rounded-full animate-spin"/>Deleting...</>:'🗑️ Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
