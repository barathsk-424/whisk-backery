import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiStar, HiOutlineEye } from 'react-icons/hi';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

const WHATSAPP_NUMBER = '916374618833';

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const { addToCart, theme, user } = useStore();
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

  const handleWhatsAppOrder = (e) => {
    if (e) e.stopPropagation();
    const productName = product.name || 'Custom Cake';
    const price = product.price || product.base_price || 0;
    const message = encodeURIComponent(`Hi, I want to order *${productName}* (₹${price.toLocaleString()}) from Whisk Bakery 🎂`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
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
               <HiOutlineEye className="text-base lg:text-lg" /> Quick View
            </button>
         </div>
         {product.is_custom && <div className="absolute top-2 right-2 lg:top-4 lg:right-4 px-2 lg:px-3 py-0.5 lg:py-1 bg-accent text-white text-[8px] lg:text-[9px] font-black uppercase rounded-full shadow-lg">Custom Piece</div>}
      </div>

      <div className="p-3 lg:p-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 lg:mb-3 gap-1 lg:gap-0">
            <h3 className={`font-black tracking-tight text-[10px] lg:text-sm uppercase truncate w-full ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{product.name}</h3>
            <div className="flex items-center gap-1 shrink-0">
               <HiStar className="text-warning text-[10px] lg:text-sm" />
               <span className="text-[10px] lg:text-[11px] font-black text-accent">{product.rating || '5.0'}</span>
            </div>
         </div>

         <p className={`text-[10px] lg:text-[11px] font-bold leading-tight lg:leading-relaxed mb-3 lg:mb-4 line-clamp-2 ${theme === 'dark' ? 'text-white/50' : 'text-brown-400'}`}>
            {product.description || "A masterfully crafted creation."}
         </p>

         <div className="flex flex-col gap-2 pt-2 lg:pt-4 border-t border-brown-50/10">
            <div className="flex items-center justify-between">
              <p className="text-xs lg:text-lg font-black text-accent">₹{(product.price || product.base_price || 0).toLocaleString()}</p>
              <button 
                onClick={handleOpenDetails}
                className={`px-3 lg:px-4 py-1.5 rounded-full text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${
                  theme === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-primary/5 text-primary hover:bg-primary/10'
                }`}
              >
                <HiOutlineEye className="text-xs lg:text-sm" /> Quick View
              </button>
            </div>
            <button 
              onClick={handleWhatsAppOrder}
              className="w-full py-2.5 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-md hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)',
              }}
            >
              <svg viewBox="0 0 32 32" fill="white" className="w-3 h-3 lg:w-3.5 lg:h-3.5">
                <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.052 9.38L1.056 31.5l6.316-2.012A15.916 15.916 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.32 22.616c-.392 1.1-1.94 2.016-3.164 2.284-.84.18-1.936.324-5.628-1.208-4.724-1.96-7.76-6.752-7.996-7.068-.228-.316-1.9-2.528-1.9-4.824 0-2.296 1.204-3.424 1.632-3.892.392-.428 1.044-.624 1.672-.624.2 0 .38.012.54.02.468.02.704.048 1.012.784.384.92 1.32 3.216 1.436 3.452.116.236.232.548.076.86-.148.316-.276.512-.512.788-.236.276-.472.488-.708.784-.22.26-.468.536-.2.96.268.428 1.192 1.964 2.56 3.184 1.76 1.568 3.24 2.056 3.704 2.284.384.188.624.16.876-.096.256-.268.96-1.048 1.216-1.412.252-.364.508-.3.856-.18.352.116 2.224 1.048 2.604 1.24.38.188.632.284.728.44.092.156.092.904-.3 2.008z" />
              </svg>
              Order Now
            </button>
         </div>
      </div>
    </motion.div>
  );
}
