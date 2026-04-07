import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cakeSizes } from '../../data/mockData';
import useStore from '../../store/useStore';
import useCakeStore from '../../store/useCakeStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import CakeCanvas from './components/CakeCanvas';
import ControlsPanel from './components/ControlsPanel';

export default function BuilderPage() {
  const navigate = useNavigate();
  const { addToCart, createCustomProduct, isAuthenticated, saveCakeDesign, savedDesigns, fetchSavedDesigns, theme } = useStore();
  const { cake, resetCake } = useCakeStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchSavedDesigns();
  }, [isAuthenticated]);

  const totalPrice = useMemo(() => {
    const basePrice = 499; 
    const sizeMultiplier = cakeSizes.find((s) => s.weight === cake.size)?.multiplier || 1;
    const layerMultiplier = cake.layers === 1 ? 1 : cake.layers === 2 ? 1.4 : 1.8;
    const toppingsCost = cake.toppings.reduce((sum, t) => sum + (t.price || 0), 0);
    const textBonus = cake.customText ? (cake.customText.length * 10) : 0;
    const candleBonus = cake.showCandle ? 150 : 0;
    return Math.round(basePrice * sizeMultiplier * layerMultiplier + toppingsCost + textBonus + candleBonus);
  }, [cake]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save your cake!');
      navigate('/login');
      return;
    }
    
    const toastId = toast.loading('Adding your cake to cart...');
    try {
      const response = await createCustomProduct({
        name: `${cake.flavor} Custom ${cake.shape.toUpperCase()} Cake`,
        price: totalPrice,
        image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
      });

      if (response && response.error) throw new Error(response.error.message || 'Server error');

      await addToCart(response, 1);
      navigate('/cart');
      toast.success('Cake added to cart!', { id: toastId });
    } catch (err) {
      console.error("Builder Error:", err);
      toast.error(`Error: ${err.message}`, { id: toastId });
    }
  };

  const handleSaveDesign = async () => {
    if (!isAuthenticated) {
      toast.error('Sign in to save your artisan designs!');
      navigate('/login');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Archiving design to your vault...');
    try {
      await saveCakeDesign({
        name: `${cake.flavor} ${cake.shape} Masterpiece`,
        config: cake,
        price: totalPrice,
        image_url: cake.referenceImage || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'
      });
      toast.success('Design securely archived!', { id: toastId });
    } catch (err) {
      toast.error('Vault access failed: ' + err.message, { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { n: 1, label: 'Base Shape', icon: '🍰' },
    { n: 2, label: 'Size & Mass', icon: '⚖️' },
    { n: 3, label: 'Layering', icon: '🏗️' },
    { n: 4, label: 'Flavor Palette', icon: '🍓' },
    { n: 5, label: 'Filling', icon: '🍯' },
    { n: 6, label: 'Exterior Icing', icon: '🎨' },
    { n: 7, label: 'Modules & Art', icon: '✨' },
  ];

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 bg-secondary`}>
      <div className="max-w-[1440px] mx-auto">
        
        {/* Step Header */}
        <div className="mb-12">
           <div className={`flex justify-between items-center mb-8 bg-primary/5 border border-primary/10 p-6 rounded-2xl overflow-x-auto no-scrollbar gap-8`}>
              {steps.map((s) => (
                <button
                  key={s.n}
                  onClick={() => setCurrentStep(s.n)}
                  className={`flex items-center gap-3 shrink-0 py-2 px-4 rounded-xl transition-all ${
                    currentStep === s.n ? 'bg-accent text-white shadow-lg' : 'text-primary/60 hover:bg-primary/5'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-xs font-black uppercase tracking-widest">{s.label}</p>
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
           
           {/* Left: 3D Visualization */}
           <div className={`rounded-[2rem] sm:rounded-[2.5rem] p-4 shadow-xl border aspect-square relative overflow-hidden h-[350px] sm:h-[450px] lg:h-[600px] bg-primary/5 border-primary/10`}>
              <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
                 <p className="text-[8px] sm:text-[10px] font-black text-accent uppercase tracking-widest mb-1">Live 3D Rendering</p>
                 <h2 className="text-lg sm:text-2xl font-heading font-black capitalize text-primary">{cake.shape} {cake.flavor} Cake</h2>
              </div>
              <CakeCanvas />
           </div>

           {/* Right: Technical Configuration */}
           <div className={`rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-10 shadow-xl border min-h-[400px] lg:min-h-[600px] flex flex-col bg-primary/[0.02] border-primary/10`}>
              <div className="flex-1">
                 <ControlsPanel 
                    currentStep={currentStep - 1} 
                    totalPrice={totalPrice}
                    onAddToCart={handleAddToCart}
                 />
              </div>

              {/* Interaction Footer */}
              <div className="pt-6 sm:pt-10 mt-6 sm:mt-10 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div className="flex items-center justify-between w-full sm:w-auto gap-6 px-1">
                    <div>
                        <p className="text-[8px] sm:text-[10px] font-black text-primary/40 uppercase tracking-widest mb-1">Estimated Quote</p>
                        <p className="text-2xl sm:text-3xl font-black text-accent">₹{totalPrice.toLocaleString()}</p>
                    </div>
                    <button 
                       onClick={handleSaveDesign}
                       disabled={isSaving}
                       className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black text-primary/60 uppercase tracking-widest hover:text-primary transition-colors disabled:opacity-50"
                    >
                       <svg className={`w-3 h-3 sm:w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                       </svg>
                       Archive Design
                    </button>
                 </div>
                 <div className="flex gap-2 sm:gap-4 w-full sm:w-auto justify-end px-1">
                    <button 
                      onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                      disabled={currentStep === 1}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-primary/5 text-primary/40 font-black rounded-xl hover:bg-primary/10 disabled:opacity-30 transition-all uppercase text-[8px] sm:text-[10px] tracking-widest border border-primary/10"
                    >
                       Previous
                    </button>
                    {currentStep < steps.length ? (
                      <button 
                         onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                         className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 bg-primary text-secondary font-black rounded-xl hover:bg-primary/90 shadow-lg transition-all uppercase text-[8px] sm:text-[10px] tracking-widest"
                      >
                         Next Step
                      </button>
                    ) : (
                      <button 
                         onClick={handleAddToCart}
                         className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 bg-accent text-white font-black rounded-xl hover:opacity-90 shadow-lg shadow-accent/20 transition-all uppercase text-[8px] sm:text-[10px] tracking-widest"
                      >
                         Add to Cart
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Artisan Design Vault */}
        {isAuthenticated && savedDesigns?.length > 0 && (
           <motion.div 
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             className="mt-24 pt-12 border-t border-primary/10"
           >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6">
                 <div>
                    <h3 className="text-2xl sm:text-3xl font-heading font-black text-primary">Artisan Design Vault</h3>
                    <p className="text-sm text-primary/40 font-bold italic tracking-tight">Your curated masterpieces, archived for eternity.</p>
                 </div>
                 <div className="px-4 py-1.5 bg-accent/10 rounded-full">
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest">{savedDesigns.length} Archives</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {savedDesigns.map((design) => (
                    <motion.div 
                       key={design.id}
                       whileHover={{ y: -10 }}
                       className={`bg-primary/[0.02] border-primary/5 rounded-[2rem] overflow-hidden shadow-luxury border group transition-all`}
                    >
                       <div className="aspect-[4/3] bg-primary/5 relative overflow-hidden">
                          <img 
                             src={design.image_url} 
                             alt={design.name} 
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                             <button 
                                className="p-3 bg-secondary rounded-full text-primary hover:bg-accent hover:text-secondary transition-all shadow-xl"
                             >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                             </button>
                          </div>
                       </div>
                       <div className="p-6">
                          <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-1 truncate">{design.name}</h4>
                          <div className="flex items-center justify-between">
                             <p className="text-sm font-black text-accent">₹{design.price.toLocaleString()}</p>
                             <p className="text-[10px] text-primary/30 font-bold italic">{new Date(design.created_at).toLocaleDateString()}</p>
                          </div>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </motion.div>
        )}
      </div>
    </div>
  );
}
