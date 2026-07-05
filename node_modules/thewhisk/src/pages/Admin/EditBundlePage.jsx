import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';

export default function EditBundlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useStore();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    occasion: "",
    original_price: "",
    discount: "",
    final_price: "",
    image_url: "",
    emoji: "",
    items: ""
  });

  useEffect(() => {
    fetchBundleDetails();
  }, [id]);

  const fetchBundleDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("bundles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setForm({
        name: data.name || "",
        occasion: data.occasion || "",
        original_price: data.original_price || "",
        discount: data.discount || 0,
        final_price: data.final_price || "",
        image_url: data.image_url || "",
        emoji: data.emoji || "",
        items: data.items ? data.items.join(", ") : ""
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to fetch bundle details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-calculate final price if original_price or discount changes
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) return toast.error("Bundle name is required");
    if (Number(form.original_price) <= 0) return toast.error("Price must be greater than 0");

    setUpdating(true);
    try {
      const itemsArray = form.items.split(",").map(item => item.trim()).filter(item => item !== "");

      const { error } = await supabase
        .from("bundles")
        .update({
          name: form.name,
          occasion: form.occasion,
          original_price: Number(form.original_price),
          discount: Number(form.discount),
          final_price: Number(form.final_price),
          image_url: form.image_url,
          emoji: form.emoji,
          items: itemsArray
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Bundle updated successfully ✅");
      navigate('/admin-dashboard');
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Failed to update bundle. Check console.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-primary">Synchronizing Bundle Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 pb-12 px-6 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-2xl mx-auto rounded-3xl shadow-xl border overflow-hidden transition-all ${
          theme === 'dark' ? 'bg-[#1A1110] border-white/5 shadow-white/5' : 'bg-white border-brown-100'
        }`}
      >
        <div className={`p-8 border-b transition-colors ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-brown-50 bg-brown-50/30'}`}>
          <h1 className={`font-heading text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Edit Bundle Profile</h1>
          <p className="text-brown-400 text-sm">Fine-tune pricing strategies and bundle contents for #{id.slice(0,8)}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Bundle Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'border-brown-100 focus:border-accent text-primary'
                }`}
                placeholder="Birthday Blast"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Occasion</label>
              <input
                type="text"
                name="occasion"
                value={form.occasion}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'border-brown-100 focus:border-accent text-primary'
                }`}
                placeholder="birthday/anniversary"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Original (₹)</label>
              <input
                type="number"
                name="original_price"
                value={form.original_price}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'border-brown-100 focus:border-accent text-primary'
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={form.discount}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'border-brown-100 focus:border-accent text-primary'
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Final (₹)</label>
              <input
                type="number"
                name="final_price"
                value={form.final_price}
                readOnly
                className={`w-full px-4 py-3 rounded-xl border outline-none text-sm font-black transition-all ${
                  theme === 'dark' ? 'bg-white/10 border-white/20 text-accent' : 'bg-gray-50 border-brown-100 text-accent'
                }`}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Emoji Icon</label>
              <input
                type="text"
                name="emoji"
                value={form.emoji}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold text-center ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'border-brown-100 focus:border-accent'
                }`}
                placeholder="🎉"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Image URL</label>
              <input
                type="text"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'border-brown-100 focus:border-accent text-primary'
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Bundle Items (Comma Separated)</label>
            <textarea
              name="items"
              value={form.items}
              onChange={handleChange}
              rows="3"
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:border-accent' : 'border-brown-100 focus:border-accent text-primary'
              }`}
              placeholder="1 kg Rainbow Cake, Candle Set, Party Hat..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
                type="button"
                onClick={() => navigate('/admin-dashboard')}
                className={`flex-1 px-6 py-4 font-black rounded-2xl transition-all uppercase tracking-widest text-xs ${
                  theme === 'dark' ? 'bg-white/5 text-brown-300 hover:bg-white/10' : 'bg-brown-50 text-brown-400 hover:bg-brown-100'
                }`}
            >
                Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex-[2] px-6 py-4 gradient-accent text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {updating ? "Calibrating..." : "Synchronize Bundle"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
