import { create } from "zustand";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { getOrdersAPI } from "../lib/orderApi";
import { API_URL } from "../config";

const useStore = create((set, get) => ({
  // ─── INITIAL STATES ─────────────────
  user: null,
  profile: null,
  token: localStorage.getItem("token") || null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  authInitialized: false,
  cart: (() => {
    try {
      const saved = localStorage.getItem("cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  })(),
  cartOpen: false,
  searchQuery: "",
  activeCategory: "all",
  products: [],
  orders: [],
  savedDesigns: [],
  customCakes: [],
  budgetRange: [0, 5000],
  theme: localStorage.getItem("theme") || "light",
  reviews: [],

  // ── INITIALIZE AUTH (JWT BASED) ───────────
  initializeAuth: async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join(""),
          );

          const decoded = JSON.parse(jsonPayload);
          set({
            user: decoded,
            isAuthenticated: true,
            isAdmin: decoded.role === "admin" || decoded.source === "master",
            token: token,
          });
          get().fetchOrders();
          get().fetchSavedDesigns();
        } catch (e) {
          localStorage.removeItem("token");
        }
      }
      set({ authInitialized: true });
      get().fetchProducts();
    } catch (err) {
      set({ authInitialized: true });
    }
  },

  setAuthData: (user, token) => {
    set({
      user,
      token,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin" || user?.source === "master",
    });
    if (user) {
      get().fetchOrders();
      get().fetchSavedDesigns();
    }
  },

  // ─── GLOBAL SETTERS ───────────────────────
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setBudgetRange: (range) => set({ budgetRange: range }),
  setProducts: (prods) => set({ products: prods }),
  setTheme: (theme) => {
    localStorage.setItem("theme", theme);
    set({ theme });
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  },
  toggleTheme: () => get().setTheme(get().theme === "light" ? "dark" : "light"),

  // ─── USER DATA FETCHING ──────────────────────
  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      set({ products: data || [], loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  initiateRazorpayPayment: async (amount, orderId) => {
    // In local development, we simulate a successful Razorpay flow
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          razorpay_payment_id:
            "pay_artisan_" + Math.random().toString(36).substr(2, 9),
          razorpay_order_id: orderId,
          razorpay_signature: "mock_signature_" + Date.now(),
          status: "captured",
        });
      }, 1500);
    });
  },

  fetchOrders: async () => {
    const uID = get().user?.id || get().user?.sub;
    if (!uID) return;

    try {
      const { success, orders, error } = await getOrdersAPI({
        user_id: uID,
        email: get().user?.email,
      });
      if (!success) throw new Error(error);
      set({ orders: orders || [] });
    } catch (err) {
      console.error("Artisan Archive Sync Failed:", err);
      // Even if API fails, the orders are handled by the local cache in the API wrapper
    }
  },

  deleteOrder: async (orderId) => {
    // Optimistically remove from UI first to ensure a smooth experience
    set((state) => ({ orders: state.orders.filter((o) => o.id !== orderId) }));

    // Attempt database deletion if it's not a mock order
    if (
      orderId &&
      !orderId.toString().startsWith("ord-") &&
      !orderId.toString().includes("mock")
    ) {
      try {
        const { error } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderId);
        if (error) throw error;
        toast.success("Order removed from history!");
      } catch (err) {
        // Fallback: If DB delete fails (e.g. RLS), we've already hidden it from UI for this session.
        console.warn(
          "DB deletion failed, but hidden from session UI:",
          err.message,
        );
      }
    } else {
      toast.success("Demo order removed from session.");
    }
  },

  clearOrders: async () => {
    const { user } = get();
    if (!user) return;
    if (
      !window.confirm(
        "Are you sure you want to clear your entire order history from the Artisan Vault?",
      )
    )
      return;

    // Always clear the UI state first
    set({ orders: [] });

    try {
      const uID = user.id || user.sub;
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("user_id", uID);
      toast.success("Artisan history cleared!");
    } catch (err) {
      console.warn("Full history clear failure:", err.message);
    }
  },

  fetchSavedDesigns: async () => {
    const { user } = get();
    const uID = user?.id || user?.sub;
    if (!uID) return;
    try {
      const { data, error } = await supabase
        .from("saved_designs")
        .select("*")
        .eq("user_id", uID)
        .order("created_at", { ascending: false });
      if (error) throw error;
      set({ savedDesigns: data || [] });
    } catch (err) {
      console.warn("Artisan Blueprint Sync Interrupted:", err.message);
    }
  },

  // ─── ARTISAN OPERATIONS ──────────────────────
  ensureUserProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profileData = {
        id: user.id || user.sub,
        email: user.email,
        name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Artisan Member",
      };

      // Minimal upsert matching user requirements and ensuring 'name' is not null
      await supabase.from("users").upsert([profileData], { onConflict: "id" });
    } catch (err) {
      console.warn("Profile sync warning:", err.message);
    }
  },

  placeOrder: async (orderMetadata) => {
    const { cart, user, getCartTotal } = get();
    if (!user) {
      toast.error("Identity required to place order.");
      return;
    }

    // Ensure public.users entry exists to prevent FK constraint errors (orders_user_id_fkey)
    await get().ensureUserProfile();

    try {
      const orderPayload = {
        user_id: user.id || user.sub || null,
        user_email: user.email,
        customer_name:
          orderMetadata.delivery_details?.name ||
          user.user_metadata?.full_name ||
          "Artisan Guest",
        items: cart,
        total_price: getCartTotal(),
        status: orderMetadata.status || "Order Confirmed",
        payment_status: orderMetadata.payment_status || "pending",
        payment_method: orderMetadata.payment_method || "Online",
        payment_id: orderMetadata.payment_id || null,
        delivery_date:
          orderMetadata.delivery_date || new Date().toISOString().split("T")[0],
        delivery_time: orderMetadata.delivery_time || "N/A",
        address: orderMetadata.delivery_details || {},
        delivery_details: orderMetadata.delivery_details || {},
        notes: orderMetadata.notes || "",
        product_name: cart[0]?.name || "Custom Bakery Piece",
        image_url: cart[0]?.image_url || cart[0]?.image || "",
        price: cart[0]?.price || 0,
        quantity: cart.reduce((acc, item) => acc + (item.quantity || 1), 0),
        revenue_category:
          orderMetadata.revenue_category ||
          (getCartTotal() > 3000 ? "Premium Artisan" : "Standard Collection"),
        peak_impact: orderMetadata.peak_impact || false,
      };

      const { data, error } = await supabase
        .from("orders")
        .insert([orderPayload])
        .select();
      if (error) throw error;

      const successfulOrder = data[0];

      // PERSIST FOR SUCCESS PAGE
      localStorage.setItem(
        "lastOrder",
        JSON.stringify({
          ...successfulOrder,
          total: getCartTotal(),
          items: cart,
          address: orderMetadata.delivery_details,
        }),
      );

      // SIGNAL INVOICE GENERATION (FIRE & FORGET)
      fetch(`${API_URL}/api/invoices/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: successfulOrder.id,
          user_id: user.id || user.sub,
          customer_name: successfulOrder.customer_name,
          customer_email: successfulOrder.user_email,
          total_amount: successfulOrder.total_price,
          items: cart,
          customer_phone: orderMetadata.delivery_details?.phone || "",
          customer_address: orderMetadata.delivery_details?.address || "",
        }),
      }).catch((e) => console.error("Invoice signal loss:", e));

      set({ cart: [] });
      localStorage.removeItem("cart");
      get().fetchOrders();
      toast.success("Artisan Order Placed Successfully! 🧁");
      return successfulOrder;
    } catch (err) {
      toast.error("Order failed. Please try again.");
      throw err;
    }
  },

  saveCakeDesign: async (designData) => {
    const { user } = get();
    if (!user) throw new Error("Identity required to save blueprints");
    try {
      const { data, error } = await supabase
        .from("saved_designs")
        .insert([{ user_id: user.id, ...designData }])
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ savedDesigns: [data, ...state.savedDesigns] }));
      toast.success("Blueprint Saved to Artisan Vault! 📐");
      return data;
    } catch (err) {
      throw err;
    }
  },

  // ─── CART MANIPULATION ───────────────────────
  createCustomProduct: async (cakeData) => {
    // Generate a unique ID for the custom piece to ensure it doesn't collide in the cart
    const customId = "custom-" + Math.random().toString(36).substr(2, 9);
    return {
      id: customId,
      ...cakeData,
      is_custom: true,
    };
  },

  addToCart: async (product, quantity = 1) => {
    const { cart } = get();
    const existing = cart.find(
      (i) => i.id === product.id && i.selectedSize === product.selectedSize,
    );
    let newCart = existing
      ? cart.map((i) =>
          i.id === product.id && i.selectedSize === product.selectedSize
            ? { ...i, quantity: (i.quantity || 0) + quantity }
            : i,
        )
      : [...cart, { ...product, quantity }];

    set({ cart: newCart, cartOpen: true });
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast.success(`${product.name} added to cart!`);
  },

  removeFromCart: (productId, selectedSize) => {
    const newCart = get().cart.filter(
      (i) => !(i.id === productId && i.selectedSize === selectedSize),
    );
    set({ cart: newCart });
    localStorage.setItem("cart", JSON.stringify(newCart));
  },

  updateCartQuantity: (productId, selectedSize, newQty) => {
    if (newQty < 1) return get().removeFromCart(productId, selectedSize);
    const newCart = get().cart.map((i) =>
      i.id === productId && i.selectedSize === selectedSize
        ? { ...i, quantity: newQty }
        : i,
    );
    set({ cart: newCart });
    localStorage.setItem("cart", JSON.stringify(newCart));
  },

  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
  getCartCount: () =>
    get().cart.reduce((count, item) => count + (item.quantity || 1), 0),
  getCartTotal: () =>
    get().cart.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 1),
      0,
    ),

  getFilteredProducts: () => {
    const { products, searchQuery, activeCategory, budgetRange } = get();
    return products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || p.category === activeCategory;
      const matchesBudget =
        p.price >= budgetRange[0] && p.price <= budgetRange[1];
      return matchesSearch && matchesCategory && matchesBudget;
    });
  },

  logout: async () => {
    localStorage.removeItem("token");
    set({
      user: null,
      profile: null,
      token: null,
      isAuthenticated: false,
      isAdmin: false,
      orders: [],
      savedDesigns: [],
    });
    // We keep the cart in UI and localStorage so guest work isn't lost on disconnect
    toast.success("Disconnected from Artisan Network.");
  },

  addReview: async (reviewData) => {
    const { user } = get();
    if (!user) throw new Error("Identity required to leave a review");
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            ...reviewData,
            user_id: user.id,
            user_name: user.name || user.email.split("@")[0],
          },
        ])
        .select()
        .single();
      if (error) throw error;
      set((state) => ({ reviews: [data, ...state.reviews] }));
      return data;
    } catch (err) {
      throw err;
    }
  },

  fetchReviews: async (productId) => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      set({ reviews: data || [] });
    } catch (err) {
      console.warn("Reviews Sync Error:", err.message);
    }
  },
}));

export default useStore;
