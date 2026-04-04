/**
 * AddCakePage.jsx
 * ─────────────────────────────────────────────────────────────
 * /add-cake — Dedicated page to add a new cake product
 *
 * ✅ Beautiful multi-section form with live image preview
 * ✅ Upload image to Supabase Storage (product-images bucket)
 * ✅ Full validation with inline error messages
 * ✅ Duplicate name check before submit
 * ✅ "Preview Cake" card before final submission
 * ✅ Success toast + redirect to Product Dashboard
 * ✅ Responsive + animated UI
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import useStore from '../../store/useStore';

// ── Config ───────────────────────────────────────────────────────
const CATEGORIES = ['Birthday','Wedding','Custom','Anniversary','Festival','Cupcakes','Pastries','Cookies','Bread','Other'];
const SHAPES     = ['Round','Square','Heart','Rectangle','Tiered','Custom'];
const FLAVORS    = ['Chocolate','Vanilla','Strawberry','Red Velvet','Butterscotch','Pineapple','Mango','Black Forest','Blueberry','Other'];
const PLACEHOLDER = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop';

const fmt = (n) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(n)||0);

// ── Input Helper Component ───────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠️ {error}</p>}
  </div>
);

// ════════════════════════════════════════════════════════════════
export default function AddCakePage() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);
  const { fetchProducts } = useStore();

  // ── Form state ─────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '', price: '', category: 'Birthday', description: '',
    stock: '100', flavor: 'Chocolate', shape: 'Round', weight: '1',
  });
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [showPreview,  setShowPreview]  = useState(false);

  // ── Helpers ────────────────────────────────────────────────────
  const updateField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
  };

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())                     e.name = 'Cake name is required';
    if (!form.price || Number(form.price) <= 0) e.price = 'Enter a valid price';
    if (!form.category)                         e.category = 'Select a category';
    if (!form.stock || Number(form.stock) < 0)  e.stock = 'Enter valid stock quantity';
    if (!form.weight || Number(form.weight) <= 0)e.weight = 'Enter valid weight';
    if (!form.description.trim())               e.description = 'Add a description';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Upload image to Supabase Storage ───────────────────────────
  const uploadImage = async () => {
    if (!imageFile) return '';
    const ext = imageFile.name.split('.').pop();
    const fileName = `cake-${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false });
    if (error) throw new Error('Image upload failed: ' + error.message);
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return publicUrl;
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
      return;
    }

    setSubmitting(true);
    try {
      // Duplicate name check
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .ilike('name', form.name.trim())
        .limit(1);
      if (existing?.length > 0) {
        setErrors(prev => ({ ...prev, name: 'A product with this name already exists' }));
        toast.error('Duplicate product name!');
        setSubmitting(false);
        return;
      }

      // Upload image with fallback for RLS policy issues
      let imageUrl = '';
      if (imageFile) {
        try {
          imageUrl = await uploadImage();
        } catch (uploadErr) {
          console.error('[AddCake] Storage RLS block, falling back to placeholder:', uploadErr);
          imageUrl = PLACEHOLDER;
          toast.error("Image stored blocked by database policy. Using a placeholder for now.");
        }
      }

      // Insert product
      const payload = {
        name:           form.name.trim(),
        price:          Number(form.price),
        category:       form.category,
        description:    form.description.trim(),
        image:          imageUrl || PLACEHOLDER,
        image_url:      imageUrl || PLACEHOLDER,
        stock:          Number(form.stock) || 100,
        stock_quantity: Number(form.stock) || 100,
        flavor:         form.flavor,
        shape:          form.shape,
        weight:         Number(form.weight) || 1,
        rating:         5.0,
      };

      const { error } = await supabase.from('products').insert(payload);
      if (error) throw error;

      toast.success('🎂 Cake added successfully!');

      // Refresh global product store (updates Menu, Navbar, etc.)
      await fetchProducts();

      // Navigate to Artisan Dashboard with state flag for highlighting
      setTimeout(() => navigate('/admin-dashboard', {
        state: { newProduct: true, productName: form.name.trim() }
      }), 500);
    } catch (err) {
      console.error('[AddCake] Error:', err);
      toast.error(err.message || 'Failed to add cake');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-lg">
        {/* Subtle background gradient overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate('/admin-dashboard')}
            className="flex items-center gap-2 text-sm text-pink-200 hover:text-white mb-5 transition-colors">
            <span>←</span> Back to Dashboard
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm shadow-inner flex items-center justify-center text-3xl flex-shrink-0 border border-white/20">🎂</div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight drop-shadow-sm">Add New Cake</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-2">
                <span className="flex items-center gap-1.5 text-pink-100 text-sm font-semibold whitespace-nowrap drop-shadow-sm">
                  <span className="text-base drop-shadow-sm">🧁</span> The Whisk Bakery
                </span>
                <span className="hidden sm:inline text-pink-300/60">•</span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-pink-200 group cursor-default" title="admin@thewhisk.com">
                  <svg className="w-4 h-4 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  <span className="truncate max-w-[200px] sm:max-w-xs group-hover:text-white transition-colors">admin@thewhisk.com</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Image Upload Section ────────────────────────── */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              📷 Cake Image
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Preview */}
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex-shrink-0 group cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <span className="text-4xl mb-2">📸</span>
                    <p className="text-xs font-medium">Click to upload</p>
                    <p className="text-[10px]">JPG, PNG, WebP (max 5MB)</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📷 Change Image</span>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-5 py-2.5 bg-pink-50 text-pink-600 rounded-xl text-sm font-semibold hover:bg-pink-100 transition-all">
                  📁 Choose Image File
                </button>
                {imageFile && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="text-green-500">✅</span>
                    {imageFile.name} ({(imageFile.size / 1024).toFixed(0)}KB)
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  If no image is uploaded, a default placeholder will be used.
                </p>
                {errors.image && <p className="text-red-500 text-xs">⚠️ {errors.image}</p>}
              </div>
            </div>
          </motion.div>

          {/* ── Basic Details ───────────────────────────────── */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              🎂 Basic Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Cake Name" error={errors.name} required>
                <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)}
                  placeholder="e.g. Chocolate Dream Cake"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                    errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-50'
                  }`} />
              </Field>

              <Field label="Price (₹)" error={errors.price} required>
                <input type="number" min="1" value={form.price} onChange={e => updateField('price', e.target.value)}
                  placeholder="e.g. 999"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                    errors.price ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-50'
                  }`} />
              </Field>

              <Field label="Category" error={errors.category} required>
                <select value={form.category} onChange={e => updateField('category', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Stock Quantity" error={errors.stock} required>
                <input type="number" min="0" value={form.stock} onChange={e => updateField('stock', e.target.value)}
                  placeholder="e.g. 100"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                    errors.stock ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-50'
                  }`} />
              </Field>
            </div>

            <div className="mt-5">
              <Field label="Description" error={errors.description} required>
                <textarea rows={3} value={form.description} onChange={e => updateField('description', e.target.value)}
                  placeholder="Describe this cake — ingredients, taste, occasion..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all resize-none ${
                    errors.description ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-50'
                  }`} />
              </Field>
            </div>
          </motion.div>

          {/* ── Cake Specifications ─────────────────────────── */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              ✨ Specifications
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label="Flavor">
                <select value={form.flavor} onChange={e => updateField('flavor', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50">
                  {FLAVORS.map(f => <option key={f}>{f}</option>)}
                </select>
              </Field>

              <Field label="Shape">
                <select value={form.shape} onChange={e => updateField('shape', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-50">
                  {SHAPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="Weight (kg)" error={errors.weight} required>
                <input type="number" step="0.1" min="0.1" value={form.weight} onChange={e => updateField('weight', e.target.value)}
                  placeholder="e.g. 1.5"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-4 transition-all ${
                    errors.weight ? 'border-red-300 focus:border-red-400 focus:ring-red-50' : 'border-gray-200 focus:border-pink-400 focus:ring-pink-50'
                  }`} />
              </Field>
            </div>
          </motion.div>

          {/* ── Action Buttons ──────────────────────────────── */}
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => { if (validate()) setShowPreview(true); }}
              className="flex-1 py-3.5 rounded-xl border-2 border-purple-200 text-purple-600 font-bold text-sm hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
              👁️ Preview Cake
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25"
              style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding Cake...</>
              ) : (
                <>🎂 Add Cake to Menu</>
              )}
            </button>
          </motion.div>
        </form>
      </div>

      {/* ── Preview Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {showPreview && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowPreview(false)}>
            <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
              {/* Card image */}
              <div className="relative h-52 overflow-hidden">
                <img src={imagePreview || PLACEHOLDER} alt={form.name}
                  className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-xl font-bold text-white">{form.name || 'Untitled Cake'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">{form.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">{form.shape}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white font-medium">{form.flavor}</span>
                  </div>
                </div>
              </div>

              {/* Card details */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-2xl font-bold text-pink-600">{fmt(form.price)}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-bold">⭐ 5.0</span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{form.description || 'No description'}</p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Weight', value: `${form.weight} kg`, icon: '⚖️' },
                    { label: 'Stock', value: `${form.stock} pcs`, icon: '📦' },
                    { label: 'Shape', value: form.shape, icon: '🔶' },
                  ].map(s => (
                    <div key={s.label} className="text-center p-2.5 rounded-xl bg-gray-50">
                      <p className="text-sm mb-0.5">{s.icon}</p>
                      <p className="text-xs font-bold text-gray-700">{s.value}</p>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowPreview(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">
                    ✏️ Edit
                  </button>
                  <button type="button" onClick={() => { setShowPreview(false); handleSubmit(); }}
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg,#ec4899,#8b5cf6)', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : '✅ Confirm & Add'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
