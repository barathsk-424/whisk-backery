import { Link, useNavigate } from "react-router-dom";
import useStore from "../../store/useStore";
import { useState } from "react";
import {
  HiOutlineCamera,
  HiOutlineSearch,
  HiOutlineShoppingCart,
  HiOutlineUserCircle,
  HiOutlineCog,
  HiOutlineArchive,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineLogin,
  HiArrowRight,
} from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import CakeScanner from "../scanner/CakeScanner";

export default function Navbar() {
  const navigate = useNavigate();
  const {
    cart,
    theme,
    toggleTheme,
    setSearchQuery,
    searchQuery,
    isAdmin,
    isAuthenticated,
  } = useStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (window.location.pathname !== "/menu") {
      navigate("/menu");
    }
  };

  return (
    <>
      <nav
        className={`px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row justify-between items-center sticky top-0 z-[9999] shadow-xl border-b transition-all duration-500 gap-4 ${
          theme === "dark"
            ? "bg-[#1A1110] border-white/5 text-white"
            : "bg-white border-brown-50 text-brown-800"
        }`}
      >
        <div className="flex items-center justify-between w-full lg:w-auto">
          <a href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <span className="text-2xl sm:text-3xl group-hover:rotate-12 transition-transform duration-500">
              🧁
            </span>
            <div className="min-w-0">
              <h1
                className={`font-heading text-sm sm:text-[18px] font-black tracking-tight uppercase truncate ${theme === "dark" ? "text-white" : "text-primary"}`}
              >
                The Whisk
              </h1>
              <p className="text-[8px] sm:text-[10px] font-black tracking-[0.3em] sm:tracking-[0.4em] uppercase text-accent mt-[-2px] sm:mt-[-4px]">
                Baking Artistry
              </p>
            </div>
          </a>

          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={toggleTheme}
              className="text-xl text-brown-400"
            >
              {theme === "dark" ? <HiOutlineSun /> : <HiOutlineMoon />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl transition-all ${theme === "dark" ? "text-white bg-white/5" : "text-primary bg-secondary"}`}
            >
              <div className="w-5 h-5 flex flex-col justify-center gap-1.5">
                <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`h-0.5 w-full bg-current rounded-full transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8 font-black text-[14px] tracking-[0.2em] justify-center">
          <button
            onClick={() => navigate("/")}
            className="hover:text-accent transition-all hover:scale-105 shrink-0"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/menu")}
            className="hover:text-accent transition-all hover:scale-105 shrink-0"
          >
            Menu
          </button>
          <button
            onClick={() => navigate("/cake-builder")}
            className="hover:text-accent transition-all hover:scale-105 shrink-0"
          >
            Builder
          </button>
          <button
            onClick={() => navigate("/bundles")}
            className="hover:text-accent transition-all hover:scale-105 shrink-0"
          >
            Bundles
          </button>
          <button
            onClick={() => navigate("/track-orders")}
            className="hover:text-accent transition-all hover:scale-105 shrink-0"
          >
            Tracking
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="hover:text-accent transition-all hover:scale-105 shrink-0"
          >
            Contact
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 py-1">
          {/* Search Bar */}
          <div
            className={`relative flex items-center transition-all duration-500 overflow-hidden ${isSearchOpen ? "w-48 lg:w-64" : "w-10"}`}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search blueprints..."
              className={`w-full py-2 pl-10 pr-4 rounded-full text-[11px] font-black focus:outline-none transition-all uppercase tracking-widest ${
                theme === "dark"
                  ? "bg-white/5 text-white placeholder:text-white/20"
                  : "bg-secondary text-primary placeholder:text-brown-200"
              }`}
            />
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="absolute left-0 p-2 text-xl hover:scale-120 transition-all text-accent"
              title="Search"
            >
              <HiOutlineSearch />
            </button>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className={`p-2.5 rounded-full hidden lg:flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 ${
              theme === "dark"
                ? "bg-white/5 border-white/10 text-white"
                : "bg-secondary border-brown-50 text-accent shadow-sm"
            }`}
            title="Artisan Sight"
          >
            <HiOutlineCamera className="text-xl" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">
              Scan Artifact
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="text-2xl hidden lg:block hover:rotate-12 transition-transform text-brown-400"
            title="Wavelength"
          >
            {theme === "dark" ? <HiOutlineSun /> : <HiOutlineMoon />}
          </button>

          <div className="h-6 w-[1px] bg-brown-100/20 mx-1 hidden lg:block" />

          <button
            onClick={() => navigate("/cart")}
            className="relative text-2xl hidden lg:block hover:scale-110 active:scale-90 transition-all text-primary"
            title="Cart"
          >
            <HiOutlineShoppingCart
              className={theme === "dark" ? "text-white" : "text-primary"}
            />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-white text-[9px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center shadow-luxury">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/track-orders")}
            className={`text-2xl hover:scale-110 active:scale-90 transition-all ${theme === "dark" ? "text-white/60" : "text-brown-400"}`}
            title="Orders"
          >
            <HiOutlineArchive />
          </button>

          {/* DUAL GATEWAY AUTH UI */}
          {isAuthenticated ? (
            <button
              onClick={() => navigate("/profile")}
              className="p-1 rounded-full text-2xl hover:scale-110 active:scale-90 transition-all text-accent border-2 border-accent/20"
              title="Identity"
            >
              <HiOutlineUserCircle />
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className={`px-4 py-2 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                theme === "dark"
                  ? "border-white/10 text-white hover:bg-shadow-white/5"
                  : "border-brown-100 text-primary hover:bg-secondary"
              }`}
            >
              <HiOutlineLogin className="text-lg" />
              Sign In
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="p-1 px-3 bg-primary text-white rounded-xl text-lg hover:scale-110 active:scale-90 transition-all shadow-lg flex items-center gap-2 group"
              title="Admin Hub"
            >
              <HiOutlineCog className="group-hover:rotate-90 transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-tighter">
                Command
              </span>
            </button>
          )}
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`lg:hidden fixed inset-x-0 top-[76px] p-6 shadow-2xl border-b z-[9998] flex flex-col gap-6 ${
                theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-50"
              }`}
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => { navigate("/"); setIsMobileMenuOpen(false); }}
                  className={`p-4 rounded-2xl text-left border flex flex-col justify-between h-24 ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-brown-50 border-brown-100"}`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent mb-auto">Vault</p>
                  <p className={`text-sm font-black uppercase tracking-tight ${theme === "dark" ? "text-white" : "text-primary"}`}>Home</p>
                </button>
                <button
                  onClick={() => { navigate("/menu"); setIsMobileMenuOpen(false); }}
                  className={`p-4 rounded-2xl text-left border flex flex-col justify-between h-24 ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-brown-50 border-brown-100"}`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent mb-auto">Archive</p>
                  <p className={`text-sm font-black uppercase tracking-tight ${theme === "dark" ? "text-white" : "text-primary"}`}>Menu</p>
                </button>
                <button
                  onClick={() => { navigate("/cake-builder"); setIsMobileMenuOpen(false); }}
                  className={`p-4 rounded-2xl text-left border flex flex-col justify-between h-24 ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-brown-50 border-brown-100"}`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent mb-auto">Lab</p>
                  <p className={`text-sm font-black uppercase tracking-tight ${theme === "dark" ? "text-white" : "text-primary"}`}>Builder</p>
                </button>
                <button
                  onClick={() => { navigate("/track-orders"); setIsMobileMenuOpen(false); }}
                  className={`p-4 rounded-2xl text-left border flex flex-col justify-between h-24 ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-brown-50 border-brown-100"}`}
                >
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-accent mb-auto">Radar</p>
                  <p className={`text-sm font-black uppercase tracking-tight ${theme === "dark" ? "text-white" : "text-primary"}`}>Tracking</p>
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-2xl border ${theme === "dark" ? "bg-accent/10 border-accent/20" : "bg-accent/5 border-accent/20"}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent text-white rounded-lg shadow-lg shadow-accent/20">
                    <HiOutlineShoppingCart className="text-xl" />
                  </div>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-tight ${theme === "dark" ? "text-white" : "text-primary"}`}>My Cart</p>
                    <p className="text-[10px] font-bold text-accent uppercase tracking-widest">{cartCount} items</p>
                  </div>
                </div>
                <button
                  onClick={() => { navigate("/cart"); setIsMobileMenuOpen(false); }}
                  className="px-5 py-2.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-accent/30 active:scale-95 transition-all"
                >
                  Open
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setIsScannerOpen(true); setIsMobileMenuOpen(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border ${theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-brown-50 border-brown-100 text-primary"}`}
                >
                  <HiOutlineCamera className="text-lg text-accent" />
                  Scanner
                </button>
                <button
                  onClick={toggleTheme}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border ${theme === "dark" ? "bg-white/5 border-white/5 text-white" : "bg-brown-50 border-brown-100 text-primary"}`}
                >
                  {theme === "dark" ? <HiOutlineSun className="text-lg text-warning" /> : <HiOutlineMoon className="text-lg text-accent" />}
                  Theme
                </button>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => { navigate("/profile"); setIsMobileMenuOpen(false); }}
                  className="p-5 bg-primary text-white rounded-2xl flex items-center justify-between shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                      <HiOutlineUserCircle className="text-2xl" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Operator Profile</span>
                  </div>
                  <HiArrowRight className="text-accent" />
                </button>
              ) : (
                <button
                  onClick={() => { navigate("/login"); setIsMobileMenuOpen(false); }}
                  className="p-5 gradient-accent text-white rounded-2xl flex items-center justify-between shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <HiOutlineLogin className="text-2xl" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Sign In</span>
                  </div>
                  <HiArrowRight />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Global Scanner Instance */}
      <CakeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </>
  );
}
