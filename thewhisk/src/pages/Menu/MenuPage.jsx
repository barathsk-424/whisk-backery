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
  const { searchQuery, setSearchQuery, activeCategory, setActiveCategory, getFilteredProducts, budgetRange, setBudgetRange, loading } = useStore();
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  // STABILITY FIX: Calculate data before potentially returning to ensure hooks run first
  let filtered = getFilteredProducts();

  // Sort logic moved above return
  if (sortBy === 'price_low') filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
  if (sortBy === 'price_high') filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
  if (sortBy === 'rating') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  return (
    <div className="min-h-screen pt-20 pb-12">
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
          <h1 className="font-heading text-3xl font-bold text-primary">Our Menu</h1>
          <p className="text-brown-400 mt-1">Freshly baked happiness, delivered to your doorstep</p>
        </motion.div>

        {/* ── FEATURED SELECTION (USER REQUESTED PATTERN) ─────── */}
        {filtered && filtered.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 lg:p-6 bg-accent/5 border border-accent/20 rounded-2xl flex flex-col md:flex-row items-center gap-4 lg:gap-6"
          >
            <div className="flex-1 text-center md:text-left">
              <span className="px-3 py-1 bg-accent text-white text-[9px] lg:text-[10px] font-black rounded-full uppercase tracking-tighter mb-2 inline-block">Featured Choice</span>
              <h2 className="font-heading text-lg lg:text-2xl font-black text-primary mb-1 lg:mb-2 line-clamp-1 truncate">{filtered[0].name}</h2>
              <p className="text-[10px] lg:text-sm text-brown-400 mb-3 lg:mb-4 line-clamp-2">{filtered[0].description}</p>
              <button 
                onClick={() => navigate(`/product/${filtered[0].id}`)}
                className="px-4 lg:px-6 py-1.5 lg:py-2 bg-primary text-secondary text-[10px] lg:text-xs font-bold rounded-xl hover:bg-accent transition-all shadow-md"
              >
                Inspect Artifact Details →
              </button>
            </div>
            <div className="w-full md:w-48 h-24 lg:h-32 rounded-xl overflow-hidden shadow-lg border-2 border-white shrink-0">
              <img src={filtered[0].image_url} alt="Featured" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cakes, flavors, tags..."
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl shadow-sm border border-brown-100 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3.5 bg-white rounded-xl shadow-sm border border-brown-100 text-sm focus:outline-none focus:border-accent cursor-pointer"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3.5 rounded-xl shadow-sm border text-sm font-medium transition-all ${
                showFilters ? 'bg-accent text-white border-accent' : 'bg-white border-brown-100 text-primary'
              }`}
            >
              <HiOutlineFilter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Budget Filter */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-brown-100 mb-8"
          >
            <h3 className="font-heading font-semibold text-primary mb-4">Budget Slider</h3>
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
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? 'gradient-accent text-white shadow-md'
                  : 'bg-white text-primary border border-brown-100 hover:border-accent/30'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-brown-400 mb-6">
          Showing <span className="font-semibold text-primary">{filtered.length}</span> items
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="font-heading text-xl font-bold text-primary mb-2">No items found</h3>
            <p className="text-brown-400 text-sm">Try adjusting your search or filters</p>
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
