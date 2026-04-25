import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../store/useStore';
import { HiOutlineSparkles, HiOutlineTag, HiOutlinePlusCircle, HiOutlinePhotograph, HiOutlineCube } from 'react-icons/hi';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop';
const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Corporate', 'Festival', 'Other'];

export default function AddBundlePage() {
  const navigate = useNavigate();
  const { theme } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    name: "",
    occasion: "Birthday",
    original_price: "",
    discount: "10",
    final_price: "0",
    image_url: "",
    emoji: "🎁",
    items: ""
  });

  const [errors, setErrors] = useState({});

  const isValid = () => {
    return form.name.trim() && 
           form.original_price && 
           Number(form.original_price) > 0 && 
           form.items.trim();
  };

  const validateForSubmit = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.original_price || Number(form.original_price) <= 0) newErrors.original_price = "Valid price required";
    if (!form.items.trim()) newErrors.items = "Add at least one item";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "original_price" || name === "discount") {
      const op = name === "original_price" ? Number(value) : Number(form.original_price);
      const d = name === "discount" ? Number(value) : Number(form.discount);
      const fp = Math.round(op * (1 - d / 100));
      
      setForm(prev => ({
        ...prev,
        [name]: value,
        final_price: fp
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForSubmit()) return;

    setSubmitting(true);
    try {
      const itemsArray = form.items.split(",").map(item => item.trim()).filter(item => item !== "");

      const { error } = await supabase
        .from("bundles")
        .insert({
          name: form.name,
          occasion: form.occasion,
          original_price: Number(form.original_price),
          discount: Number(form.discount),
          final_price: Number(form.final_price),
          image_url: form.image_url || PLACEHOLDER,
          emoji: form.emoji || "🎁",
          items: itemsArray
        });

      if (error) throw error;

      toast.success("Artisan Bundle Deployed! 🎁", {
        style: { borderRadius: '15px', background: '#2D1F1F', color: '#FFD7BA' }
      });
      navigate('/admin-dashboard');
    } catch (error) {
      console.error("Insert Error:", error);
      toast.error("Deployment failure. Verify matrix parameters.");
    } finally {
      setSubmitting(false);
    }
  };

  const itemsList = form.items.split(",").map(i => i.trim()).filter(i => i);

  return (
    <div className={`min-h-screen pt-24 pb-20 px-4 sm:px-6 transition-all duration-700 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <HiOutlineSparkles className="text-sm" />
            Bundle Engineering Terminal
          </motion.div>
          <h1 className={`text-4xl lg:text-5xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
            Create <span className="text-accent">Artisan</span> Bundle
          </h1>
          <p className="text-brown-400 mt-2 font-medium max-w-xl">
            Design a curated experience by combining your finest cakes and treats into a single premium collection.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          {/* Form Side */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`lg:col-span-7 rounded-[2.5rem] shadow-2xl border overflow-hidden ${
              theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'
            }`}
          >
            <div className="p-8 sm:p-10 space-y-8">
              
              {/* Identity Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent"><HiOutlineTag /></div>
                  <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Bundle Identity</h3>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Bundle Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Midnight Celebration"
                      className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-bold ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/5 text-white focus:border-accent' 
                          : 'bg-secondary/30 border-brown-50 text-primary focus:border-accent shadow-inner'
                      } ${errors.name ? 'border-red-500/50' : ''}`}
                    />
                    {errors.name && <p className="text-[9px] text-red-500 font-black uppercase ml-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Occasion</label>
                    <select
                      name="occasion"
                      value={form.occasion}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-bold appearance-none cursor-pointer ${
                        theme === 'dark' 
                          ? 'bg-white/5 border-white/5 text-white focus:border-accent' 
                          : 'bg-secondary/30 border-brown-50 text-primary focus:border-accent shadow-inner'
                      }`}
                    >
                      {OCCASIONS.map(occ => <option key={occ} value={occ} className="bg-primary text-white">{occ}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Financial Section */}
              <div className="space-y-6 pt-6 border-t border-brown-50/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-success/10 rounded-lg text-success">₹</div>
                  <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Pricing Architecture</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Original (₹)</label>
                    <input
                      type="number"
                      name="original_price"
                      value={form.original_price}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-bold ${
                        theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-secondary/30 border-brown-50 shadow-inner'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Discount (%)</label>
                    <input
                      type="number"
                      name="discount"
                      value={form.discount}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-bold ${
                        theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-secondary/30 border-brown-50 shadow-inner'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Final (₹)</label>
                    <div className={`w-full px-5 py-4 rounded-2xl border-2 text-sm font-black text-accent bg-accent/5 border-accent/20 flex items-center justify-center`}>
                      {form.final_price || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assets Section */}
              <div className="space-y-6 pt-6 border-t border-brown-50/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-warning/10 rounded-lg text-warning"><HiOutlinePhotograph /></div>
                  <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Visual Assets</h3>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Icon Emoji</label>
                    <input
                      type="text"
                      name="emoji"
                      value={form.emoji}
                      onChange={handleChange}
                      className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-2xl text-center ${
                        theme === 'dark' ? 'bg-white/5 border-white/5 focus:border-accent' : 'bg-secondary/30 border-brown-50 shadow-inner'
                      }`}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Image URL</label>
                    <input
                      type="text"
                      name="image_url"
                      value={form.image_url}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/..."
                      className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-bold ${
                        theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-secondary/30 border-brown-50 shadow-inner'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-6 pt-6 border-t border-brown-50/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><HiOutlineCube /></div>
                  <h3 className={`text-sm font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Included Artifacts</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-400 ml-1">Item List (Comma Separated)</label>
                  <textarea
                    name="items"
                    value={form.items}
                    onChange={handleChange}
                    rows="4"
                    placeholder="e.g. 1kg Red Velvet, Party Box, Anniversary Topper"
                    className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all text-sm font-bold resize-none ${
                      theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-secondary/30 border-brown-50 shadow-inner'
                    } ${errors.items ? 'border-red-500/50' : ''}`}
                  />
                  {errors.items && <p className="text-[9px] text-red-500 font-black uppercase ml-1">{errors.items}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-10">
                <button
                  type="button"
                  onClick={() => navigate('/admin-dashboard')}
                  className={`flex-1 py-4 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    theme === 'dark' ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-brown-50 text-brown-400 hover:bg-brown-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-[2] py-4 px-8 gradient-accent text-white font-black rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-accent/20 text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  {submitting ? "Establishing Protocol..." : "Finalize & Deploy Bundle"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Preview Side (Advanced Refinement) */}
          <div className="lg:col-span-5 sticky top-32">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] text-center ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`}>
                Live Artifact Preview
              </h3>
              
              <div className={`rounded-[2.5rem] overflow-hidden shadow-2xl border-4 ${theme === 'dark' ? 'bg-[#1A1110] border-white/5 shadow-white/5' : 'bg-white border-white shadow-luxury'}`}>
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={form.image_url || PLACEHOLDER} 
                    alt="Preview" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-6 right-6 px-4 py-2 bg-success text-white text-xs font-black rounded-full shadow-lg">
                    {form.discount}% OFF
                  </div>
                  
                  <div className="absolute bottom-6 left-8 right-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{form.emoji || '🎁'}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-light bg-accent/20 px-3 py-1 rounded-full backdrop-blur-md">
                        {form.occasion}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter line-clamp-1">
                      {form.name || "Bundle Name"}
                    </h2>
                  </div>
                </div>

                <div className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brown-400 mb-4">Contents:</p>
                  <div className="space-y-3 mb-8">
                    {itemsList.length > 0 ? itemsList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-white/60' : 'text-brown-500'}`}>{item}</span>
                      </div>
                    )) : (
                      <p className="text-xs italic text-brown-300">No artifacts selected...</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-brown-50/10">
                    <div>
                      <p className={`text-[9px] font-black uppercase text-brown-400 line-through mb-1 opacity-50`}>₹{form.original_price || 0}</p>
                      <p className="text-3xl font-black text-accent tracking-tighter">₹{form.final_price || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-success uppercase tracking-widest">Saving ₹{Number(form.original_price) - Number(form.final_price) || 0}</p>
                      <p className="text-[8px] font-bold text-brown-300 uppercase tracking-tighter mt-1 italic">Limited Artisan Release</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`p-6 rounded-3xl border flex items-center justify-between ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-brown-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${isValid() ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                    {isValid() ? 'System Optimal' : 'Matrix Incomplete'}
                  </span>
                </div>
                <HiOutlineSparkles className={isValid() ? 'text-accent' : 'text-brown-200'} />
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
