import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import AdminInvoices from "./AdminInvoices";
import {
  HiOutlineBriefcase,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineTemplate,
  HiOutlinePresentationChartLine,
  HiOutlineCube,
  HiOutlineTrendingUp,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineChartPie,
  HiOutlinePencilAlt,
  HiOutlineShoppingBag,
  HiOutlineDocumentReport,
  HiOutlineChatAlt,
  HiOutlineAnnotation,
} from "react-icons/hi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import useStore from "../../store/useStore";
import toast from "react-hot-toast";
import { API_URL } from "../../config";
import { bundles } from "../../data/mockData";

const COLORS = [
  "#FF4D6D",
  "#3D1F1F",
  "#9B1B30",
  "#F3E5AB",
  "#FFCC33",
  "#23120B",
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, fetchOrders: fetchOrdersStore, theme } = useStore();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [bundlesList, setBundlesList] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeFilter, setTimeFilter] = useState("daily"); // daily, monthly, yearly

  useEffect(() => {
    if (isAdmin) {
      console.log("Admin Sentinel Protocol → Initializing Secure Uplink...");
      fetchDashboardData();

      // Implement real-time order sentinel for the artisan command center
      const ordersChannel = supabase
        .channel('admin-pulse')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders' 
        }, payload => {
          console.log("Admin Sentinel Protocol → New Transmission Detected:", payload.new.id);
          toast.success(`AUTHENTICATION ALERT: New Order Protocol Initiated (ID: ${payload.new.id.slice(0, 8)})`, {
            duration: 8000,
            icon: '🍰',
            position: 'top-right'
          });
          fetchDashboardData(); // Rapid synchronization of intelligence state
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log("Admin Sentinel Protocol → Secure Uplink ESTABLISHED");
          } else if (status === 'CHANNEL_ERROR') {
            console.error("Admin Sentinel Protocol → Signal FAILURE:", err);
            toast.error("Telemetry link failure. Attempting reconnection...");
          } else {
            console.log("Admin Sentinel Protocol Status Update:", status);
          }
        });

      return () => {
        console.log("Admin Sentinel Protocol → Disconnecting Uplink...");
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Session missing. Please login again.");
        return;
      }

      // ─── FETCH CORE ANALYTICS VIA BACKEND (By-passing RLS) ───────
      const response = await fetch(`${API_URL}/api/admin-dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // If unauthorized, clear token and redirect
      if (response.status === 401) {
        localStorage.removeItem("token");
        useStore.setState({
          token: null,
          isAuthenticated: false,
          isAdmin: false,
          orders: [],
          savedDesigns: [],
          user: null,
          profile: null
        });
        toast.success("Artisan session terminated.");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Intelligence Retrieval Failed");

      const data = await response.json();
      setOrders(data.orders || []);
      setProducts(data.products || []);
      setUsers(data.users || []);
      setBundlesList(data.bundles || []);
      setContacts(data.contacts || []);
      setReviewsList(data.reviews || []);
      setFeedbackList(data.feedback || []);
      toast.success("Intelligence data synchronized.");
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
      if (error.status === 401) {
        localStorage.removeItem("token");
        useStore.getState().logout();
        navigate("/login");
        return;
      }
      toast.error(
        "Dashboard Access Denied: " + (error.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };


  if (!isAdmin) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center transition-colors duration-500 ${theme === "dark" ? "bg-[#0D0807]" : "bg-secondary"}`}
      >
        <div
          className={`text-center p-6 sm:p-12 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border transition-all ${theme === "dark" ? "bg-[#1A1110] border-white/5 text-secondary" : "bg-white border-brown-100 text-primary"}`}
        >
          <div className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl">🔒</div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Access Denied</h2>
          <p className="mt-4 text-accent font-black uppercase text-[10px] tracking-[0.4em]">
            Administrative clearance required for protocol access.
          </p>
          <button 
            onClick={() => navigate("/")}
            className="mt-8 px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Abort to Home
          </button>
        </div>
      </div>
    );
  }

  // ── ADVANCED ANALYTICS ENGINE ────────────────────────────
  const analytics = useMemo(() => {
    const defaultStats = {
      dailyRev: 0,
      dailySold: 0,
      monthlySold: 0,
      peakHour: "N/A",
      revenueTrend: [],
      categoryDistribution: [],
      hourlyTrend: [],
      orderDensity: [],
      recentActivity: []
    };

    if (!orders || orders.length === 0) return defaultStats;
    const validOrders = orders.filter((o) => o.status !== "Cancelled");
    const now = new Date();
    const todayStr = now.toLocaleDateString("en-IN");
    const monthStr = now.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonth.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    const yearStr = now.getFullYear().toString();

    let dailyRev = 0;
    let dailySold = 0;
    let monthlySold = 0;
    let yearlyRev = 0;
    let yearlySold = 0;
    let totalRevenue = 0;
    let currentMonthRev = 0;
    let lastMonthRev = 0;

    const trendDays = {};
    const trendMonths = {};
    const trendYears = {};
    const hourlySales = Array(24)
      .fill(0)
      .map((_, i) => ({ hour: `${i}:00`, orders: 0 }));
    const categoryRev = {};
    const productSold = {};
    const flavorStats = {};

    validOrders.forEach((o) => {
      const oDate = new Date(o.created_at);
      const oDateStr = oDate.toLocaleDateString("en-IN");
      const oMonthStr = oDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      });
      const oYearStr = oDate.getFullYear().toString();
      const oHour = oDate.getHours();
      const oRev = Number(o.total_price || 0);

      totalRevenue += oRev;
      hourlySales[oHour].orders += 1;

      if (oMonthStr === monthStr) currentMonthRev += oRev;
      if (oMonthStr === lastMonthStr) lastMonthRev += oRev;

      let oItemsCount = 0;
      (o.items || []).forEach((item) => {
        const qty = Number(item.qty || item.quantity || 1);
        oItemsCount += qty;

        // Track products
        const name = item.name || "Custom Cake";
        productSold[name] = (productSold[name] || 0) + qty;

        // Extract potential flavors
        const flavors = [
          "Chocolate",
          "Vanilla",
          "Strawberry",
          "Red Velvet",
          "Butterscotch",
          "Pineapple",
          "Mango",
        ];
        flavors.forEach((f) => {
          if (name.toLowerCase().includes(f.toLowerCase())) {
            flavorStats[f] = (flavorStats[f] || 0) + qty;
          }
        });

        // Category Rev
        const prod = products.find(
          (p) => p.id === item.product_id || p.id === item.id,
        );
        const cat = prod?.category || "Custom";
        categoryRev[cat] =
          (categoryRev[cat] || 0) +
          (Number(item.price || item.total_price) || 0);
      });

      // Daily
      if (oDateStr === todayStr) {
        dailyRev += oRev;
        dailySold += oItemsCount;
      }
      trendDays[oDateStr] = (trendDays[oDateStr] || 0) + oRev;

      // Monthly
      if (oMonthStr === monthStr) {
        monthlySold += oItemsCount;
      }
      trendMonths[oMonthStr] = (trendMonths[oMonthStr] || 0) + oRev;

      // Yearly
      if (oYearStr === yearStr) {
        yearlyRev += oRev;
        yearlySold += oItemsCount;
      }
      trendYears[oYearStr] = (trendYears[oYearStr] || 0) + oRev;
    });

    const formatTrend = (map) =>
      Object.keys(map)
        .reverse()
        .map((k) => ({ name: k, revenue: map[k] }));

    const growth =
      lastMonthRev > 0
        ? ((currentMonthRev - lastMonthRev) / lastMonthRev) * 100
        : 0;

    return {
      dailyRev,
      dailySold,
      monthlySold,
      yearlyRev,
      yearlySold,
      totalRevenue,
      growth: growth.toFixed(1),
      hourlyTrend: hourlySales,
      dailyTrend: formatTrend(trendDays),
      monthlyTrend: formatTrend(trendMonths),
      yearlyTrend: formatTrend(trendYears),
      categoryData: Object.keys(categoryRev).map((name) => ({
        name,
        value: categoryRev[name],
      })),
      productData: Object.keys(productSold)
        .map((name) => ({ name, sales: productSold[name] }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5),
      flavorData: Object.keys(flavorStats)
        .map((name) => ({ name, value: flavorStats[name] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      aov:
        validOrders.length > 0
          ? Math.round(totalRevenue / validOrders.length)
          : 0,
      peakHour: hourlySales.reduce(
        (max, curr) => (curr.orders > max.orders ? curr : max),
        hourlySales[0],
      ).hour,
    };
  }, [orders, products]);

  const handleUpdateStatus = async (id, s) => {
    const tid = toast.loading(
      `Synchronizing operational state: ${s.toUpperCase()}...`,
    );
    try {
      // Transitioned to backend bridge to bypass RLS restrictions
      const response = await fetch(`${API_URL}/api/orders/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status: s }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to bridge synchronize operational state.");
      }

      toast.success("Operational state synchronized.", { id: tid });
      fetchDashboardData();
    } catch (err) {
      console.error("Artisan Link → Synchronization Failure:", err);
      toast.error(`Sync Failure: ${err.message}`, { id: tid });
    }
  };

  const handleRefund = async (orderId, amount) => {
    try {
      await useStore.getState().refundOrder(orderId, amount);
      fetchDashboardData();
    } catch (err) {
      console.error("Refund Execution Error:", err);
      toast.error(
        "Refund authorization denied: " + (err.message || "Unauthorized"),
      );
    }
  };

  return (
    <div
      className={`min-h-screen pt-24 pb-12 px-6 transition-all duration-700 ${theme === "dark" ? "bg-[#120B0B]" : "bg-secondary"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div>
            <h1
              className={`text-4xl font-black flex items-center gap-3 ${theme === "dark" ? "text-white" : "text-primary"}`}
            >
              <span className="p-2 bg-primary text-white rounded-2xl shadow-xl">
                👑
              </span>{" "}
              Artisan Dashboard
            </h1>
            <p className="text-accent font-black uppercase text-[10px] tracking-[0.4em] mt-2">
              Live analytics, sales milestones & granular reporting.
            </p>
          </div>

          <div
            className={`flex items-center gap-1 lg:gap-2 backdrop-blur-md p-1 lg:p-1.5 rounded-2xl border shadow-sm overflow-x-auto lg:overflow-x-visible no-scrollbar w-full lg:w-auto ${
              theme === "dark"
                ? "bg-white/5 border-white/10"
                : "bg-white/50 border-brown-100"
            }`}
          >
            {[
              {
                id: "overview",
                label: "Summary",
                icon: <HiOutlineBriefcase />,
              },
              {
                id: "orders",
                label: "Logistics",
                icon: <HiOutlineShoppingBag />,
              },
              {
                id: "invoices",
                label: "Financial",
                icon: <HiOutlineDocumentReport />,
              },
              {
                id: "sales",
                label: "Intelligence",
                icon: <HiOutlinePresentationChartLine />,
              },
              { id: "inventory", label: "Edit", icon: <HiOutlinePencilAlt /> },
              { id: "messages", label: "Interactions", icon: <HiOutlineChatAlt /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl text-[10px] lg:text-xs font-black transition-all shrink-0 ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-xl scale-105"
                    : "text-brown-400 hover:text-primary"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  l: "Daily Revenue",
                  v: `₹${analytics.dailyRev.toLocaleString()}`,
                  i: <HiOutlineTrendingUp />,
                  c: "bg-green-500",
                },
                {
                  l: "Daily Units Sold",
                  v: analytics.dailySold,
                  i: <HiOutlineCube />,
                  c: "bg-accent",
                },
                {
                  l: "Monthly Units Sold",
                  v: analytics.monthlySold,
                  i: <HiOutlinePresentationChartLine />,
                  c: "bg-primary",
                },
                {
                  l: "Peak Acquisition",
                  v: analytics.peakHour,
                  i: <HiOutlineClock />,
                  c: "bg-orange-500",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border shadow-sm flex items-center gap-4 lg:gap-5 group hover:shadow-lg transition-all ${
                    theme === "dark"
                      ? "bg-[#1A1110] border-white/5"
                      : "bg-white border-brown-50"
                  }`}
                >
                  <div
                    className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center text-white shadow-lg ${stat.c}`}
                  >
                    {stat.i}
                  </div>
                  <div>
                    <p className="text-[9px] lg:text-[10px] font-black text-brown-300 uppercase tracking-widest mb-0.5 lg:mb-1">
                      {stat.l}
                    </p>
                    <p
                      className={`text-xl lg:text-2xl font-black ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                    >
                      {stat.v}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Look Analytics Mini-Tables or secondary widgets could go here */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div
                className={`p-8 rounded-[2.5rem] border shadow-sm ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-50"}`}
              >
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brown-300 mb-6">
                  Recent Command Pulses
                </h4>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between py-2 border-b border-brown-50/10"
                    >
                      <span className="text-[10px] font-black text-brown-400 font-mono">
                        #{o.id.slice(0, 8)}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${o.status === "Delivered" ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"}`}
                      >
                        {o.status}
                      </span>
                      <span className="text-[10px] font-black text-primary">
                        ₹{o.total_price}
                      </span>
                    </div>
                  ))}
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                  >
                    View Full Logistics Manifest →
                  </button>
                </div>
              </div>
              <div
                className={`p-8 rounded-[2.5rem] border shadow-sm ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-50"}`}
              >
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brown-300 mb-6">
                  Inventory Health Snapshot
                </h4>
                <div className="space-y-4">
                  {products.slice(0, 5).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2 border-b border-brown-50/10"
                    >
                      <span className="text-[10px] font-black text-primary truncate max-w-[150px] uppercase">
                        {p.name}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase ${p.stock_quantity < 5 ? "text-red-500" : "text-green-500"}`}
                      >
                        {p.stock_quantity} IN STOCK
                      </span>
                      <div className="w-16 h-1 bg-brown-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent"
                          style={{
                            width: `${Math.min(100, p.stock_quantity * 2)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
              <div>
                <h2
                  className={`text-2xl font-black uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                >
                  Logistics Command Center
                </h2>
                <p className="text-accent font-black uppercase text-[9px] tracking-widest mt-1">
                  Real-time Fulfillment Synchronization
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    theme === "dark"
                      ? "bg-white/5 border-white/10 text-white"
                      : "bg-white border-brown-100 text-primary shadow-sm hover:shadow-md"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    "Refresh Logs"
                  )}
                </button>
              </div>
            </div>

            <div
              className={`rounded-2xl lg:rounded-[3rem] shadow-luxury border overflow-hidden ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-100"}`}
            >
              <div className="overflow-x-auto artisan-scrollbar">
                <table className="w-full text-left min-w-[900px] lg:min-w-0">
                  <thead>
                    <tr
                      className={`text-left text-[10px] font-black text-brown-400 uppercase tracking-[0.2em] border-b ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-secondary/30 border-brown-50"}`}
                    >
                      <th className="py-6 px-8 text-accent">Order ID</th>
                      <th className="py-6">Details & Items</th>
                      <th className="py-6">Consignee</th>
                      <th className="py-6">Financials</th>
                      <th className="py-6 text-right px-8">Status Control</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-brown-50"}`}
                  >
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-20 text-center">
                          <span className="text-4xl mb-4 block">📦</span>
                          <p className="text-brown-300 font-bold uppercase text-[10px] tracking-widest">
                            No transaction signals recorded.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr
                          key={o.id}
                          className={`align-top transition-all ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-secondary/10"}`}
                        >
                          <td className="py-8 px-8 font-mono text-[11px] text-brown-300">
                            #{o.id.slice(0, 10)}
                          </td>
                          <td className="py-8 min-w-[300px]">
                            <div className="space-y-4">
                              {(o.items || []).map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-4"
                                >
                                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-brown-50/20 shrink-0">
                                    <img
                                      src={
                                        item.image_url ||
                                        item.image ||
                                        "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop"
                                      }
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      className={`text-[11px] font-black uppercase truncate ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                                    >
                                      {item.name}
                                    </p>
                                    <p className="text-[9px] font-bold text-brown-400 italic">
                                      Qty: {item.qty || item.quantity} | ₹
                                      {item.price}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <p className="text-[9px] font-black text-accent bg-accent/5 px-3 py-1.5 rounded-lg inline-block border border-accent/10">
                                Ordered:{" "}
                                {new Date(o.created_at).toLocaleString("en-IN")}
                              </p>
                              {o.delivery_date && (
                                <p className="text-[9px] font-black text-blue-500 bg-blue-500/5 px-3 py-1.5 rounded-lg inline-block border border-blue-500/10 ml-2">
                                  Fulfillment: {o.delivery_date} |{" "}
                                  {o.delivery_time}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-8">
                            <p
                              className={`text-[11px] font-black uppercase mb-1 ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                            >
                              {o.customer_name ||
                                o.user_email ||
                                "Artisan Guest"}
                            </p>
                            <p className="text-[10px] text-brown-400 font-bold leading-relaxed max-w-[200px]">
                              {o.delivery_details?.address ||
                                o.address?.address ||
                                (typeof o.address === "string"
                                  ? o.address
                                  : "") ||
                                "No location signature detected"}
                            </p>
                            {o.delivery_details?.phone && (
                              <p className="text-[9px] font-black text-brown-300 mt-1">
                                📞 {o.delivery_details.phone}
                              </p>
                            )}
                          </td>
                          <td className="py-8">
                            <p className="text-[14px] font-black text-accent mb-2">
                              ₹{Number(o.total_price).toLocaleString()}
                            </p>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${
                                o.payment_status?.toLowerCase() === "paid"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : o.payment_status?.toLowerCase() ===
                                      "refunded"
                                    ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                    : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                              }`}
                            >
                              {o.payment_status || "Unpaid"}
                            </span>
                          </td>
                          <td className="py-8 px-8">
                            <div className="flex flex-col items-end gap-3">
                              <select
                                value={o.status}
                                onChange={(e) =>
                                  handleUpdateStatus(o.id, e.target.value)
                                }
                                className={`w-full px-4 py-2.5 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest focus:ring-4 focus:ring-accent/10 transition-all cursor-pointer ${
                                  theme === "dark"
                                    ? "bg-[#1A1110] border-white/10 text-white"
                                    : "bg-white border-brown-50 text-primary shadow-sm"
                                }`}
                              >
                                <option value="Pending">Pending Audit</option>
                                <option value="Order Confirmed">
                                  Order Confirmed
                                </option>
                                <option value="Preparing">Preparing</option>
                                <option value="Out for Delivery">
                                  Out for Delivery
                                </option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>

                              {o.status !== "Cancelled" &&
                                o.payment_status?.toLowerCase() === "paid" && (
                                  <button
                                    onClick={() =>
                                      handleRefund(o.id, o.total_price)
                                    }
                                    className="w-full py-2 bg-orange-500/5 text-orange-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all"
                                  >
                                    Authorize Refund
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "invoices" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <AdminInvoices theme={theme} />
          </motion.div>
        )}

        {activeTab === "sales" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Revenue Chart */}
              <div
                className={`lg:col-span-2 p-4 lg:p-10 rounded-2xl lg:rounded-[3rem] border shadow-luxury h-[400px] lg:h-[550px] flex flex-col relative overflow-hidden group ${
                  theme === "dark"
                    ? "bg-[#1A1110] border-white/5"
                    : "bg-white border-brown-100"
                }`}
              >
                <div className="flex items-center justify-between mb-8 z-10">
                  <div>
                    <h3
                      className={`text-[10px] lg:text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 lg:gap-3 ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                    >
                      <span className="p-2 bg-accent/10 rounded-lg text-accent">
                        <HiOutlinePresentationChartLine />
                      </span>
                      Trajectory Synthesis
                    </h3>
                    <p className="text-[10px] font-bold text-brown-400 uppercase mt-1">
                    Revenue Stream Analysis v4.2
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {["daily", "monthly", "yearly"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setTimeFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                          timeFilter === f
                            ? "bg-accent text-white shadow-lg"
                            : theme === "dark"
                              ? "bg-white/5 text-white hover:bg-white/10"
                              : "bg-secondary text-brown-400 hover:bg-white"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 z-10 font-black min-h-[250px] lg:min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        timeFilter === "daily"
                          ? analytics.dailyTrend
                          : timeFilter === "monthly"
                            ? analytics.monthlyTrend
                            : analytics.yearlyTrend
                      }
                    >
                      <defs>
                        <linearGradient
                          id="gradientRev"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#FF4D6D"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#FF4D6D"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={theme === "dark" ? "#333" : "#F0EBE6"}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: "#8B5E3C" }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: "#8B5E3C" }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "24px",
                          border: "none",
                          backgroundColor:
                            theme === "dark" ? "#1A1110" : "#fff",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                          padding: "20px",
                        }}
                        itemStyle={{
                          fontSize: "11px",
                          fontWeight: 900,
                          textTransform: "uppercase",
                          color: "#FF4D6D",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#FF4D6D"
                        strokeWidth={5}
                        fill="url(#gradientRev)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Growth Card */}
              <div className="bg-primary p-10 rounded-[3rem] shadow-luxury text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-10">
                    Velocity Report
                  </p>
                  <div className="space-y-12">
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-30 mb-2">
                        Revenue Growth (MoM)
                      </p>
                      <div className="flex items-baseline gap-3">
                        <h4
                          className={`text-6xl font-black ${Number(analytics.growth) >= 0 ? "text-green-400" : "text-red-400"}`}
                        >
                          {Number(analytics.growth) >= 0 ? "+" : ""}
                          {analytics.growth}%
                        </h4>
                        <HiOutlineTrendingUp
                          className={`text-3xl ${Number(analytics.growth) >= 0 ? "text-green-400" : "text-red-400 rotate-180"}`}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase opacity-30 mb-2">
                        Artisan Efficiency
                      </p>
                      <h4 className="text-4xl font-black tracking-tighter">
                        94.8%{" "}
                        <span className="text-lg opacity-40">OPTIMIZED</span>
                      </h4>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/10 mt-8 flex items-center justify-between uppercase text-[10px] font-black tracking-widest relative z-10">
                  <span>Market Index</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />{" "}
                    THRIVING
                  </span>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-accent/20 blur-[100px] rounded-full" />
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Peak Sales Time */}
              <div
                className={`p-10 rounded-[3rem] border shadow-luxury flex flex-col h-[400px] ${
                  theme === "dark"
                    ? "bg-[#1A1110] border-white/5"
                    : "bg-white border-brown-100"
                }`}
              >
                <h3
                  className={`text-sm font-black uppercase tracking-[0.2em] mb-10 flex items-center gap-3 ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                >
                  <span className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <HiOutlineClock />
                  </span>{" "}
                  Peak Acquisition Hours
                </h3>
                <div className="h-[400px] w-full min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.hourlyTrend}>
                      <XAxis dataKey="hour" hide />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "16px",
                          border: "none",
                          backgroundColor:
                            theme === "dark" ? "#1A1110" : "#fff",
                        }}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="orders"
                        fill={theme === "dark" ? "#FF4D6D" : "#3D1F1F"}
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] font-black text-brown-300 uppercase text-center mt-4">
                  Peak Activity Detected at{" "}
                  <span className="text-accent">{analytics.peakHour}</span>
                </p>
              </div>

              {/* Popular Cakes */}
              <div
                className={`p-10 rounded-[3rem] border shadow-luxury flex flex-col h-[400px] ${
                  theme === "dark"
                    ? "bg-[#1A1110] border-white/5"
                    : "bg-white border-brown-100"
                }`}
              >
                <h3
                  className={`text-sm font-black uppercase tracking-[0.2em] mb-10 flex items-center gap-3 ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                >
                  <span className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <HiOutlineSparkles />
                  </span>{" "}
                  Blueprint Popularity
                </h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {analytics.productData.map((p, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        theme === "dark"
                          ? "bg-white/5 border-white/5"
                          : "bg-secondary/30 border-brown-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${i === 0 ? "bg-accent text-white" : "bg-white text-brown-300"}`}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase truncate max-w-[120px] ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                        >
                          {p.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-accent">
                        {p.sales} SOLD
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flavor Intelligence */}
              <div
                className={`p-10 rounded-[3rem] border shadow-luxury flex flex-col h-[400px] ${
                  theme === "dark"
                    ? "bg-[#1A1110] border-white/5"
                    : "bg-white border-brown-100"
                }`}
              >
                <h3
                  className={`text-sm font-black uppercase tracking-[0.2em] mb-10 flex items-center gap-3 ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                >
                  <span className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                    <HiOutlineChartPie />
                  </span>{" "}
                  Flavor DNA Map
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={analytics.flavorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {analytics.flavorData.map((e, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 mt-6 w-full px-4">
                    {analytics.flavorData.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-[9px] font-black text-brown-300 uppercase tracking-tighter truncate">
                          {f.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "inventory" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6 px-4">
              <div>
                <h2
                  className={`text-2xl font-black uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                >
                  Catalog Management
                </h2>
                <p className="text-accent font-black uppercase text-[9px] tracking-widest mt-1">
                  Expanding the Artisan Portfolio
                </p>
              </div>
              <button
                onClick={() => navigate("/add-cake")}
                className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-luxury hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                <span className="text-xl">🎂</span> Create New Blueprint
              </button>
            </div>

            <div
              className={`rounded-[3rem] shadow-luxury border overflow-hidden ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-100"}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr
                      className={`border-b ${theme === "dark" ? "bg-[#120B0B] border-white/5" : "bg-secondary/20 border-brown-50"}`}
                    >
                      <th className="py-6 px-10 text-[10px] uppercase font-black text-brown-400 tracking-widest">
                        Cake Profile
                      </th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">
                        Pricing Matrix
                      </th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">
                        Stock Health
                      </th>
                      <th className="py-4 text-[10px] uppercase font-black text-brown-400 tracking-widest">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-brown-50"}`}
                  >
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        className={`transition-all ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-secondary/10"}`}
                      >
                        <td className="py-8 px-10 flex items-center gap-5">
                          <div
                            className={`w-16 h-16 rounded-[1.25rem] overflow-hidden border-4 shadow-md p-0.5 ${theme === "dark" ? "bg-[#120B0B] border-white/10" : "bg-secondary border-white"}`}
                          >
                            <img
                              src={p.image_url || p.image}
                              alt={p.name}
                              className="w-full h-full object-cover rounded-[1rem]"
                            />
                          </div>
                          <div>
                            <p
                              className={`font-black text-sm mb-0.5 uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}
                            >
                              {p.name}
                            </p>
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded uppercase tracking-tighter">
                              {p.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-8 font-black text-accent text-lg">
                          ₹{Number(p.price).toLocaleString()}
                        </td>
                        <td className="py-8">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-24 h-2 rounded-full overflow-hidden shadow-inner ${theme === "dark" ? "bg-white/5" : "bg-brown-100"}`}
                            >
                              <div
                                className={`h-full transition-all duration-1000 ${p.stock_quantity > 10 ? "bg-green-500" : "bg-red-500"}`}
                                style={{
                                  width: `${Math.min(100, (p.stock_quantity / 50) * 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-xs font-black ${theme === "dark" ? "text-secondary/50" : "text-primary"}`}
                            >
                              {p.stock_quantity}{" "}
                              <span className="opacity-30 text-[10px]">
                                UNITS
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="py-8 px-10 text-right">
                          <button
                            onClick={() => navigate(`/edit-cake/${p.id}`)}
                            className={`px-5 py-2.5 border-2 font-black text-[10px] rounded-xl uppercase tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm ${
                              theme === "dark"
                                ? "bg-white/5 border-white/10 text-white/40"
                                : "bg-white border-brown-50 text-brown-400"
                            }`}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Smart Bundles Management */}
            <div className={`mt-12 flex justify-between items-center mb-6 px-4`}>
              <div>
                <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                  Bundles Management
                </h2>
                <p className="text-accent font-black uppercase text-[9px] tracking-widest mt-1">
                  Curated Collections & Offers
                </p>
              </div>
            </div>

            <div className={`rounded-[3rem] shadow-luxury border overflow-hidden ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-100"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b ${theme === "dark" ? "bg-[#120B0B] border-white/5" : "bg-secondary/20 border-brown-50"}`}>
                      <th className="py-6 px-10 text-[10px] uppercase font-black text-brown-400 tracking-widest">Bundle Identity</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Included Items</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Pricing Strategy</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest text-right px-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-brown-50"}`}>
                    {(bundlesList.length > 0 ? bundlesList : bundles).map((b) => (
                      <tr key={b.id} className={`transition-all ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-secondary/10"}`}>
                        <td className="py-8 px-10 flex items-center gap-5">
                          <div className={`w-16 h-16 rounded-[1.25rem] overflow-hidden border-4 shadow-md p-0.5 ${theme === "dark" ? "bg-[#120B0B] border-white/10" : "bg-secondary border-white"}`}>
                            <img src={b.image_url} alt={b.name} className="w-full h-full object-cover rounded-[1rem]" />
                          </div>
                          <div>
                            <p className={`font-black text-sm mb-0.5 uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                              {b.emoji} {b.name}
                            </p>
                            <span className="px-2 py-0.5 bg-accent/10 text-accent text-[8px] font-black rounded uppercase tracking-tighter">
                              {b.discount}% OFF
                            </span>
                          </div>
                        </td>
                        <td className="py-8">
                          <ul className="list-disc pl-4 text-xs font-bold text-brown-400 space-y-1">
                            {b.items.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-8">
                          <div className="flex flex-col">
                            <span className="text-xs text-brown-300 line-through font-bold">₹{b.original_price}</span>
                            <span className="font-black text-accent text-lg">₹{b.final_price}</span>
                          </div>
                        </td>
                        <td className="py-8 px-10 text-right">
                          <button
                            onClick={() => navigate(`/edit-bundle/${b.id}`)}
                            className={`px-5 py-2.5 border-2 font-black text-[10px] rounded-xl uppercase tracking-widest hover:border-primary hover:text-primary transition-all shadow-sm ${
                              theme === "dark" ? "bg-white/5 border-white/10 text-white" : "bg-white border-brown-50 text-brown-400"
                            }`}
                          >
                            Edit Bundle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "messages" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* MESSAGES / CONTACTS SECTION */}
            <div className="flex justify-between items-center mb-6 px-4">
              <div>
                <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                  Customer Transmissions
                </h2>
                <p className="text-accent font-black uppercase text-[9px] tracking-widest mt-1">
                  Inbound Support & Inquiry Signals
                </p>
              </div>
            </div>

            <div className={`rounded-[3rem] shadow-luxury border overflow-hidden ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-100"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b ${theme === "dark" ? "bg-[#120B0B] border-white/5" : "bg-secondary/20 border-brown-50"}`}>
                      <th className="py-6 px-10 text-[10px] uppercase font-black text-brown-400 tracking-widest">Sender Signature</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Communication Payload</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-brown-50"}`}>
                    {contacts.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-20 text-center text-brown-300 font-bold uppercase text-[10px] tracking-widest">
                          No communication signals detected.
                        </td>
                      </tr>
                    ) : (
                      contacts.map((c) => (
                        <tr key={c.id} className={`transition-all ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-secondary/10"}`}>
                          <td className="py-8 px-10">
                            <p className={`font-black text-sm mb-0.5 uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                              {c.name}
                            </p>
                            <p className="text-xs text-brown-400 font-bold lowercase">{c.email}</p>
                          </td>
                          <td className="py-8 max-w-lg">
                            <p className={`text-xs font-bold leading-relaxed ${theme === "dark" ? "text-brown-200" : "text-brown-500"}`}>
                              {c.message}
                            </p>
                          </td>
                          <td className="py-8">
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                              {new Date(c.created_at).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FEEDBACK SECTION */}
            <div className="flex justify-between items-center mb-6 px-4 pt-12">
              <div>
                <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                  Operation Feedback
                </h2>
                <p className="text-accent font-black uppercase text-[9px] tracking-widest mt-1">
                  Artisan Service Experience Analytics
                </p>
              </div>
            </div>

            <div className={`rounded-[3rem] shadow-luxury border overflow-hidden ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-100"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b ${theme === "dark" ? "bg-[#120B0B] border-white/5" : "bg-secondary/20 border-brown-50"}`}>
                      <th className="py-6 px-10 text-[10px] uppercase font-black text-brown-400 tracking-widest">Artisan Alias</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Experience Report</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Sentiment Score</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-brown-50"}`}>
                    {feedbackList.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-20 text-center text-brown-300 font-bold uppercase text-[10px] tracking-widest">
                          No experience reports synchronized.
                        </td>
                      </tr>
                    ) : (
                      feedbackList.map((f) => (
                        <tr key={f.id} className={`transition-all ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-secondary/10"}`}>
                          <td className="py-8 px-10">
                            <p className={`font-black text-sm mb-0.5 uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                              {f.user_name || "Anonymous Artisan"}
                            </p>
                            <p className="text-xs text-accent font-black uppercase tracking-tighter">{f.subject}</p>
                          </td>
                          <td className="py-8 max-w-lg">
                            <p className={`text-xs font-bold leading-relaxed ${theme === "dark" ? "text-brown-200" : "text-brown-500"}`}>
                              {f.message}
                            </p>
                          </td>
                          <td className="py-8">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <HiOutlineAnnotation key={i} className={`text-lg ${i < f.rating ? 'text-accent' : 'text-brown-100'}`} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PRODUCT REVIEWS SECTION */}
            <div className="flex justify-between items-center mb-6 px-4 pt-12">
              <div>
                <h2 className={`text-2xl font-black uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                  Artifact Reviews
                </h2>
                <p className="text-accent font-black uppercase text-[9px] tracking-widest mt-1">
                  Granular Product Sentiment Logs
                </p>
              </div>
            </div>

            <div className={`rounded-[3rem] shadow-luxury border overflow-hidden ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-100"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b ${theme === "dark" ? "bg-[#120B0B] border-white/5" : "bg-secondary/20 border-brown-50"}`}>
                      <th className="py-6 px-10 text-[10px] uppercase font-black text-brown-400 tracking-widest">Subject Item</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Review Content</th>
                      <th className="py-6 text-[10px] uppercase font-black text-brown-400 tracking-widest">Quality Rating</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === "dark" ? "divide-white/5" : "divide-brown-50"}`}>
                    {reviewsList.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-20 text-center text-brown-300 font-bold uppercase text-[10px] tracking-widest">
                          No product sentiment logs archived.
                        </td>
                      </tr>
                    ) : (
                      reviewsList.map((r) => {
                        const prod = products.find(p => p.id === r.product_id);
                        return (
                          <tr key={r.id} className={`transition-all ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-secondary/10"}`}>
                            <td className="py-8 px-10">
                              <p className={`font-black text-sm mb-0.5 uppercase tracking-tighter ${theme === "dark" ? "text-secondary" : "text-primary"}`}>
                                {prod?.name || "Unknown Product"}
                              </p>
                              <p className="text-[10px] text-brown-400 font-black uppercase tracking-widest">ID: {r.id.slice(0,8)}</p>
                            </td>
                            <td className="py-8 max-w-lg">
                              <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">{r.user_name}</p>
                              <p className={`text-xs font-bold leading-relaxed ${theme === "dark" ? "text-brown-200" : "text-brown-500"}`}>
                                {r.comment}
                              </p>
                            </td>
                            <td className="py-8">
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <HiOutlineSparkles key={i} className={`text-lg ${i < r.rating ? 'text-accent' : 'text-brown-100'}`} />
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
