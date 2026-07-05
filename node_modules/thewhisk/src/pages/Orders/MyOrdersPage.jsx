import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import useStore from "../../store/useStore";

const STATUS_COLORS = {
  placed: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-400" },
  preparing: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    dot: "bg-orange-400",
  },
  "out for delivery": {
    bg: "bg-purple-50",
    text: "text-purple-600",
    dot: "bg-purple-400",
  },
  delivered: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-500" },
};

function statusStyle(status = "") {
  return (
    STATUS_COLORS[status.toLowerCase()] || {
      bg: "bg-gray-50",
      text: "text-gray-600",
      dot: "bg-gray-400",
    }
  );
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { user, fetchOrders, orders, clearOrders } = useStore();
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) await fetchOrders();
      setLoading(false);
    };
    loadData();

    if (!user) return;

    // Real-time updates subscription
    const channel = supabase
      .channel("my-orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchOrders();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchOrders]);

  const handleDownload = (order) => {
    const productName =
      order.products?.name || order.product_name || "Cake Product";
    const lines = [
      "── THE WHISK – RECEIPT ─────────",
      `Order  : ${order.id}`,
      `Date   : ${new Date(order.created_at).toLocaleString()}`,
      `Status : ${order.status || "Pending"}`,
      "",
      "Items:",
      `  • ${productName} x${order.quantity}  ₹${order.total_price?.toLocaleString() || order.price?.toLocaleString()}`,
      "",
      order.address?.line1
        ? `Address: ${order.address?.line1}, ${order.address?.city}`
        : "",
      `TOTAL  : ₹${order.total_price?.toLocaleString() || order.price?.toLocaleString()}`,
      "─────────────────────────────────",
      "Thank you for choosing The Whisk!",
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TheWhisk_${order.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded!");
  };

  const filtered =
    filter === "all"
      ? orders
      : orders.filter((o) => (o.status || "placed").toLowerCase() === filter);

  const totalSpent = orders.reduce(
    (s, o) => s + (o.total_price || o.price || 0),
    0,
  );
  const delivered = orders.filter(
    (o) => (o.status || "").toLowerCase() === "delivered",
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-brown-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-brown-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="font-heading text-4xl font-bold text-primary">
              🛍️ My Orders
            </h1>
            <p className="text-brown-400 mt-2">
              Track all your delicious cake orders in one place.
            </p>
          </div>
          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={clearOrders}
                className="px-4 py-2 border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-sm shadow-sm transition-colors self-start sm:self-auto w-full sm:w-auto"
              >
                Clear Order History
              </button>
              <button
                onClick={() => {
                  const API =
                    import.meta.env.VITE_API_URL ||
                    "https://whisk-backery.onrender.com";
                  toast.promise(
                    fetch(`${API}/api/orders`)
                      .then((res) => res.json())
                      .then((data) => {
                        console.log("Artisan Backend Raw Data:", data);
                        return data;
                      }),
                    {
                      loading: "Syncing with Artisan Vault...",
                      success: "Data synchronized! Check console for raw logs.",
                      error:
                        "Vault sync failed. Falling back to local archive.",
                    },
                  );
                }}
                className="px-4 py-2 border border-accent/20 text-accent bg-accent/5 hover:bg-accent/10 rounded-xl font-bold text-sm shadow-sm transition-colors self-start sm:self-auto w-full sm:w-auto flex items-center gap-2"
              >
                🔄 Test API
              </button>
            </div>
          )}
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Orders", value: orders.length, icon: "📦" },
            { label: "Delivered", value: delivered, icon: "✅" },
            {
              label: "Total Spent",
              value: `₹${totalSpent.toLocaleString()}`,
              icon: "💰",
            },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-brown-100 text-center"
            >
              <p className="text-2xl mb-1">{kpi.icon}</p>
              <p className="font-heading text-2xl font-bold text-primary">
                {kpi.value}
              </p>
              <p className="text-xs text-brown-400 mt-0.5">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "placed", "preparing", "out for delivery", "delivered"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition-all border ${
                  filter === f
                    ? "gradient-accent text-white border-transparent shadow-md shadow-accent/20"
                    : "bg-white border-brown-100 text-brown-400 hover:border-accent/40 hover:text-primary"
                }`}
              >
                {f === "all" ? "🗂 All" : f}
              </button>
            ),
          )}
        </div>

        {/* Orders List */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-16 text-center shadow-sm border border-brown-100 flex flex-col items-center"
            >
              <p className="text-6xl mb-4">🍰</p>
              <h3 className="font-heading text-xl font-bold text-primary mb-2">
                No orders found
              </h3>
              <p className="text-sm text-brown-400 mb-6 font-medium max-w-sm">
                {filter === "all"
                  ? "Looks like you haven't placed any orders. Start baking your dream cake!"
                  : `You have no ${filter} orders currently.`}
              </p>
              <button
                onClick={() => navigate("/menu")}
                className="px-8 py-3.5 gradient-accent text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-accent/20 flex items-center gap-2"
              >
                Browse Menu <span>→</span>
              </button>
            </motion.div>
          ) : (
            filtered.map((order, idx) => {
              const style = statusStyle(order.status);
              const isOpen = expandedId === order.id;

              const productName =
                order.products?.name || order.product_name || "Custom Cake";
              const imageUrl =
                order.products?.image ||
                order.image_url ||
                "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&h=200&fit=crop";
              const orderTotal = order.total_price || order.price || 0;

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                  className="bg-white rounded-3xl shadow-sm border border-brown-100 overflow-hidden mb-4 hover:border-brown-200 transition-colors"
                >
                  <button
                    className="w-full text-left p-4 sm:p-6"
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                  >
                    <div className="flex items-center gap-4 sm:gap-5">
                      <img
                        src={imageUrl}
                        alt="cake"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-brown-50 shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <div className="min-w-0">
                            <p className="font-bold text-primary leading-tight line-clamp-1 sm:text-lg">
                              {productName}
                              {order.quantity > 1 && (
                                <span className="ml-2 text-xs text-brown-400 font-medium bg-brown-100/50 px-2 py-0.5 rounded-full">
                                  x{order.quantity}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] sm:text-xs text-brown-400 mt-1 font-mono bg-brown-50 inline-block px-1.5 py-0.5 rounded">
                              #{order.id.toString().split("-")[0]}
                            </p>
                          </div>
                          <span
                            className={`flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 sm:py-1.5 rounded-full shrink-0 ${style.bg} ${style.text} capitalize`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`}
                            />
                            {order.status || "Placed"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 sm:mt-2">
                          <p className="text-[11px] sm:text-xs text-brown-400 font-medium">
                            {new Date(
                              order.created_at || order.date,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="font-extrabold text-accent text-sm sm:text-base">
                            ₹{orderTotal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        className="text-brown-300 shrink-0 text-lg sm:text-2xl hidden sm:block"
                      >
                        ⌄
                      </motion.span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-brown-50"
                      >
                        <div className="p-4 sm:p-6 space-y-4 bg-brown-50/40">
                          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-brown-50 shadow-sm">
                            <div className="flex-1">
                              <p className="font-bold text-primary text-sm">
                                {productName}
                              </p>
                              <p className="text-xs text-brown-400 mt-1">
                                Qty: {order.quantity}
                              </p>
                            </div>
                            <p className="font-bold text-sm text-primary">
                              ₹{orderTotal.toLocaleString()}
                            </p>
                          </div>

                          {order.address &&
                            Object.keys(order.address).length > 0 && (
                              <div className="flex gap-3 text-sm text-brown-500 bg-white p-4 rounded-2xl border border-brown-50 shadow-sm">
                                <span className="text-lg">📍</span>
                                <div>
                                  <p className="font-bold text-primary text-xs mb-0.5">
                                    Delivery Address
                                  </p>
                                  <p className="text-xs">
                                    {order.address.line1}, {order.address.city}{" "}
                                    – {order.address.pincode}
                                  </p>
                                </div>
                              </div>
                            )}

                          <div className="flex gap-3 pt-2">
                            {order.status !== "delivered" && (
                              <button
                                onClick={() => {
                                  localStorage.setItem(
                                    "lastOrder",
                                    JSON.stringify(order),
                                  );
                                  navigate("/track-order");
                                }}
                                className="flex-1 py-2.5 sm:py-3 gradient-accent text-white font-bold rounded-xl text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-md shadow-accent/20"
                              >
                                🛵 Track Live
                              </button>
                            )}
                            <button
                              onClick={() => handleDownload(order)}
                              className="flex-1 py-2.5 sm:py-3 bg-white border border-brown-200 text-primary font-bold rounded-xl text-xs sm:text-sm hover:border-accent transition-colors shadow-sm"
                            >
                              ⬇ Download Receipt
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
