import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiStar, 
  HiOutlineShoppingBag, 
  HiOutlineShieldCheck, 
  HiOutlineTruck, 
  HiOutlineSupport, 
  HiOutlineBadgeCheck,
  HiOutlineChevronRight,
  HiOutlineLocationMarker,
  HiOutlineClock
} from 'react-icons/hi';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, theme, addToCart, fetchReviews, reviews, user } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('1kg');
  const [pincode, setPincode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const found = products.find(p => p.id === id);
    if (found) {
      setProduct(found);
      fetchReviews(id);
      setLoading(false);
    } else if (products.length > 0) {
      setLoading(false); // Not found
    }
  }, [id, products, fetchReviews]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.price || product.base_price || 0;
    if (selectedSize === '0.5kg') return Math.round(base * 0.6);
    if (selectedSize === '2kg') return Math.round(base * 1.8);
    if (selectedSize === '3kg') return Math.round(base * 2.5);
    return base;
  }, [product, selectedSize]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({ ...product, selectedSize, price: currentPrice });
    toast.success(`${product.name} added to your Artisan collection! 🧁`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({ ...product, selectedSize, price: currentPrice });
    navigate('/checkout');
  };

  const checkDelivery = () => {
    if (pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit coordinates (pincode)");
      return;
    }
    const days = Math.floor(Math.random() * 2) + 1;
    const date = new Date();
    date.setDate(date.getDate() + days);
    setDeliveryDate(date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }));
    toast.success("Delivery signal verified! 🛸");
  };

  if (loading) {
     return (
       <div className={`min-h-screen pt-32 flex items-center justify-center ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
         <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
       </div>
     );
  }

  if (!product) {
    return (
      <div className={`min-h-screen pt-32 px-6 text-center ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
        <h2 className="text-4xl font-black text-primary mb-4 uppercase">Artifact Not Found</h2>
        <p className="text-brown-400 mb-8">The requested bakery signal was lost or archived.</p>
        <button onClick={() => navigate('/menu')} className="px-10 py-4 gradient-accent text-white font-black rounded-2xl">Return to Menu</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 pb-20 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-10 text-[10px] font-black uppercase tracking-widest text-brown-400 overflow-x-auto whitespace-nowrap scrollbar-hide">
           <button onClick={() => navigate('/')} className="hover:text-accent">Home</button>
           <HiOutlineChevronRight />
           <button onClick={() => navigate('/menu')} className="hover:text-accent">Collection</button>
           <HiOutlineChevronRight />
           <span className="text-accent">{product.category || 'Artisan'}</span>
           <HiOutlineChevronRight />
           <span className={`${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT: Image System */}
          <div className="space-y-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`rounded-[3.5rem] overflow-hidden border-4 ${theme === 'dark' ? 'border-[#1A1110] bg-[#1A1110]' : 'border-white bg-white'} shadow-luxury relative group`}
             >
                <img 
                  src={product.image_url || product.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop'} 
                  className="w-full h-auto aspect-square object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute top-8 right-8 flex flex-col gap-3">
                   <button className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-accent transition-colors"><HiStar /></button>
                </div>
             </motion.div>

             <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`aspect-square rounded-3xl overflow-hidden border-2 cursor-pointer hover:border-accent transition-all ${theme === 'dark' ? 'border-[#1A1110] bg-[#1A1110]' : 'border-white bg-white'}`}>
                     <img src={product.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop'} className="w-full h-full object-cover opacity-60 hover:opacity-100" />
                  </div>
                ))}
             </div>
          </div>

          {/* RIGHT: Product Intelligence */}
          <div className="space-y-10">
             <div>
                <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Premium Collection</span>
                <h1 className={`text-5xl font-black tracking-tight mb-4 uppercase ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                  {product.name}
                </h1>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-1.5 p-2 px-3 bg-warning/10 rounded-xl">
                      <HiStar className="text-warning text-lg" />
                      <span className="font-black text-warning">4.9</span>
                   </div>
                   <p className="text-brown-400 text-xs font-bold uppercase tracking-widest underline underline-offset-4">{reviews.length} Transmissions</p>
                </div>
             </div>

             <div className="flex items-end gap-4">
                <p className="text-4xl font-black text-accent uppercase tracking-tighter">₹{currentPrice.toLocaleString()}</p>
                <div className="text-success font-black text-[10px] uppercase bg-success/10 px-3 py-1.5 rounded-lg mb-1">Tax Inclusive</div>
             </div>

             <p className={`text-sm font-bold leading-relaxed max-w-xl ${theme === 'dark' ? 'text-white/60' : 'text-brown-500'}`}>
                {product.description || "A masterfully crafted creation using the finest ceremonial ingredients. This artisan piece features delicate layers, premium imported chocolate, and a secret infusion that defines the Whisk signature experience."}
             </p>

             {/* Size Selector */}
             <div className="space-y-4">
                <h4 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                   Configuration Unit <span className="opacity-30">(Select Size)</span>
                </h4>
                <div className="flex flex-wrap gap-3">
                   {['0.5kg', '1kg', '2kg', '3kg'].map(size => (
                     <button 
                       key={size}
                       onClick={() => setSelectedSize(size)}
                       className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 ${
                         selectedSize === size 
                         ? 'border-accent bg-accent text-white shadow-lg' 
                         : theme === 'dark' ? 'border-[#1A1110] bg-[#1A1110] text-white/40' : 'border-brown-50 bg-white text-brown-400'
                       }`}
                     >
                        {size}
                     </button>
                   ))}
                </div>
             </div>

             {/* Delivery Check */}
             <div className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-50'}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                   <HiOutlineLocationMarker className="text-accent text-lg" /> Delivery Logistics
                </h4>
                <div className="flex gap-2">
                   <input 
                     type="text" 
                     placeholder="Enter Pincode"
                     value={pincode}
                     onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0,6))}
                     className={`flex-1 p-4 rounded-2xl font-bold border-2 transition-all ${
                       theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'bg-secondary border-transparent focus:border-accent'
                     }`}
                   />
                   <button onClick={checkDelivery} className="px-8 bg-accent text-white font-black rounded-2xl text-[10px] uppercase tracking-widest">Verify</button>
                </div>
                {deliveryDate && (
                  <div className="mt-4 flex items-center gap-3 text-success font-black text-[10px] uppercase animate-in fade-in slide-in-from-top-1">
                     <HiOutlineBadgeCheck className="text-xl" />
                     Arriving By: {deliveryDate}
                  </div>
                )}
             </div>

             {/* Action Buttons */}
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleAddToCart}
                  className={`py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 ${
                    theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-secondary text-primary hover:bg-brown-50'
                  } border-2 border-transparent hover:border-accent shadow-xl`}
                >
                   <HiOutlineShoppingBag className="text-xl" /> Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="py-5 gradient-accent text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                   <HiOutlineBadgeCheck className="text-xl" /> Buy Now 🚀
                </button>
             </div>

             {/* Trust Markers */}
             <div className="grid grid-cols-3 gap-6 pt-8 border-t border-brown-50/10">
                <div className="text-center space-y-2">
                   <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto text-2xl"><HiOutlineShieldCheck /></div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-brown-400">Secure Protocol</p>
                </div>
                <div className="text-center space-y-2">
                   <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto text-2xl"><HiOutlineSupport /></div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-brown-400">Artisan Support</p>
                </div>
                <div className="text-center space-y-2">
                   <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto text-2xl"><HiOutlineTruck /></div>
                   <p className="text-[8px] font-black uppercase tracking-widest text-brown-400">Express Signal</p>
                </div>
             </div>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="mt-32 grid lg:grid-cols-3 gap-20">
           
           {/* Specifications */}
           <div className="lg:col-span-2 space-y-12">
              <div className="space-y-6">
                 <h3 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Product Specifications</h3>
                 <div className={`rounded-3xl border divide-y overflow-hidden ${theme === 'dark' ? 'bg-[#1A1110] border-white/5 divide-white/5' : 'bg-white border-brown-50 divide-brown-50'}`}>
                    {[
                      { l: 'Type', v: product.category || 'Flavored Artisan Piece' },
                      { l: 'Base Unit', v: selectedSize },
                      { l: 'Ingredients', v: 'Pure Cocoa, Organic Dairy, Refined Artisan Sugar' },
                      { l: 'Certification', v: 'FSSAI Certified, 100% Ceremonial' },
                      { l: 'Packaging', v: 'Insulated Temporal Container' }
                    ].map(row => (
                      <div key={row.l} className="flex p-5 gap-10">
                         <span className="w-40 text-[10px] font-black uppercase text-brown-400 tracking-widest">{row.l}</span>
                         <span className={`text-sm font-bold ${theme === 'dark' ? 'text-white/80' : 'text-primary'}`}>{row.v}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Reviews Section */}
              <div className="space-y-10">
                 <div className="flex justify-between items-end">
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Temporal Records (Reviews)</h3>
                    <button className="text-accent text-[10px] font-black uppercase tracking-widest">Post Transmission</button>
                 </div>
                 
                 <div className="grid sm:grid-cols-2 gap-6">
                    {reviews.length === 0 ? (
                       <div className={`p-10 rounded-3xl border border-dashed text-center ${theme === 'dark' ? 'bg-[#1A1110] border-white/10' : 'bg-secondary/30 border-brown-100'}`}>
                          <p className="text-brown-400 font-bold uppercase text-[10px] tracking-widest">No archival transmissions yet.</p>
                       </div>
                    ) : (
                       reviews.map((r, i) => (
                         <div key={i} className={`p-8 rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#1A1110] border-white/5 shadow-2xl' : 'bg-white border-brown-50 shadow-luxury'}`}>
                            <div className="flex justify-between mb-6">
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center font-black">{r.user_name?.[0].toUpperCase()}</div>
                                  <div>
                                     <p className={`text-xs font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{r.user_name}</p>
                                     <p className="text-[8px] font-bold text-brown-400 uppercase tracking-widest">Certified Acquisition</p>
                                  </div>
                               </div>
                               <div className="flex gap-0.5 text-warning text-[10px]">
                                  {[...Array(r.rating || 5)].map((_, j) => <HiStar key={j} />)}
                               </div>
                            </div>
                            <p className={`text-sm font-bold leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-brown-500'}`}>{r.comment}</p>
                         </div>
                       ))
                    )}
                 </div>
              </div>
           </div>

           {/* Support & Warranty Sidebars */}
           <div className="space-y-8">
              <div className={`p-8 rounded-[3rem] border-2 border-dashed ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-brown-100'}`}>
                 <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-tighter mb-4 text-accent"><HiOutlineBadgeCheck /> The Whisk Guarantee</h4>
                 <p className="text-[10px] font-bold text-brown-400 leading-relaxed uppercase tracking-wide">Every artifact is visually inspected and hand-crafted 2 hours before delivery for maximum precision and taste fidelity.</p>
              </div>

              <div className={`p-8 rounded-[3rem] border shadow-2xl ${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-50'}`}>
                 <h4 className={`text-lg font-black uppercase mb-6 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Technical Support</h4>
                 <div className="space-y-6">
                    <div className="flex items-start gap-4">
                       <HiOutlineClock className="text-2xl text-accent" />
                       <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Operational Hours</p>
                          <p className="text-[10px] font-bold text-brown-400 uppercase">08:00 AM — 11:30 PM</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <HiOutlineSupport className="text-2xl text-accent" />
                       <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Signal Override</p>
                          <p className="text-[10px] font-bold text-brown-400 uppercase">+91 98765 43210</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
