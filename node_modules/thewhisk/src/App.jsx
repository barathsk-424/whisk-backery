import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";

// Layout Components
import { ErrorBoundary, Navbar, Footer, BackendStatus, SafeRender, SplashScreen, AuthLoading } from "./components/layout";
import CartSidebar from "./components/cart/CartSidebar";
import VoiceFAB from "./components/voice/VoiceFAB";

// Auth Guards
import { ProtectedRoute, ProtectedAdminRoute } from "./components/auth";

// State
import useStore from "./store/useStore";

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
    return <SplashScreen />;
  }

  if (!authInitialized) {
    return <AuthLoading />;
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
