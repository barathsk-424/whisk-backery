import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineViewGrid, HiOutlineViewList } from 'react-icons/hi';
import useStore from '../../store/useStore';
import ProductCard from '../../components/products/ProductCard';

const categories = [
  { id: 'all', label: 'All', emoji: '🍰' },
  { id: 'Cakes', label: 'Signature Cakes', emoji: '🎂' },
  { id: 'Birthday', label: 'Birthday Special', emoji: '🎈' },
  { id: 'Custom', label: 'Bespoke Creations', emoji: '🎨' },
];

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

export default function MenuPage() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, getFilteredProducts, budgetRange, setBudgetRange, loading, theme } = useStore();
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  // STABILITY FIX: Calculate data before potentially returning to ensure hooks run first
  let filtered = getFilteredProducts();

  // Sort logic moved above return
  if (sortBy === 'price_low') filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sortBy === 'price_high') filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div className={`min-h-screen pt-20 pb-12 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="ml-4 text-brown-400 font-medium font-inter">Feeding our ovens... Loading menu</p>
        </div>
      ) : (
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className={`font-heading text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Our Menu</h1>
          <p className={`${theme === 'dark' ? 'text-white/60' : 'text-primary/60'} mt-1 font-bold`}>Freshly baked happiness, delivered to your doorstep</p>
        </motion.div>

        {/* ── FEATURED SELECTION (USER REQUESTED PATTERN) ─────── */}
        {filtered && filtered.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-8 p-5 lg:p-8 ${theme === 'dark' ? 'bg-[#1A1110]' : 'bg-accent/5'} border ${theme === 'dark' ? 'border-white/5' : 'border-accent/20'} rounded-[2rem] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="flex-1 text-center md:text-left z-10">
              <span className="px-3 py-1 bg-accent text-white text-[9px] font-black rounded-full uppercase tracking-widest mb-3 inline-block shadow-lg shadow-accent/20">Featured</span>
              <h2 className={`font-heading text-xl lg:text-3xl font-black mb-2 line-clamp-1 truncate uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{filtered[0].name}</h2>
              <p className={`text-[11px] lg:text-sm mb-5 line-clamp-2 font-bold leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-primary/60'}`}>{filtered[0].description}</p>
              <button 
                onClick={() => navigate(`/product/${filtered[0].id}`)}
                className={`w-full sm:w-auto px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl active:scale-95 ${
                  theme === 'dark' ? 'bg-accent text-white hover:bg-accent-dark' : 'bg-primary text-secondary hover:bg-accent'
                }`}
              >
                Inspect Artifact →
              </button>
            </div>
            <div className={`w-full md:w-64 h-40 lg:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 shrink-0 group ${theme === 'dark' ? 'border-[#0D0807]' : 'border-white'}`}>
              <img src={filtered[0].image_url} alt="Featured" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
          </motion.div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter blueprints..."
              className={`w-full pl-12 pr-4 py-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-brown-100 text-primary'} rounded-2xl shadow-sm border text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-accent transition-all`}
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`flex-1 sm:flex-none px-4 py-4 ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-brown-100 text-primary'} rounded-2xl shadow-sm border text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-accent cursor-pointer`}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl shadow-sm border text-[10px] font-black uppercase tracking-widest transition-all ${
                showFilters 
                  ? 'bg-accent text-white border-accent' 
                  : `${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-brown-100 text-primary'}`
              }`}
            >
              <HiOutlineFilter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Budget Filter */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl p-6 shadow-sm border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-brown-100'} mb-8`}
          >
            <h3 className={`font-heading font-semibold ${theme === 'dark' ? 'text-white' : 'text-primary'} mb-4`}>Budget Slider</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-brown-400">₹{budgetRange?.[0] || 0}</span>
              <input
                type="text"
                readOnly
                value={`₹${budgetRange?.[1] || 5000}`}
                className="hidden"
              />
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={budgetRange?.[1] || 5000}
                onChange={(e) => setBudgetRange([budgetRange?.[0] || 0, parseInt(e.target.value)])}
                className="flex-1 h-2 accent-accent"
              />
              <span className="text-sm font-medium text-accent">₹{budgetRange?.[1] || 5000}</span>
            </div>
          </motion.div>
        )}

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-6 no-scrollbar snap-x snap-mandatory px-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 snap-start flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'gradient-accent text-white shadow-lg shadow-accent/20'
                  : `${theme === 'dark' ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-brown-100 text-primary'} border hover:border-accent/30`
              }`}
            >
              <span className="text-sm">{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-brown-400 mb-6 font-bold uppercase tracking-widest">
          Showing <span className={`font-black ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{filtered.length}</span> items
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className={`font-heading text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>No items found</h3>
            <p className="text-brown-400 text-sm font-bold uppercase tracking-widest">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-6">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
