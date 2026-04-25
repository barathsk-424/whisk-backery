import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import ErrorBoundary from "./components/layout/ErrorBoundary";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import CartSidebar from "./components/cart/CartSidebar";
import VoiceFAB from "./components/voice/VoiceFAB";
import useStore from "./store/useStore";
import BackendStatus from "./components/layout/BackendStatus";

// Pages
// Pages (Lazy Loaded)
const HomePage = lazy(() => import("./pages/Home/HomePage"));
const MenuPage = lazy(() => import("./pages/Menu/MenuPage"));
const BuilderPage = lazy(() => import("./pages/Builder/BuilderPage"));
const TrackOrdersPage = lazy(() => import("./pages/Track/TrackOrdersPage"));
const TrackOrderPage = lazy(() => import("./pages/Track/TrackOrderPage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminPage"));
const EditCakePage = lazy(() => import("./pages/Admin/EditCakePage"));
const EditBundlePage = lazy(() => import("./pages/Admin/EditBundlePage"));
const FinanceDashboard = lazy(() => import("./pages/Finance/FinanceDashboard"));
const AddCakePage = lazy(() => import("./pages/Products/AddCakePage"));
const AddBundlePage = lazy(() => import("./pages/Admin/AddBundlePage"));
const ProfilePage = lazy(() => import("./pages/Profile/ProfilePage"));
const ProductDetailsPage = lazy(() => import("./pages/Products/ProductDetailsPage"));
const Cart = lazy(() => import("./pages/Cart/CartPage"));
const CheckoutPage = lazy(() => import("./pages/Checkout/CheckoutPage"));
const BundlesPage = lazy(() => import("./pages/Bundles/BundlesPage"));
const BundleDetailsPage = lazy(() => import("./pages/Bundles/BundleDetailsPage"));
const StockAnalysisDashboard = lazy(() => import("./pages/Stock/StockAnalysisDashboard"));
const StockDetailPage = lazy(() => import("./pages/Stock/StockDetailPage"));
const InvoicePage = lazy(() => import("./pages/Checkout/InvoicePage"));
const OrderSuccessPage = lazy(() => import("./pages/Checkout/OrderSuccessPage"));

// Standard components
import ContactSection from "./components/home/ContactSection";

// ─── UNIFIED PROTECTED ROUTE ENGINE (JWT BASED) ─────────────
const ProtectedRoute = ({ children }) => {
  const { user, authInitialized } = useStore();

  if (!authInitialized)
    return (
      <div className="p-20 text-center text-brown-400">
        Verifying Identity...
      </div>
    );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) throw new Error("Invalid Token Structure");
    
    // Use safe decoding for web
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);

    if (decoded.role !== "admin" && decoded.source !== "master") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-secondary">
          <div className="text-center p-12 bg-white rounded-[3rem] shadow-2xl border border-error/20">
            <h2 className="text-3xl font-black text-error uppercase tracking-tighter">
              Access Denied
            </h2>
            <p className="text-brown-400 font-black uppercase text-[10px] tracking-[0.4em] mt-4">
              Insufficient Clearance for Command Protocols
            </p>
            <a
              href="/"
              className="mt-8 inline-block px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
            >
              Abort & Exit
            </a>
          </div>
        </div>
      );
    }
    return children;
  } catch (err) {
    console.error("[App] Token Verification Interrupted:", err.message);
    localStorage.removeItem("token"); // Cleanup malformed signal
    return <Navigate to="/login" replace />;
  }
};

// Standard Render Wrapper
const SafeRender = ({ component: Component }) => {
  if (!Component)
    return (
      <div className="p-20 text-center text-brown-400">Loading Base UI...</div>
    );
  return <Component />;
};

