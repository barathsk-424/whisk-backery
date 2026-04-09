import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiStar, HiArrowRight, HiSparkles } from 'react-icons/hi';
import useStore from '../../store/useStore';
import ProductCard from '../../components/products/ProductCard';
import { occasions, bundles, mockReviews } from '../../data/mockData';
import ContactSection from '../../components/home/ContactSection';

export default function HomePage() {
  const navigate = useNavigate();
  const { products, searchQuery, setSearchQuery, loading, theme } = useStore();
  const menuRef = useRef(null);
  
  const featured = products.slice(0, 4);
  const popular = products.filter((p) => (p.rating || 0) >= 4.7);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
      {loading && products.length === 0 ? (
        <div className="min-h-screen flex items-center justify-center bg-brown-50">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="ml-4 text-brown-400 font-medium font-inter tracking-tight">Whisking things up... 🧁</p>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="relative min-h-[85vh] lg:min-h-[92vh] gradient-hero flex items-center overflow-hidden py-12 lg:py-0">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 right-10 w-96 h-96 bg-warning/10 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Left Content */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="text-center lg:text-left"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-accent/20 rounded-full text-accent-light text-[10px] sm:text-sm font-medium mb-6 uppercase tracking-widest"
                  >
                    <HiSparkles className="w-3 h-3 sm:w-4 h-4" />
                    AI-Powered Bakery Experience
                  </motion.div>

                  <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl font-black text-[#FFF8E7] leading-[1.1] mb-6 tracking-tighter">
                    Crafted with{' '}
                    <span className="text-gradient block sm:inline">Love,</span>
                    <br className="hidden sm:block" />
                    Delivered with{' '}
                    <span className="text-gradient block sm:inline">Joy</span>
                  </h1>

                  <p className="text-[#FFF8E7]/70 text-sm sm:text-lg max-w-xl mb-8 leading-relaxed mx-auto lg:mx-0">
                    Build your dream cake in 3D, get AI-powered recommendations, and track your order in real-time. The future of bakery is here.
                  </p>

                  {/* Search */}
                  <div className="relative max-w-lg mb-8">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-full overflow-hidden p-1 sm:p-0">
                      <div className="flex items-center flex-1 px-4 py-3 sm:py-0">
                        <HiOutlineSearch className="w-5 h-5 text-brown-300 mr-2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search artifacts..."
                          className="flex-1 bg-transparent text-[#FFF8E7] placeholder-[#FFF8E7]/40 text-sm focus:outline-none"
                        />
                      </div>
                      <Link
                        to="/menu"
                        className="px-8 py-3 gradient-accent text-white text-xs font-black uppercase tracking-widest rounded-xl sm:m-1.5 hover:opacity-90 transition-all text-center"
                      >
                        Search
                      </Link>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/cake-builder"
                      className="group flex items-center justify-center gap-2 px-8 py-3.5 gradient-accent text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent/30"
                    >
                      🎨 Build Your Cake
                      <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/menu"
                      className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/10 border border-white/20 text-[#FFF8E7] font-semibold rounded-xl hover:bg-white/20 transition-all"
                    >
                      Explore Menu
                    </Link>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between sm:justify-start gap-4 sm:gap-10 mt-10 max-w-sm">
                    {[
                      { value: '10K+', label: 'Customers' },
                      { value: '500+', label: 'Designs' },
                      { value: '4.9★', label: 'Rating' },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="font-heading font-black text-xl sm:text-2xl text-accent tracking-tighter">{stat.value}</p>
                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-brown-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Right — Hero Image */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="hidden lg:flex justify-center relative"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ y: [-10, 10, -10] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop"
                        alt="Delicious chocolate cake"
                        className="w-[420px] h-[420px] object-cover rounded-full shadow-2xl border-4 border-white/10"
                        style={{ pointerEvents: 'none' }}
                      />
                    </motion.div>

                    {/* Floating action cards — fully clickable */}
                    <motion.button
                      onClick={() => navigate('/cake-builder')}
                      animate={{ y: [-5, 5, -5] }}
                      whileHover={{ scale: 1.12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                      className={`absolute -left-8 top-20 rounded-xl p-3 shadow-lg cursor-pointer text-left ${theme === 'dark' ? 'bg-[#1A1110] border border-white/10' : 'bg-white'}`}
                      style={{ zIndex: 20, border: 'none', outline: 'none' }}
                      title="Build your custom 3D cake"
                    >
                      <p className="text-2xl">🎂</p>
                      <p className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Custom 3D</p>
                      <p className="text-[10px] text-brown-400">Build & Preview</p>
                    </motion.button>

                    <motion.button
                      onClick={() => navigate('/menu?ai=1')}
                      animate={{ y: [5, -5, 5] }}
                      whileHover={{ scale: 1.12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                      className={`absolute -right-4 bottom-28 rounded-xl p-3 shadow-lg cursor-pointer text-left ${theme === 'dark' ? 'bg-[#1A1110] border border-white/10' : 'bg-white'}`}
                      style={{ zIndex: 20, border: 'none', outline: 'none' }}
                      title="Get AI-powered cake suggestions"
                    >
                      <p className="text-2xl">🤖</p>
                      <p className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>AI Suggest</p>
                      <p className="text-[10px] text-brown-400">Smart Picks</p>
                    </motion.button>

                    <motion.button
                      onClick={() => navigate('/track-orders')}
                      animate={{ y: [-8, 8, -8] }}
                      whileHover={{ scale: 1.12, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 3.5, repeat: Infinity, delay: 0.3 }}
                      className={`absolute right-10 top-0 rounded-xl p-3 shadow-lg cursor-pointer text-left ${theme === 'dark' ? 'bg-[#1A1110] border border-white/10' : 'bg-white'}`}
                      style={{ zIndex: 20, border: 'none', outline: 'none' }}
                      title="Track your order live"
                    >
                      <p className="text-2xl">🛵</p>
                      <p className={`text-xs font-semibold mt-1 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Live Track</p>
                      <p className="text-[10px] text-brown-400">Real-time</p>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Occasions Bubbles */}
          <section className={`py-12 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#1A1110]' : 'bg-secondary'}`}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className={`font-heading text-2xl font-bold text-center mb-8 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                Shop by Occasion
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory px-4">
                {occasions.map((occ, i) => (
                  <motion.div
                    key={occ.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="shrink-0 snap-center text-center w-20 sm:w-24"
                  >
                    <Link to={`/menu?occasion=${occ.id}`} className="block">
                      <div
                        className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-lg mb-3 transition-all hover:scale-110 active:scale-90 mx-auto"
                        style={{ backgroundColor: occ.color + '15', border: `2px solid ${occ.color}40` }}
                      >
                        {occ.emoji}
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-widest truncate ${theme === 'dark' ? 'text-white/60' : 'text-primary'}`}>{occ.name}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-16" ref={menuRef}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className={`font-heading text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                    🔥 Recommended For You
                  </h2>
                  <p className="text-sm text-brown-400 mt-1 font-bold">Handpicked by our AI based on what's trending</p>
                </div>
                <Link
                  to="/menu"
                  className="flex items-center gap-1 text-accent font-semibold text-sm hover:gap-2 transition-all"
                >
                  View All <HiArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featured.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>

          {/* Smart Bundles */}
          <section className={`py-16 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#1A1110]' : 'bg-secondary'}`}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className={`font-heading text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                  🎁 Smart Bundles
                </h2>
                <p className="text-sm text-brown-400 mt-1 font-bold">
                  Curated combos for every occasion — save up to 20%
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {bundles.map((bundle, i) => (
                  <motion.div
                    key={bundle.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className={`rounded-2xl overflow-hidden shadow-md group cursor-pointer border transition-all ${
                      theme === 'dark' ? 'bg-[#0D0807] border-white/5' : 'bg-white border-brown-50'
                    }`}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={bundle.image_url}
                        alt={bundle.name}
                        className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {bundle.discount}% OFF
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{bundle.emoji}</span>
                        <h3 className={`font-heading font-semibold ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{bundle.name}</h3>
                      </div>
                      <ul className="text-xs text-brown-400 space-y-1 mb-3">
                        {bundle.items.map((item) => (
                          <li key={item} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-accent rounded-full" /> {item}
                          </li>
                        ))}
                      </ul>
                      <div className={`flex items-center justify-between pt-3 border-t ${theme === 'dark' ? 'border-white/5' : 'border-brown-100'}`}>
                        <div>
                          <span className="text-xs text-brown-300 line-through">₹{bundle.original_price}</span>
                          <span className="font-heading font-bold text-accent ml-2">₹{bundle.final_price}</span>
                        </div>
                        <Link
                          to="/bundles"
                          className="px-3 py-1.5 text-xs font-bold text-accent bg-accent/10 rounded-full hover:bg-accent hover:text-white transition-all"
                        >
                          ADD
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Popular / Best Rated */}
          <section className="py-16">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className={`font-heading text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                    ⭐ Best Rated
                  </h2>
                  <p className="text-sm text-brown-400 mt-1 font-bold">Because you deserve the best</p>
                </div>
                <Link
                  to="/menu"
                  className="flex items-center gap-1 text-accent font-semibold text-sm hover:gap-2 transition-all"
                >
                  See More <HiArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {popular.slice(0, 4).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials */}
          <section className={`py-16 transition-colors duration-500 ${theme === 'dark' ? 'bg-[#1A1110]' : 'bg-secondary'}`}>
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className={`font-heading text-2xl font-bold text-center mb-10 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                💬 What Our Customers Say
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockReviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`rounded-xl p-5 border transition-all ${theme === 'dark' ? 'bg-[#0D0807] border-white/5 shadow-xl' : 'bg-white border-brown-50 shadow-sm'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{review.avatar}</span>
                      <div>
                        <p className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{review.user}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-brown-400">{review.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 mb-2">
                      {[...Array(review.rating)].map((_, j) => (
                        <HiStar key={j} className="w-4 h-4 text-warning" />
                      ))}
                    </div>
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-brown-500'}`}>"{review.comment}"</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 gradient-hero text-center">
            <div className="max-w-2xl mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-secondary mb-4">
                  Ready to Create Something Sweet?
                </h2>
                <p className="text-brown-300 mb-8">
                  Design your dream cake in our 3D builder or choose from our curated menu
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/cake-builder"
                    className="px-8 py-3.5 gradient-accent text-white font-semibold rounded-xl shadow-lg"
                  >
                    🎨 Start Building
                  </Link>
                  <Link
                    to="/menu"
                    className="px-8 py-3.5 bg-white/10 border border-white/20 text-secondary font-semibold rounded-xl"
                  >
                    Browse Menu
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>
          <ContactSection />
        </>
      )}
    </div>
  );
}
