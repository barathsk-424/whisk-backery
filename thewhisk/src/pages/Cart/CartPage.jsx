import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { HiOutlineTrash, HiOutlineShoppingBag, HiOutlineArrowRight } from 'react-icons/hi';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, getCartTotal } = useStore();

  const handleQuantity = (item, delta) => {
    if (item.quantity + delta > 0) {
      addToCart(item, delta);
    } else if (item.quantity + delta === 0) {
      removeFromCart(item.id, item.selectedSize);
    }
  };
   
  const handleRemove = (item) => {
    removeFromCart(item.id, item.selectedSize);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-secondary">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <HiOutlineShoppingBag className="w-8 h-8 text-accent" />
            <h1 className="font-heading text-4xl font-black text-primary tracking-tight">Your Cart</h1>
          </div>

          {cart.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-brown-100 shadow-sm">
              <span className="text-6xl block mb-4">🛒</span>
              <h2 className="text-xl font-bold text-primary mb-2">Your cart is empty</h2>
              <p className="text-brown-400 mb-8">Looks like you haven't added any treats yet!</p>
              <button 
                onClick={() => navigate('/menu')}
                className="px-8 py-3 gradient-accent text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"
              >
                Go to Menu →
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize || 'std'}`} className="bg-white p-5 rounded-3xl shadow-sm border border-brown-100 flex gap-5 items-center relative group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-inner bg-secondary flex-shrink-0">
                      <img src={item.image || item.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-primary text-base line-clamp-1">
                            {item.name || "Custom Cake"} 
                            <span className="text-accent text-[10px] ml-2 opacity-60">({item.selectedSize || 'Std'})</span>
                          </h3>
                          <p className="text-accent font-black text-lg mt-1">₹{(item?.price || 0).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => handleRemove(item)}
                          className="p-2.5 rounded-2xl text-error/30 hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 lg:opacity-100"
                          title="Remove from cart"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center bg-secondary rounded-xl p-1 border border-brown-50">
                          <button onClick={() => handleQuantity(item, -1)} className="w-8 h-8 flex items-center justify-center text-brown-400 font-bold hover:text-accent transition-colors">-</button>
                          <span className="text-sm font-black w-10 text-center text-primary">{item.quantity}</span>
                          <button onClick={() => handleQuantity(item, 1)} className="w-8 h-8 flex items-center justify-center text-brown-400 font-bold hover:text-accent transition-colors">+</button>
                        </div>
                        
                        <p className="text-[10px] font-black text-brown-300 uppercase tracking-widest hidden sm:block">
                          Subtotal: ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-brown-100 sticky top-28">
                  <h3 className="font-heading font-bold text-primary mb-6">Order Summary</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-brown-400">Subtotal</span>
                      <span className="font-bold text-primary">₹{(getCartTotal() || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brown-400">Delivery</span>
                      <span className="text-success font-bold">FREE</span>
                    </div>
                    <div className="pt-3 border-t border-brown-50 flex justify-between">
                      <span className="font-bold text-primary">Total</span>
                      <span className="font-black text-2xl text-accent">₹{(getCartTotal() || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full py-4 gradient-accent text-white font-black rounded-2xl shadow-lg hover:opacity-90 flex items-center justify-center gap-2 group"
                  >
                    PROCEED TO CHECKOUT
                    <HiOutlineArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <p className="text-[10px] text-center text-brown-300 mt-4 uppercase tracking-widest font-black">
                    Secure 256-bit SSL encrypted checkout
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
