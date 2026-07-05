import { useState, useEffect } from 'react';
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
  HiOutlineClock,
  HiOutlineSparkles
} from 'react-icons/hi';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa';
import useStore from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function BundleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, addToCart, fetchReviews, reviews, user, addReview } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState(null);
  const [pincode, setPincode] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBundle();
    fetchReviews(id);
  }, [id, fetchReviews]);

  const fetchBundle = async () => {
    try {
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setBundle(data);
    } catch (error) {
      console.error('Fetch Bundle Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!bundle) return;
    if (!user) {
      toast.error("Please login to reserve this bundle.");
      navigate('/login');
      return;
    }

    addToCart({
      id: bundle.id,
      name: bundle.name,
      description: bundle.items.join(', '),
      category: 'bundle',
      base_price: bundle.final_price,
      price: bundle.final_price,
      image_url: bundle.image_url,
      tags: [bundle.occasion],
      rating: 4.8,
    });
    toast.success(`${bundle.name} added to your Artisan collection! 🎁`);
  };

  const handleBuyNow = () => {
    if (!bundle) return;
    handleAddToCart();
    navigate('/checkout');
  };

  const handleWhatsApp = () => {
    if (!bundle) return;
    const message = `Hi Whisk Bakery! I would like to order the ${bundle.name} bundle. Is it available?`;
    window.open(`https://wa.me/916374618833?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCall = () => {
    window.location.href = "tel:+916374618833";
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Please login to transmit your sentiment.");
    if (!reviewForm.comment.trim()) return toast.error("Archival records require a message.");
    
    setSubmittingReview(true);
    const tid = toast.loading("Archiving transmission...");
    try {
      await addReview({
        product_id: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim()
      });
      toast.success("Sentiment archived successfully!", { id: tid });
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
    } catch (err) {
      toast.error("Transmission failed: " + err.message, { id: tid });
    } finally {
      setSubmittingReview(false);
    }
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

  if (!bundle) {
    return (
      <div className={`min-h-screen pt-32 px-6 text-center ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
        <h2 className="text-4xl font-black text-primary mb-4 uppercase">Bundle Not Found</h2>
        <p className="text-brown-400 mb-8">The requested bakery signal was lost or archived.</p>
        <button onClick={() => navigate('/bundles')} className="px-10 py-4 gradient-accent text-white font-black rounded-2xl">Return to Bundles</button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 pb-20 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-brown-400 overflow-x-auto whitespace-nowrap no-scrollbar py-2">
           <button onClick={() => navigate('/')} className="hover:text-accent shrink-0">Home</button>
           <HiOutlineChevronRight className="shrink-0" />
           <button onClick={() => navigate('/bundles')} className="hover:text-accent shrink-0">Bundles</button>
           <HiOutlineChevronRight className="shrink-0" />
           <span className="text-accent shrink-0">{bundle.occasion || 'Special Occasion'}</span>
           <HiOutlineChevronRight className="shrink-0" />
           <span className={`${theme === 'dark' ? 'text-white' : 'text-primary'} shrink-0`}>{bundle.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT: Image System */}
          <div className="space-y-6">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`rounded-[2rem] sm:rounded-[3.5rem] overflow-hidden border-4 ${theme === 'dark' ? 'border-[#1A1110] bg-[#1A1110]' : 'border-white bg-white'} shadow-luxury relative group`}
             >
                <img 
                  src={bundle.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&fm=webp&q=80'} 
                  className="w-full h-auto aspect-square object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                
                <div className="absolute top-6 left-6 px-4 py-2 bg-success text-white text-xs font-black rounded-full shadow-lg">
                  {bundle.discount}% OFF
                </div>

                <div className="absolute top-8 right-8 flex flex-col gap-3">
                   <button className="p-4 bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-accent transition-colors"><HiStar /></button>
                </div>
             </motion.div>

             <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border-2 cursor-pointer hover:border-accent transition-all ${theme === 'dark' ? 'border-[#1A1110] bg-[#1A1110]' : 'border-white bg-white shadow-sm'}`}>
                     <img src={bundle.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop&fm=webp&q=80'} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" />
                  </div>
                ))}
             </div>
          </div>

          {/* RIGHT: Product Intelligence */}
          <div className="space-y-10">
             <div>
                <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-flex items-center gap-2">
                  <HiOutlineSparkles /> Curated Bundle
                </span>
                <h1 className={`text-3xl sm:text-5xl font-black tracking-tighter mb-4 uppercase ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                  {bundle.emoji} {bundle.name}
                </h1>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-1.5 p-2 px-3 bg-warning/10 rounded-xl">
                      <HiStar className="text-warning text-lg" />
                      <span className="font-black text-warning">4.8</span>
                   </div>
                   <p className="text-brown-400 text-xs font-bold uppercase tracking-widest underline underline-offset-4">{reviews.length} Transmissions</p>
                </div>
             </div>

             <div className="flex flex-wrap items-end gap-4">
                <p className="text-3xl sm:text-4xl font-black text-accent uppercase tracking-tighter">₹{bundle.final_price?.toLocaleString()}</p>
                <p className={`text-xl font-black line-through uppercase tracking-tighter mb-1 opacity-50 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>₹{bundle.original_price?.toLocaleString()}</p>
                <div className="text-success font-black text-[8px] sm:text-[10px] uppercase bg-success/10 px-3 py-1.5 rounded-lg mb-1">
                  Save ₹{bundle.original_price - bundle.final_price}
                </div>
             </div>

             <div className={`p-6 rounded-3xl ${theme === 'dark' ? 'bg-white/5' : 'bg-brown-50/50'}`}>
                <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                   What's Included
                </h4>
                <ul className="space-y-3">
                  {bundle.items && bundle.items.map((item, idx) => (
                    <li key={idx} className={`flex items-center gap-3 text-sm font-bold ${theme === 'dark' ? 'text-white/80' : 'text-brown-500'}`}>
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
             </div>

             {/* Delivery Check */}
             <div className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border ${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-50 shadow-sm'}`}>
                <h4 className={`text-[9px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                   <HiOutlineLocationMarker className="text-accent text-lg" /> Delivery Logistics
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                   <input 
                     type="text" 
                     placeholder="Enter Pincode"
                     value={pincode}
                     onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0,6))}
                     className={`flex-1 p-4 rounded-xl font-bold border-2 transition-all ${
                       theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'bg-secondary border-transparent focus:border-accent'
                     }`}
                   />
                   <button onClick={checkDelivery} className="py-4 sm:px-8 bg-accent text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20">Verify</button>
                </div>
                {deliveryDate && (
                  <div className="mt-4 flex items-center gap-3 text-success font-black text-[9px] uppercase animate-in fade-in slide-in-from-top-1">
                     <HiOutlineBadgeCheck className="text-lg" />
                     Arriving By: {deliveryDate}
                  </div>
                )}
             </div>

             {/* Action Buttons */}
             <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button 
                  onClick={handleAddToCart}
                  className={`py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                    theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-secondary text-primary hover:bg-brown-50 shadow-sm'
                  } border-2 border-transparent hover:border-accent`}
                >
                   <HiOutlineShoppingBag className="text-lg sm:text-xl" /> <span>Add to Cart</span>
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="py-4 gradient-accent text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-xl shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                   <HiOutlineBadgeCheck className="text-lg sm:text-xl" /> <span>Book Now</span>
                </button>
                <button 
                  onClick={handleWhatsApp}
                  className="py-4 bg-[#25D366] text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-xl shadow-[#25D366]/30 hover:scale-[1.02] active:scale-95 transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                   <FaWhatsapp className="text-lg sm:text-xl" /> <span>WhatsApp</span>
                </button>
                <button 
                  onClick={handleCall}
                  className={`py-4 bg-primary rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 ${
                    theme === 'dark' ? 'text-secondary' : 'text-white'
                  }`}
                >
                   <FaPhoneAlt className="text-lg sm:text-xl" /> <span>Call Now</span>
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
                 <h3 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Bundle Specifications</h3>
                 <div className={`rounded-3xl border divide-y overflow-hidden ${theme === 'dark' ? 'bg-[#1A1110] border-white/5 divide-white/5' : 'bg-white border-brown-50 divide-brown-50'}`}>
                     {/* Specification Rows */}
                     {[
                       { l: 'Bundle Name', v: bundle.name },
                       { l: 'Target Occasion', v: bundle.occasion },
                       { l: 'Total Value', v: `₹${bundle.original_price}` },
                       { l: 'Discount Applied', v: `${bundle.discount}%` },
                       { l: 'Packaging', v: 'Premium Bundle Presentation Box' }
                     ].map(row => (
                       <div key={row.l} className="flex flex-col sm:flex-row p-4 sm:p-5 gap-1 sm:gap-10 text-left">
                          <span className="w-full sm:w-40 text-[9px] sm:text-[10px] font-black uppercase text-accent tracking-widest">{row.l}</span>
                          <span className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-white/80' : 'text-primary'}`}>{row.v}</span>
                       </div>
                     ))}
                 </div>
              </div>

              {/* Reviews Section */}
              <div className="space-y-10">
                  <div className="flex justify-between items-end">
                    <h3 className={`text-2xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Temporal Records (Reviews)</h3>
                    <button 
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline"
                    >
                      {showReviewForm ? 'Cancel Transmission' : 'Post Transmission'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showReviewForm && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleReviewSubmit}
                        className={`p-8 rounded-[2.5rem] border overflow-hidden ${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-50 shadow-luxury'}`}
                      >
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-accent mb-6">Transmitting New Sentiment</h4>
                        <div className="space-y-6">
                           <div className="flex gap-2">
                              {[1,2,3,4,5].map(star => (
                                <button 
                                  key={star}
                                  type="button"
                                  onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                  className={`text-2xl transition-all ${reviewForm.rating >= star ? 'text-warning scale-110' : 'text-brown-100'}`}
                                >
                                  <HiStar />
                                </button>
                              ))}
                           </div>
                           <textarea 
                             placeholder="Capture your artisan experience..."
                             required
                             value={reviewForm.comment}
                             onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                             className={`w-full p-5 rounded-2xl border-2 font-bold transition-all min-h-[120px] ${
                               theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'bg-secondary border-transparent focus:border-accent text-primary'
                             }`}
                           />
                           <button 
                             type="submit"
                             disabled={submittingReview}
                             className="w-full py-4 gradient-accent text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-accent/20 disabled:opacity-50"
                           >
                             {submittingReview ? 'Transmitting...' : 'Archive Signal'}
                           </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                 
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
                          <p className="text-[10px] font-bold text-brown-400 uppercase">+91 63746 18833</p>
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
