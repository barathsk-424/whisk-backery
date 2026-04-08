import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { mockOrders } from '../../data/mockData';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, orders, savedDesigns, deleteDesign, addToCart, logout, deleteOrder, clearOrders, theme, addFeedback } = useStore();
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [deletedMockIds, setDeletedMockIds] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({ subject: '', message: '', rating: 5 });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // Merge with mock orders but filter out locally deleted ones
  const allOrders = [...orders, ...mockOrders.filter(mo => !deletedMockIds.includes(mo.id))];

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.subject.trim() || !feedbackForm.message.trim()) {
      return toast.error("Please provide both subject and message for our artisans.");
    }
    
    setSubmittingFeedback(true);
    const tid = toast.loading("Transmitting your feedback...");
    try {
      await addFeedback({
        subject: feedbackForm.subject.trim(),
        message: feedbackForm.message.trim(),
        rating: feedbackForm.rating
      });

      toast.success("Feedback received! Thank you for helping us improve.", { id: tid });
      setFeedbackForm({ subject: '', message: '', rating: 5 });
    } catch (err) {
      toast.error("Feedback transmission failed: " + err.message, { id: tid });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header */}
          <div className={`${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'} rounded-2xl p-6 shadow-sm border mb-8`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-white text-2xl font-bold">
                {user?.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <h1 className="font-heading text-2xl font-bold text-primary">{user?.full_name}</h1>
                <p className="text-sm text-brown-400">{user?.email}</p>
                {user?.phone && <p className="text-sm text-brown-400">{user?.phone}</p>}
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-error border border-error/30 rounded-xl hover:bg-error/10 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Orders', value: allOrders.length, icon: '📦' },
              { label: 'Sprinkle Points', value: user?.loyalty_points || 0, icon: '✨' },
              { label: 'Saved Designs', value: savedDesigns.length, icon: '🎨' },
              { label: 'Reviews', value: 2, icon: '⭐' },
            ].map((stat) => (
              <div key={stat.label} className={`${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'} rounded-xl p-4 shadow-sm border text-center`}>
                <span className="text-2xl block mb-1">{stat.icon}</span>
                <p className="font-heading text-xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-brown-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Loyalty Points */}
          <div className="bg-gradient-to-r from-accent to-warning rounded-2xl p-6 text-white mb-8 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg">✨ Sprinkle Points</h3>
                <p className="text-sm opacity-80 mt-1">Earn 1 point per ₹1 spent</p>
              </div>
              <div className="text-right">
                <p className="font-heading text-3xl font-bold">{user?.loyalty_points || 0}</p>
                <p className="text-xs opacity-80">= ₹{Math.floor((user?.loyalty_points || 0) / 10)} discount</p>
              </div>
            </div>
            <div className="mt-4 bg-white/20 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all"
                style={{ width: `${Math.min(((user?.loyalty_points || 0) / 1000) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs opacity-70 mt-2">
              {1000 - (user?.loyalty_points || 0)} more points to Gold status
            </p>
          </div>

          {/* 🎨 Saved Designs Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-primary flex items-center gap-2">
                🎨 Saved Designs
              </h3>
              <p className="text-xs text-brown-400 capitalize bg-white px-2 py-0.5 rounded-full border border-brown-100">
                {savedDesigns.length} designs
              </p>
            </div>

            {savedDesigns.length === 0 ? (
              <div className={`${theme === 'dark' ? 'bg-[#1A1110] border-white/10' : 'bg-white border-brown-200'} rounded-2xl p-8 text-center border border-dashed`}>
                <span className="text-4xl block mb-2">🎨</span>
                <p className="text-sm font-medium text-primary">No saved designs yet</p>
                <p className="text-xs text-brown-400 mt-1 mb-4">Create your first custom 3D cake!</p>
                <button 
                  onClick={() => navigate('/cake-builder')}
                  className="px-6 py-2 gradient-accent text-white text-xs font-bold rounded-xl shadow-md hover:scale-105 transition-transform"
                >
                  Start Building →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {savedDesigns.map((design) => (
                  <motion.div
                    key={design.id}
                    layoutId={design.id}
                    whileHover={{ y: -4 }}
                    className={`${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'} rounded-2xl overflow-hidden shadow-sm border flex flex-col group`}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-brown-50">
                      <img 
                        src={design.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'} 
                        alt={design.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setSelectedDesign(design)}
                          className="p-2 bg-white rounded-full text-primary hover:scale-110 transition-transform shadow-lg"
                        >
                          👁️
                        </button>
                        <button 
                          onClick={() => navigate('/cake-builder', { state: { config: design.config } })}
                          className="p-2 bg-white rounded-full text-blue-500 hover:scale-110 transition-transform shadow-lg"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => deleteDesign(design.id)}
                          className="p-2 bg-white rounded-full text-error hover:scale-110 transition-transform shadow-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-primary text-sm truncate">{design.name}</h4>
                        <span className="font-black text-accent text-xs">₹{Number(design.price).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-brown-400 font-black uppercase tracking-widest mt-1">
                        Saved on {new Date(design.created_at).toLocaleDateString()}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button 
                          onClick={() => navigate('/cake-builder', { state: { config: design.config } })}
                          className="text-[10px] font-bold py-2 bg-brown-50 text-brown-600 rounded-lg hover:bg-brown-100"
                        >
                          EDIT DESIGN
                        </button>
                        <button 
                          onClick={() => {
                            addToCart({ ...design, id: `custom-${Date.now()}`, is_custom: true }, 1);
                            navigate('/cart');
                          }}
                          className="text-[10px] font-bold py-2 gradient-accent text-white rounded-lg hover:opacity-90"
                        >
                          REORDER NOW
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Design Preview Modal */}
          <AnimatePresence>
            {selectedDesign && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setSelectedDesign(null)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="aspect-[4/3] bg-brown-50 relative">
                    <img 
                      src={selectedDesign.image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'} 
                      alt={selectedDesign.name}
                      className="w-full h-full object-cover"
                    />
                    <button 
                      onClick={() => setSelectedDesign(null)}
                      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-xl font-bold text-primary mb-2">{selectedDesign.name}</h3>
                    <p className="text-2xl font-black text-accent mb-4">₹{Number(selectedDesign.price).toLocaleString()}</p>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-brown-50 p-4 rounded-2xl mb-6">
                      {[
                        { label: 'Shape', value: selectedDesign.config.shape, icon: '💠' },
                        { label: 'Flavor', value: selectedDesign.config.flavor, icon: '🍓' },
                        { label: 'Layers', value: selectedDesign.config.layers, icon: '🥞' },
                        { label: 'Size', value: `${selectedDesign.config.size} kg`, icon: '⚖️' },
                        { label: 'Custom Text', value: selectedDesign.config.text || 'NONE', icon: '✍️' },
                      ].map(spec => (
                        <div key={spec.label}>
                          <p className="text-[10px] text-brown-400 font-bold uppercase tracking-widest">{spec.label}</p>
                          <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <span className="text-sm">{spec.icon}</span> {spec.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => navigate('/cake-builder', { state: { config: selectedDesign.config } })}
                        className="flex-1 py-3 bg-brown-100 text-primary font-bold rounded-xl hover:bg-brown-200 transition-colors"
                      >
                        ✏️ Edit in Builder
                      </button>
                      <button 
                        onClick={() => {
                          addToCart({ ...selectedDesign, id: `custom-${Date.now()}`, is_custom: true }, 1);
                          navigate('/cart');
                        }}
                        className="flex-1 py-3 gradient-accent text-white font-bold rounded-xl hover:opacity-90 shadow-md"
                      >
                        🛒 Order Now
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Order History */}
          <div className={`${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'} rounded-2xl shadow-sm border overflow-hidden`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-white/5' : 'border-brown-100'} flex items-center justify-between`}>
              <h3 className={`font-heading font-bold ${theme === 'dark' ? 'text-secondary' : 'text-primary'}`}>📦 Order History</h3>
              {allOrders.length > 0 && (
                <button 
                  onClick={() => {
                    clearOrders();
                    setDeletedMockIds(mockOrders.map(mo => mo.id));
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-3 py-1.5 rounded-full"
                >
                  Clear history
                </button>
              )}
            </div>

            {allOrders.length === 0 ? (
              <div className="p-10 text-center">
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-brown-400 text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-brown-100">
                {allOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-brown-50/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-primary">{order.id}</p>
                        <p className="text-xs text-brown-400">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-accent">₹{order.total || order.total_price || 0}</p>
                          {order.id && (
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                deleteOrder(order.id);
                                if (order.id.toString().startsWith('ord-')) {
                                  setDeletedMockIds(prev => [...prev, order.id]);
                                }
                              }}
                              className="w-7 h-7 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-black uppercase px-2 py-1 rounded-full ${
                          order.status?.toLowerCase() === 'delivered'
                            ? 'bg-success/10 text-success'
                            : order.status?.toLowerCase() === 'cancelled'
                            ? 'bg-error/10 text-error'
                            : order.status?.toLowerCase() === 'order confirmed'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-xs text-brown-400 bg-brown-50 px-2 py-1 rounded-full shrink-0">
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📬 Service Feedback Section */}
          <div className={`${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'} rounded-2xl p-6 shadow-sm border mt-8`}>
            <h3 className={`font-heading font-bold ${theme === 'dark' ? 'text-secondary' : 'text-primary'} mb-2 flex items-center gap-2`}>
               📬 Operations Feedback
            </h3>
            <p className="text-xs text-brown-400 mb-6 uppercase tracking-widest font-black">Help us refine our artisan protocols</p>
            
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text"
                  placeholder="Subject (e.g., Delivery Service, Website Experience)"
                  value={feedbackForm.subject}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                  className={`w-full p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'bg-secondary border-transparent focus:border-accent'
                  }`}
                />
                <div className="flex items-center gap-4 px-3 bg-secondary rounded-xl">
                   <span className="text-[10px] font-black uppercase text-brown-400">Rating:</span>
                   <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button 
                          key={star}
                          type="button"
                          onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                          className={`text-lg transition-transform hover:scale-125 ${feedbackForm.rating >= star ? 'text-accent' : 'text-brown-200'}`}
                        >
                          ★
                        </button>
                      ))}
                   </div>
                </div>
              </div>
              <textarea 
                placeholder="Transcribe your experience details here..."
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                rows={3}
                className={`w-full p-3 rounded-xl border-2 text-sm font-bold transition-all resize-none ${
                    theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'bg-secondary border-transparent focus:border-accent'
                }`}
              />
              <button 
                type="submit"
                disabled={submittingFeedback}
                className="w-full py-3 gradient-accent text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-accent/20 disabled:opacity-50"
              >
                {submittingFeedback ? 'Transmitting...' : 'Submit Feedback Signal'}
              </button>
            </form>
          </div>

          {/* Saved Addresses */}
          <div className={`${theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'} rounded-2xl p-6 shadow-sm border mt-8`}>
            <h3 className={`font-heading font-bold ${theme === 'dark' ? 'text-secondary' : 'text-primary'} mb-4`}>📍 Saved Addresses</h3>
            {user?.address ? (
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                <span className="text-xl">🏠</span>
                <div>
                  <p className="text-sm font-medium text-primary">{user.address.line1}</p>
                  <p className="text-xs text-brown-400">{user.address.city} - {user.address.pincode}</p>
                </div>
                <span className="ml-auto text-xs text-accent font-semibold">Default</span>
              </div>
            ) : (
              <p className="text-sm text-brown-400">No addresses saved yet</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
