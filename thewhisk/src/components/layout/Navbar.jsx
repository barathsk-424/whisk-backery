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
} from "react-icons/hi";
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
        className={`px-6 py-4 flex flex-col lg:flex-row justify-between items-center sticky top-0 z-[9999] shadow-xl border-b transition-all duration-500 gap-4 ${
          theme === "dark"
            ? "bg-[#1A1110] border-white/5 text-white"
            : "bg-white border-brown-50 text-primary"
        }`}
      >
        <div className="flex items-center justify-between w-full lg:w-auto">
          <a href="/" className="flex items-center gap-3 group shrink-0">
            <span className="text-3xl group-hover:rotate-12 transition-transform duration-500">
              🧁
            </span>
            <div>
              <h1
                className={`font-heading text-[18px] font-black tracking-tight uppercase ${theme === "dark" ? "text-secondary" : "text-primary"}`}
              >
                The Whisk
              </h1>
              <p className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mt-[-4px]">
                Baking Artistry
              </p>
            </div>
          </a>

          <div className="flex items-center gap-4 lg:hidden">
            <button
              onClick={() => setIsScannerOpen(true)}
              className={`p-2 rounded-full transition-all ${theme === "dark" ? "bg-white/5 text-white" : "bg-secondary text-primary"}`}
            >
              <HiOutlineCamera className="text-xl" />
            </button>
            <button onClick={() => toggleTheme()} className="text-xl">
              {theme === "dark" ? <HiOutlineSun /> : <HiOutlineMoon />}
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="relative text-xl"
            >
              <HiOutlineShoppingCart />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-[8px] h-3.5 w-3.5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-8 flex-wrap justify-center font-black text-[14px] tracking-[0.2em]">
          <button
            onClick={() => navigate("/")}
            className="hover:text-accent transition-all hover:scale-105"
          >
            Home
          </button>
          <button
            onClick={() => navigate("/menu")}
            className="hover:text-accent transition-all hover:scale-105"
          >
            Menu
          </button>
          <button
            onClick={() => navigate("/cake-builder")}
            className="hover:text-accent transition-all hover:scale-105"
          >
            Cake Builder
          </button>
          <button
            onClick={() => navigate("/bundles")}
            className="hover:text-accent transition-all hover:scale-105"
          >
            Bundles
          </button>
          <button
            onClick={() => navigate("/track-orders")}
            className="hover:text-accent transition-all hover:scale-105"
          >
            Tracking
          </button>
          <button
            onClick={() => navigate("/contact")}
            className="hover:text-accent transition-all hover:scale-105"
          >
            Contact
          </button>
        </div>

        <div className="flex items-center gap-4 py-1">
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
      </nav>

      {/* Global Scanner Instance */}
      <CakeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </>
  );
}
