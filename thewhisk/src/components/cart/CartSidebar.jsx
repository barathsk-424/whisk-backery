import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiOutlinePlus, HiOutlineMinus, HiOutlineTrash } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';

export default function CartSidebar() {
  const navigate = useNavigate();
  const { cart, cartOpen, toggleCart, updateCartQuantity, removeFromCart, getCartTotal } = useStore();
  const total = getCartTotal();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-secondary z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-brown-100">
              <h2 className="font-heading text-xl font-bold text-primary">
                Your Cart 🛒
              </h2>
              <button
                onClick={toggleCart}
                className="p-2 rounded-full hover:bg-brown-100 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-6xl mb-4">🧺</span>
                  <h3 className="font-heading text-lg font-semibold text-primary mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-sm text-brown-400">
                    Add some delicious cakes to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <motion.div
                      key={`${item.id}-${item.selectedSize || idx}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-3 p-3 bg-white dark:bg-white/5 rounded-xl shadow-sm border border-transparent dark:border-white/5"
                    >
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-primary truncate">
                          {item.name} 
                          <span className="text-[9px] text-accent ml-1 opacity-60">({item.selectedSize || 'Std'})</span>
                        </h4>
                        <p className="text-accent font-bold text-sm mt-1">
                          ₹{item.price}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-brown-50 rounded-full px-1">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.selectedSize, item.quantity - 1)}
                              className="p-1 rounded-full hover:bg-brown-200 transition-colors"
                            >
                              <HiOutlineMinus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-semibold w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.selectedSize, item.quantity + 1)}
                              className="p-1 rounded-full hover:bg-brown-200 transition-colors"
                            >
                              <HiOutlinePlus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.selectedSize)}
                            className="p-1.5 rounded-full text-error/60 hover:text-error hover:bg-error/10 transition-all"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-brown-100 dark:border-white/10 bg-white dark:bg-[#120C0B]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-brown-400">Subtotal</span>
                  <span className="font-bold text-primary">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-brown-400 font-medium">Delivery</span>
                  <span className="text-sm text-success font-bold">FREE</span>
                </div>
                <div className="flex items-center justify-between mb-5 pt-3 border-t border-brown-100 dark:border-white/10">
                  <span className="font-heading font-bold text-lg text-primary">Total</span>
                  <span className="font-heading font-bold text-xl text-accent">
                    ₹{total.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    toggleCart();
                    navigate('/checkout');
                  }}
                  className="w-full py-3.5 gradient-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Proceed to Checkout →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
