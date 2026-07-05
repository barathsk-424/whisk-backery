import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';

export default function EditCakePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useStore();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    stock_quantity: "",
    description: "",
    image_url: ""
  });

  useEffect(() => {
    fetchCakeDetails();
  }, [id]);

  const fetchCakeDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("products") // Using products table as per database schema
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Mapping database fields to form state
      setForm({
        name: data.name || "",
        price: data.price || "",
        category: data.category || "",
        stock_quantity: data.stock_quantity || data.stock || 0,
        description: data.description || "",
        image_url: data.image_url || data.image || ""
      });
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to fetch cake details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.name.trim()) return toast.error("Cake name is required");
    if (Number(form.price) <= 0) return toast.error("Price must be greater than 0");
    if (Number(form.stock_quantity) < 0) return toast.error("Stock cannot be negative");

    setUpdating(true);
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: form.name,
          price: Number(form.price),
          category: form.category,
          stock_quantity: Number(form.stock_quantity),
          description: form.description,
          image_url: form.image_url
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Cake updated successfully ✅");
      navigate('/admin-dashboard');
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("Failed to update cake. Check console for details.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-primary">Loading Cake Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 pb-12 px-6 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#120B0B]' : 'bg-secondary'}`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-2xl mx-auto rounded-3xl shadow-xl border transition-all ${
          theme === "dark" 
            ? "bg-[#1A1110] border-white/5 shadow-white/5" 
            : "bg-white border-brown-100"
        }`}
      >
        <div className={`p-8 border-b transition-colors ${theme === 'dark' ? 'border-white/5 bg-white/5' : 'border-brown-50 bg-brown-50/30'}`}>
          <h1 className={`font-heading text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Edit Cake Details</h1>
          <p className="text-brown-400 text-sm">Update pricing, stock, and descriptions for product #{id.slice(0,8)}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Cake Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                    : 'bg-white border-brown-100 focus:border-accent text-primary'
                }`}
                placeholder="Delicious Chocolate Cake"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Category</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                    : 'bg-white border-brown-100 focus:border-accent text-primary'
                }`}
                placeholder="Classic/Premium"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Price (₹)</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                    : 'bg-white border-brown-100 focus:border-accent text-primary'
                }`}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Stock Quantity</label>
              <input
                type="number"
                name="stock_quantity"
                value={form.stock_quantity}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                    : 'bg-white border-brown-100 focus:border-accent text-primary'
                }`}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Image URL</label>
            <input
              type="text"
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                  : 'bg-white border-brown-100 focus:border-accent text-primary'
              }`}
              placeholder="https://images.unsplash.com/..."
            />
            {form.image_url && (
                <img 
                    src={form.image_url} 
                    alt="Preview" 
                    className="mt-2 w-24 h-24 object-cover rounded-xl border border-brown-100" 
                />
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brown-400">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="4"
              className={`w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm font-bold ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                  : 'bg-white border-brown-100 focus:border-accent text-primary'
              }`}
              placeholder="Tell us about this masterpiece..."
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
              {updating ? "Updating..." : "Update Cake"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
