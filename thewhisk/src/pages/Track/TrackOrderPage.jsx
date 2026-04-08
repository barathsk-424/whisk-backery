import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import useStore from '../../store/useStore';
import { HiArrowLeft, HiMagnifyingGlass, HiOutlineShoppingCart, HiChevronRight, HiOutlineShieldCheck } from 'react-icons/hi2';

const STEPS = [
  { key: 'placed', label: 'Ordered', dateKey: 'date' },
  { key: 'preparing', label: 'Packed', dateKey: 'packedDate' },
  { key: 'out_delivery', label: 'Shipped', dateKey: 'shippedDate' },
  { key: 'delivered', label: 'Delivery', dateKey: 'deliveryDate' },
];

const STATUS_SEQ = STEPS.map((s) => s.key);

function getStepIdx(key) {
  const i = STATUS_SEQ.indexOf(key);
  return i === -1 ? 0 : i;
}

export default function TrackOrderPage() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [inputId, setInputId] = useState('');
  const [order, setOrder] = useState(null);
  const [statusKey, setStatusKey] = useState('placed');
  const [loading, setLoading] = useState(false);
  const { fetchOrders } = useStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchId = params.get('id');
    const targetId = routeId || searchId;

    if (targetId) {
       setInputId(targetId);
       loadOrder(targetId);
    }
    fetchOrders();
  }, [routeId]);

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
        toast.error('Order ID not recognized in registry.');
      }
    } catch (err) {
      toast.error('Synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIdx = getStepIdx(statusKey);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── FIXED HEADER ─── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#2874F0] text-white px-4 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <HiArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-lg font-bold">Order Details</h1>
        </div>
        <div className="flex items-center gap-5">
           <HiMagnifyingGlass className="text-xl" />
           <HiOutlineShoppingCart className="text-xl" />
        </div>
      </div>

      <div className="pt-[72px] pb-10">
        <AnimatePresence mode="wait">
          {!order ? (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="max-w-md mx-auto mt-10 p-6 text-center"
            >
               <div className="mb-6">
                 <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-2130356-1800917.png" alt="Empty" className="w-48 mx-auto opacity-50" />
               </div>
               <h3 className="text-xl font-bold text-gray-800 mb-2">Track Your Artisan Piece</h3>
               <p className="text-gray-500 text-sm mb-6">Enter your unique order signature to monitor your fulfillment phase.</p>
               
               <div className="flex gap-2 overflow-hidden border border-[#2874F0]/20 rounded-xl bg-gray-50 p-1 mb-4 focus-within:border-[#2874F0] transition-all">
                 <input 
                   type="text" 
                   value={inputId}
                   onChange={(e) => setInputId(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && loadOrder(inputId)}
                   placeholder="Enter Order ID"
                   className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
                 />
                 <button 
                   onClick={() => loadOrder(inputId)}
                   className="bg-[#2874F0] text-white px-6 py-3 rounded-lg font-bold text-sm"
                 >
                   TRACK
                 </button>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl mx-auto"
            >
              {/* ORDER INFO SECTION */}
              <div className="p-4 border-b border-gray-100 mb-2">
                 <p className="text-[11px] font-bold text-gray-400 mb-1">Order ID - {order.id}</p>
                 <div className="flex justify-between items-start mt-4">
                    <div className="flex-1 pr-4">
                       <h2 className="text-base font-bold text-gray-800 line-clamp-1">{order.items[0]?.name}</h2>
                       <p className="text-sm text-gray-400 mt-1">Quantity: {order.items[0]?.quantity}</p>
                       <p className="text-sm text-gray-400 mt-0.5">Seller: The Whisk Artisan</p>
                       <p className="text-lg font-bold text-gray-900 mt-2">₹{order.total?.toLocaleString()}</p>
                    </div>
                    <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 shrink-0">
                       <img src={order.items[0]?.image_url} alt="Item" className="w-full h-full object-cover" />
                    </div>
                 </div>
              </div>

              {/* STEPPER SECTION */}
              <div className="px-6 py-8">
                <div className="relative">
                  {STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isLast = idx === STEPS.length - 1;
                    
                    return (
                      <div key={step.key} className="flex gap-6 min-h-[80px] relative">
                        {/* LINE */}
                        {!isLast && (
                          <div className={`absolute left-[5px] top-[14px] w-[2px] h-[calc(100%-14px)] ${idx < currentStepIdx ? 'bg-[#388E3C]' : 'bg-gray-200'}`} />
                        )}

                        {/* DOT */}
                        <div className={`w-[12px] h-[12px] rounded-full mt-[6px] relative z-10 shrink-0 ${isCompleted ? 'bg-[#388E3C]' : 'bg-gray-200'} ${idx === currentStepIdx ? 'ring-8 ring-[#388E3C]/10 ring-offset-0' : ''}`} />

                        {/* CONTENT */}
                        <div className="pb-8">
                           <div className="flex items-center gap-1">
                              <p className={`text-sm font-bold ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</p>
                              {idx === 3 && <HiChevronRight className="text-gray-400" />}
                           </div>
                           <p className="text-xs text-gray-400 mt-1">
                             {isCompleted ? new Date(order.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: "2y" }).replace(/ /g, ', ') : 'Pending'}
                           </p>
                           {idx === 3 && isCompleted && (
                             <div className="mt-2">
                                <p className="text-[11px] text-gray-500">Enjoy your artisan piece!</p>
                             </div>
                           )}
                           {idx === 3 && !isCompleted && (
                             <div className="mt-2">
                                <p className="text-[11px] text-gray-500">Expected soon</p>
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex border-t border-b border-gray-100">
                 <button className="flex-1 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors border-r border-gray-100">
                    Cancel
                 </button>
                 <button className="flex-1 py-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    Need help?
                 </button>
              </div>

              {/* SAFETY BANNER */}
              <div className="m-4 p-4 bg-[#E1F1FF] rounded-lg border border-[#2874F0]/10 flex items-center gap-4 cursor-pointer hover:bg-[#D5E9FF] transition-colors">
                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#2874F0] text-xl shrink-0">
                    <HiOutlineShieldCheck />
                 </div>
                 <div className="flex-1">
                    <p className="text-sm font-bold text-[#1A4B8B]">Your Safety Comes First</p>
                    <p className="text-[10px] text-[#1A4B8B]/70">We are taking important measures to keep you safe</p>
                 </div>
                 <HiChevronRight className="text-gray-400" />
              </div>

              {/* ISSUES SECTION */}
              <div className="bg-gray-50 p-4">
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Your issues with this item</p>
                 
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-8">
                    <div className="flex items-start justify-between">
                       <div>
                          <p className="text-sm font-bold text-gray-800">I have a delivery related issues</p>
                          <div className="flex items-center gap-2 mt-4 text-[#2874F0]">
                             <div className="w-4 h-4 rounded-full border-2 border-[#2874F0] flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-[#2874F0] rounded-full" />
                             </div>
                             <p className="text-xs font-bold font-sans">Issue will be resolved by Today, Aug 22.</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <button className="w-full p-4 flex items-center justify-between text-sm font-bold text-gray-700 bg-white rounded-xl shadow-sm border border-gray-100">
                    <span>View All Issues</span>
                    <HiChevronRight className="text-gray-400" />
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