function App() {
  const { initializeAuth, authInitialized, theme } = useStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative flex flex-col items-center"
        >
          <motion.div
            animate={{ 
              y: [0, -10, 0],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <img 
              src="/logo.png" 
              alt="Whisk Bakery" 
              className="w-48 md:w-64 h-auto drop-shadow-[0_20px_50px_rgba(74,42,26,0.3)]" 
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="mt-8 flex flex-col items-center"
          >
            <div className="h-[2px] w-12 bg-brown-200/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full w-full bg-gradient-to-r from-transparent via-brown-400 to-transparent"
              />
            </div>
            <p className="mt-4 font-black text-brown-300 uppercase tracking-[0.5em] text-[8px]">
              Crafting Perfection
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary font-black text-brown-300 uppercase tracking-widest text-[8px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-brown-200 border-t-brown-500 rounded-full animate-spin" />
          Initializing Artisan Secure Protocols...
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div
          className={`min-h-screen flex flex-col overflow-x-hidden transition-colors duration-500 ${theme === "dark" ? "bg-[#0D0807] dark" : "bg-secondary"}`}
        >
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style:
                theme === "dark"
                  ? { background: "#2D1F1F", color: "#FFD7BA" }
                  : { background: "#4A2A1A", color: "#FFF8E7" },
            }}
          />

          <Navbar />
          <CartSidebar />
          <VoiceFAB />

          <main className="flex-1 overflow-visible">
            <Suspense
              fallback={
                <div className="p-20 text-center text-brown-400">
                  Restoring Bakery Interface...
                </div>
              }
            >
              <AnimatePresence mode="wait">
                <Routes>
                  <Route
                    path="/"
                    element={<SafeRender component={HomePage} />}
                  />
                  <Route
                    path="/menu"
                    element={<SafeRender component={MenuPage} />}
                  />
                  <Route
                    path="/cake-builder"
                    element={<SafeRender component={BuilderPage} />}
                  />
                  <Route
                    path="/bundles"
                    element={<SafeRender component={BundlesPage} />}
                  />
                  <Route
                    path="/track-orders"
                    element={
                      <ProtectedRoute>
                        <SafeRender component={TrackOrdersPage} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <div className="pt-24">
                        <SafeRender component={ContactSection} />
                      </div>
                    }
                  />

                  {/* AUTH GATEWAY */}
                  <Route
                    path="/login"
                    element={<SafeRender component={LoginPage} />}
                  />

                  {/* PROTECTED COMMAND CENTER ROUTES */}
                  <Route
                    path="/admin-dashboard"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={AdminDashboard} />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/add-cake"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={AddCakePage} />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/edit-cake/:id"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={EditCakePage} />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/edit-bundle/:id"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={EditBundlePage} />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/add-bundle"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={AddBundlePage} />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/finance"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={FinanceDashboard} />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/stock"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={StockAnalysisDashboard} />
                      </ProtectedAdminRoute>
                    }
                  />
                  <Route
                    path="/stock/:id"
                    element={
                      <ProtectedAdminRoute>
                        <SafeRender component={StockDetailPage} />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* MEMBER SERVICES (PROTECTED) */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <SafeRender component={ProfilePage} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cart"
                    element={
                      <ProtectedRoute>
                        <SafeRender component={Cart} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <SafeRender component={CheckoutPage} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-success"
                    element={
                      <ProtectedRoute>
                        <SafeRender component={OrderSuccessPage} />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/product/:id"
                    element={<SafeRender component={ProductDetailsPage} />}
                  />
                  <Route
                    path="/bundle/:id"
                    element={<SafeRender component={BundleDetailsPage} />}
                  />
                  <Route
                    path="/track/:id"
                    element={<SafeRender component={TrackOrderPage} />}
                  />
                  <Route
                    path="/invoice/:orderId"
                    element={
                      <ProtectedRoute>
                        <SafeRender component={InvoicePage} />
                      </ProtectedRoute>
                    }
                  />

                  {/* ARTISAN FALLBACK */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Suspense>
          </main>

          <Footer />
          <BackendStatus />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
