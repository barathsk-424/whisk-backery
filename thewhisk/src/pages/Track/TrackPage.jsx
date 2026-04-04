import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { orderStatuses, mockOrders } from '../../data/mockData';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { HiOutlinePhone, HiOutlineDownload, HiOutlineRefresh } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function TrackPage() {
  const { orders } = useStore();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [liveStatus, setLiveStatus] = useState('');
  const [history, setHistory] = useState([]);

  // Load history from local storage
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');
      setHistory(savedHistory);
      
      // Auto-load last order uniquely
      const lastOrderStr = localStorage.getItem('lastOrder');
      if (lastOrderStr && !trackedOrder) {
        const order = JSON.parse(lastOrderStr);
        setTrackedOrder(order);
        setLiveStatus(order.status?.toLowerCase() === 'confirmed' ? 'confirmed' : 'preparing'); // Set initial
        setOrderId(order.id);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Demo auto-progression simulation logic based on user request
  useEffect(() => {
    if (!trackedOrder) return;

    const sequence = ['confirmed', 'preparing', 'baking', 'quality_check', 'out_for_delivery', 'delivered'];
    let currentIdx = sequence.indexOf(liveStatus);
    if (currentIdx === -1) currentIdx = 0;

    if (currentIdx < sequence.length - 1) {
      const timer = setTimeout(() => {
        const nextStatus = sequence[currentIdx + 1];
        setLiveStatus(nextStatus);
        
        // Notifications
        if (nextStatus === 'preparing') toast('Your cake is being prepared 🎂');
        if (nextStatus === 'out_for_delivery') toast.success('Out for delivery! 🚚');
        if (nextStatus === 'delivered') toast.success('Delivered successfully ✅');
        
      }, 4000); // Progress every 4 seconds for simulation
      return () => clearTimeout(timer);
    }
  }, [liveStatus, trackedOrder]);


  const handleTrack = () => {
    if (!orderId.trim()) {
      toast.error('Please enter an Order ID');
      return;
    }
    // Check history first
    const foundInHistory = history.find(o => o.id === orderId.trim());
    if (foundInHistory) {
      setTrackedOrder(foundInHistory);
      setLiveStatus('delivered'); // Historical orders assume delivered
      return;
    }
    
    // Check mock database
    const foundInMock = mockOrders.find((o) => o.id === orderId.trim());
    if (foundInMock) {
      setTrackedOrder(foundInMock);
      setLiveStatus(foundInMock.status);
    } else {
      toast.error('Order not found. Showing demo tracking.');
      const demoOrder = mockOrders[0];
      setTrackedOrder(demoOrder);
      setLiveStatus('confirmed');
    }
  };

  const handleDownloadReceipt = () => {
    if (!trackedOrder) return;
    const content = `THE WHISK - RECEIPT\nOrder: ${trackedOrder.id}\nStatus: ${liveStatus}\nTotal: ₹${trackedOrder.total}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${trackedOrder.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Progress Bar width calculation
  const currentStatusIdx = orderStatuses.findIndex((s) => s.key === liveStatus) !== -1 
    ? orderStatuses.findIndex((s) => s.key === liveStatus) 
    : 0;
  const progressPercent = Math.max(5, (currentStatusIdx / (orderStatuses.length - 1)) * 100);

  return (
    <div className="min-h-screen pt-24 pb-12 bg-brown-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8">
      
         {/* Main Track Column */}
         <div className="flex-1">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-primary">📦 Track Order</h1>
              <p className="text-brown-400 mt-1">Live tracking and delivery status</p>
            </motion.div>

            {/* Search Input */}
            <div className="flex gap-3 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-brown-100">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g., ORD-12345)"
                className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none"
              />
              <button
                onClick={handleTrack}
                className="px-8 py-3 gradient-accent text-white font-bold rounded-xl text-sm transition-opacity hover:opacity-90 shadow-lg shadow-accent/20"
              >
                Track
              </button>
            </div>

            {trackedOrder ? (
               <AnimatePresence mode="wait">
                 <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                 
                   {/* Delivery Progress Card */}
                   <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-brown-100">
                     <div className="flex justify-between items-end mb-6">
                       <div>
                         <p className="text-xs font-bold text-brown-400 uppercase tracking-wider mb-1">Order Status</p>
                         <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary">
                           {orderStatuses[currentStatusIdx]?.label || 'Confirmed'}
                         </h2>
                       </div>
                       <span className="px-3 py-1.5 bg-brown-50 text-brown-500 font-bold text-xs md:text-sm rounded-full border border-brown-100 hidden md:block">
                         {trackedOrder.id}
                       </span>
                     </div>

                     {/* Animated Progress Bar */}
                     <div className="relative h-2 bg-brown-50 rounded-full mb-10 overflow-hidden pointer-events-none">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${progressPercent}%` }} 
                         transition={{ duration: 0.8, ease: "easeInOut" }}
                         className="absolute top-0 left-0 h-full gradient-accent rounded-full"
                       />
                     </div>

                     {/* Status Steps */}
                     <div className="relative">
                        {orderStatuses.map((status, i) => {
                          const isComplete = i <= currentStatusIdx;
                          const isCurrent = i === currentStatusIdx;
                          return (
                            <div key={status.key} className="flex gap-4 mb-8 last:mb-0 relative">
                               {i < orderStatuses.length - 1 && (
                                 <div className={`absolute left-[19px] top-10 w-0.5 h-[calc(100%+8px)] transition-colors duration-500 ${isComplete ? 'bg-accent' : 'bg-brown-100'}`} />
                               )}
                               <motion.div 
                                  animate={isCurrent ? { scale: [1, 1.15, 1], boxShadow: "0 0 15px rgba(255,107,53,0.3)" } : {}} 
                                  transition={{ repeat: isCurrent ? Infinity : 0, duration: 1.5 }}
                                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors duration-500 border-2 ${isComplete ? 'bg-accent border-accent text-white' : 'bg-white border-brown-200 text-brown-300'}`}
                               >
                                  {isComplete && !isCurrent ? <span className="text-sm">✔</span> : <span className="text-lg">{status.icon}</span>}
                               </motion.div>
                               <div className={`pt-1.5 flex-1 ${isComplete ? 'opacity-100' : 'opacity-40'}`}>
                                  <h4 className={`font-bold text-sm ${isCurrent ? 'text-accent text-base' : 'text-primary'}`}>{status.label}</h4>
                                  <p className="text-xs text-brown-400 mt-1">{status.description}</p>
                                  {isCurrent && status.key === 'out_for_delivery' && (
                                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4 shadow-sm">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm border border-orange-100">🛵</div>
                                        <div className="flex-1">
                                          <p className="text-[10px] font-bold text-brown-400 uppercase tracking-widest mb-0.5">Delivery Executive</p>
                                          <p className="text-sm font-bold text-primary">Ravi Kumar</p>
                                          <p className="text-xs text-brown-400 font-medium">Arriving in 15 mins</p>
                                        </div>
                                        <button className="w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent-light transition-colors">
                                          <HiOutlinePhone className="w-5 h-5" />
                                        </button>
                                     </motion.div>
                                  )}
                               </div>
                            </div>
                          )
                        })}
                     </div>
                   </div>

                   {/* Order Details Mini Card */}
                   <div className="bg-white rounded-3xl p-6 shadow-sm border border-brown-100">
                     <div className="flex justify-between items-center mb-4 border-b border-brown-50 pb-4">
                       <h3 className="font-bold text-primary text-sm">Items & Bill</h3>
                       <button onClick={handleDownloadReceipt} className="text-xs font-bold text-accent px-3 py-1.5 bg-accent/5 border border-accent/10 rounded-lg flex items-center gap-1 hover:bg-accent hover:text-white transition-colors">
                         <HiOutlineDownload /> Download Invoice
                       </button>
                     </div>
                     <div className="space-y-4">
                       {trackedOrder.items?.map((item, idx) => (
                         <div key={idx} className="flex gap-4 items-center">
                           <img src={item.image_url || item.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop'} alt="Cake" className="w-14 h-14 object-cover rounded-xl border border-brown-50 shadow-sm" />
                           <div className="flex-1">
                             <p className="text-sm font-bold text-primary">{item.name}</p>
                             <p className="text-xs text-brown-400 font-medium">Qty: {item.quantity}</p>
                           </div>
                           <p className="text-sm font-bold text-primary">₹{(item.base_price * item.quantity).toLocaleString()}</p>
                         </div>
                       ))}
                     </div>
                   </div>

                 </motion.div>
               </AnimatePresence>
            ) : (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-10 text-center shadow-sm border border-brown-100 flex flex-col items-center justify-center h-64">
                 <div className="w-16 h-16 bg-brown-50 rounded-full flex items-center justify-center text-3xl mb-4">🔍</div>
                 <h3 className="text-lg font-bold text-primary mb-2">No Order Selected</h3>
                 <p className="text-sm text-brown-400">Enter a valid Order ID to track your custom cake live.</p>
               </motion.div>
            )}
         </div>

         {/* Sidebar: History */}
         <div className="lg:w-80 shrink-0">
           <div className="bg-white rounded-3xl p-6 shadow-sm border border-brown-100 sticky top-24">
             <div className="flex justify-between items-center mb-6">
               <h3 className="font-heading font-bold text-primary text-lg">Order History</h3>
               <button onClick={() => window.location.reload()} className="text-brown-300 hover:text-accent transition-colors"><HiOutlineRefresh className="w-5 h-5" /></button>
             </div>
             
             {history.length > 0 ? (
               <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {history.slice().reverse().map((histOrder, i) => (
                   <button 
                     key={i}
                     onClick={() => { setOrderId(histOrder.id); setTrackedOrder(histOrder); setLiveStatus('delivered'); }}
                     className={`w-full text-left p-4 rounded-2xl border transition-all ${trackedOrder?.id === histOrder.id ? 'border-accent bg-accent/5' : 'border-brown-50 hover:border-brown-200 bg-brown-50/30'}`}
                   >
                     <div className="flex justify-between items-start mb-2">
                       <p className="text-[10px] font-bold text-brown-400 uppercase tracking-widest">{histOrder.id}</p>
                       <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success uppercase">
                         {histOrder.status || 'Confirmed'}
                       </span>
                     </div>
                     <p className="text-sm font-bold text-primary leading-tight line-clamp-1">{histOrder.items?.[0]?.name || 'Custom Order'}</p>
                     <p className="text-xs text-brown-400 font-bold mt-1">₹{histOrder.total.toLocaleString()}</p>
                   </button>
                 ))}
               </div>
             ) : (
               <div className="text-center py-6 border-2 border-dashed border-brown-100 rounded-2xl bg-brown-50/50">
                 <p className="text-xs text-brown-400 font-medium px-4">No past orders found on this device.</p>
                 <button onClick={() => navigate('/menu')} className="mt-4 px-5 py-2 bg-white border border-brown-200 text-primary text-xs font-bold rounded-lg hover:border-accent transition-colors shadow-sm">
                   Browse Menu
                 </button>
               </div>
             )}
           </div>
         </div>
      </div>
    </div>
  );
}
