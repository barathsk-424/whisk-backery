import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiStar, HiOutlineChatAlt2, HiX } from 'react-icons/hi';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { addToCart, theme, user, reviews, fetchReviews, addReview } = useStore();
  const [showReviews, setShowReviews] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = (e) => {
    if (e) e.stopPropagation();
    
    if (!user) {
      toast.error("Please login to proceed with the acquisition.", {
        icon: "🔐",
        style: theme === 'dark' ? { background: '#2D1F1F', color: '#FFD7BA' } : { background: '#492A1D', color: '#FFF8E7' }
      });
      navigate('/login');
      return;
    }

    addToCart(product);
    toast.success(`${product.name} ready for delivery! 🧁`, {
      style: theme === 'dark' ? { background: '#1A1211', color: '#FFF8E7', border: '1px solid rgba(255,255,255,0.1)' } : { background: '#4A2A1A', color: '#FFF8E7' }
    });
  };

  const handleOpenDetails = (e) => {
    if (e) e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  const submitReview = async () => {
    if (!user) return toast.error("Please login to review artifacts");
    if (!newReview.comment.trim()) return toast.error("Please leave a transmission signal (comment)");
    
    setSubmitting(true);
    try {
      await addReview({ product_id: product.id, ...newReview });
      toast.success("Artisan signal received! ⭐");
      setNewReview({ rating: 5, comment: '' });
    } catch (e) {
      toast.error("Signal lost. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleOpenDetails}
      className={`rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border shadow-luxury group transition-all duration-500 cursor-pointer ${
        theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-brown-50'
      }`}
    >
      <div className="relative h-40 lg:h-56 overflow-hidden">
         <img 
           src={product.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'} 
           alt={product.name} 
           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 lg:p-6">
            <button className="text-white text-[9px] lg:text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <HiOutlineChatAlt2 className="text-base lg:text-lg" /> Inspect Artifact
            </button>
         </div>
         {product.is_custom && <div className="absolute top-2 right-2 lg:top-4 lg:right-4 px-2 lg:px-3 py-0.5 lg:py-1 bg-accent text-white text-[8px] lg:text-[9px] font-black uppercase rounded-full shadow-lg">Custom Piece</div>}
      </div>

      <div className="p-3 lg:p-6">
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-1 lg:mb-3 gap-1 lg:gap-0">
            <h3 className={`font-black tracking-tight text-[11px] lg:text-sm uppercase truncate w-full ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{product.name}</h3>
            <div className="flex items-center gap-1">
               <HiStar className="text-warning text-[10px] lg:text-sm" />
               <span className="text-[10px] lg:text-[11px] font-black text-accent">{product.rating || '5.0'}</span>
            </div>
         </div>

         <p className={`text-[10px] lg:text-[11px] font-bold leading-tight lg:leading-relaxed mb-3 lg:mb-6 line-clamp-2 ${theme === 'dark' ? 'text-white/50' : 'text-brown-400'}`}>
            {product.description || "A masterfully crafted creation."}
         </p>

         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pt-2 lg:pt-4 border-t border-brown-50/10 gap-2 lg:gap-0">
            <p className="text-sm lg:text-lg font-black text-accent">₹{(product.price || product.base_price || 0).toLocaleString()}</p>
            <button 
              onClick={handleOpenDetails}
              className="w-full lg:w-auto px-4 lg:px-6 py-1.5 lg:py-2 bg-accent text-white rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all text-center"
            >
               Order
            </button>
         </div>
      </div>
    </motion.div>
  );
}
