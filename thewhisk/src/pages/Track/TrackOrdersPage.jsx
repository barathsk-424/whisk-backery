import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import useStore from "../../store/useStore";
import {
  HiOutlineShoppingBag,
  HiOutlineLocationMarker,
  HiOutlineMap,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineRefresh,
  HiOutlineDocumentText,
} from "react-icons/hi";

export default function TrackOrdersPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, authInitialized, orders, fetchOrders, theme } =
    useStore();
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (authInitialized && isAuthenticated) {
      setLoading(true);
      fetchOrders().finally(() => setLoading(false));

      // ─── ARTISAN LIVE SYNCHRONIZATION ENGINE ──────────────
      const uID = user.id || user.sub;
      console.log("Artisan Pulse → Initializing Secure Channel for:", uID);

      const channel = supabase
        .channel(`artisan-pulse-${uID}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            // We use manual filtering in the callback for maximum reliability across different Supabase versions
          },
          (payload) => {
            // Advanced Filtering: Ensure this update belongs to the current user signature
            if (payload.new.user_id === uID) {
              console.log(
                "Artisan Pulse → Valid Transmission Received:",
                payload.new.status,
              );
              fetchOrders();
              toast.success(
                `Operational Update → Order marked as ${payload.new.status}!`,
                {
                  icon: "🚀",
                  style: {
                    borderRadius: "15px",
                    background: theme === "dark" ? "#1A1110" : "#fff",
                    color: theme === "dark" ? "#fff" : "#000",
                    fontWeight: "bold",
                  },
                },
              );
            }
          },
        )
        .subscribe(async (status) => {
          console.log("Channel Status Sync:", status);
          // Dynamic State Awareness
          const linkStatus = document.getElementById("signal-status");
          const linkDot = document.getElementById("signal-dot");
          if (linkStatus && linkDot) {
            if (status === "SUBSCRIBED") {
              linkStatus.innerText = "BROADCASTING LIVE";
              linkDot.className =
                "w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse";
            } else {
              linkStatus.innerText = "WAITING FOR SIGNAL...";
              linkDot.className = "w-1.5 h-1.5 bg-orange-400 rounded-full";
            }
          }
        });

      // Reliability Fallback: Polling (only if the socket is interrupted)
      const pollingInterval = setInterval(() => {
        if (channel.state !== "joined") {
          console.debug(
            "Artisan Pulse → Socket silent, initiating manual sync...",
          );
          fetchOrders();
        }
      }, 15000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(pollingInterval);
      };
    }
  }, [isAuthenticated, authInitialized, user]);

  if (!authInitialized) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-[#0D0807]" : "bg-secondary"}`}
      >
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className={`min-h-screen pt-32 pb-16 px-6 flex flex-col items-center justify-center text-center ${theme === "dark" ? "bg-[#0D0807]" : "bg-secondary"}`}
      >
        <span className="text-6xl mb-6">🔒</span>
        <h2
          className={`font-heading text-3xl font-black mb-4 ${theme === "dark" ? "text-white" : "text-primary"}`}
        >
          Login Required
        </h2>
        <p className="text-brown-400 max-w-sm mb-8 font-bold">
          Please login to view your order history and track deliveries live.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="px-8 py-3.5 bg-accent text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-transform"
        >
          LOG IN TO TRACK
        </button>
      </div>
    );
  }

  const STATUS_MAP = {
    pending: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      dot: "bg-gray-400",
      label: "Pending Audit",
    },
    "order confirmed": {
      bg: "bg-blue-100",
      text: "text-blue-600",
      dot: "bg-blue-400",
      label: "Order Confirmed",
    },
    preparing: {
      bg: "bg-orange-100",
      text: "text-orange-600",
      dot: "bg-orange-400",
      label: "Artisan Baking",
    },
    "out for delivery": {
      bg: "bg-purple-100",
      text: "text-purple-600",
      dot: "bg-purple-400",
      label: "Out for Delivery",
    },
    delivered: {
      bg: "bg-green-100",
      text: "text-green-600",
      dot: "bg-green-500",
      label: "Delivered",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-600",
      dot: "bg-red-500",
      label: "Cancelled",
    },
  };

  const statusStyle = (s) =>
    STATUS_MAP[s?.toLowerCase()] || STATUS_MAP["pending"];

  return (
    <div
      className={`min-h-screen pt-24 pb-12 transition-colors duration-500 ${theme === "dark" ? "bg-[#0D0807]" : "bg-secondary"}`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div>
            <h1
              className={`font-heading text-4xl font-black flex items-center gap-3 ${theme === "dark" ? "text-white" : "text-primary"}`}
            >
              <span className="p-3 bg-accent text-white rounded-2xl shadow-xl shadow-accent/20">
                <HiOutlineShoppingBag />
              </span>
              Order Archival
            </h1>
            <p className="text-brown-400 mt-2 font-black uppercase text-[10px] tracking-widest">
              Temporal records and live status synchronization.
            </p>
          </div>

          <div className="flex gap-4">
            <div
              className={`px-5 py-3 rounded-2xl border flex items-center gap-3 ${
                theme === "dark"
                  ? "bg-[#1A1110] border-white/5 text-white"
                  : "bg-white border-brown-50 text-primary"
              }`}
            >
              <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-white/10 shrink-0">
                <span
                  id="signal-dot"
                  className="w-1.5 h-1.5 bg-orange-400 rounded-full"
                />
                <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">
                  Signal: <span id="signal-status">Waiting...</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Order List */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div
                className={`rounded-3xl p-16 text-center border shadow-sm ${theme === "dark" ? "bg-[#1A1110] border-white/5" : "bg-white border-brown-100"}`}
              >
                <span className="text-6xl block mb-6">📦</span>
                <h3
                  className={`font-heading text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-primary"}`}
                >
                  Archive is empty
                </h3>
                <p className="text-brown-400 mb-8 max-w-xs mx-auto text-sm font-bold uppercase tracking-tight">
                  No transmissions detected. Begin your acquisition journey
                  below.
                </p>
                <button
                  onClick={() => navigate("/menu")}
                  className="px-8 py-3 bg-accent text-white font-black rounded-2xl shadow-lg uppercase text-xs tracking-widest"
                >
                  Explore Repository
                </button>
              </div>
            ) : (
              orders.map((order) => {
                const style = statusStyle(order.status);
                const orderItems = order.items || [];
                const isActive = selectedOrder?.id === order.id;

                return (
                  <motion.div
                    key={order.id}
                    layoutId={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`rounded-[2.5rem] p-8 shadow-luxury border cursor-pointer transition-all ${
                      isActive ? "ring-2 ring-accent bg-accent/5" : ""
                    } ${theme === "dark" ? "bg-[#1A1110] border-white/5 hover:bg-[#251918]" : "bg-white border-brown-100 hover:shadow-2xl"}`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-[10px] text-brown-300 font-black uppercase tracking-[0.2em] mb-2 leading-none">
                          Transmission #{order.id.split("-")[0]}
                        </p>
                        <h3
                          className={`font-black uppercase text-sm ${theme === "dark" ? "text-white" : "text-primary"}`}
                        >
                          {orderItems[0]?.name || "Custom Piece"}{" "}
                          {orderItems.length > 1
                            ? `+ ${orderItems.length - 1} more`
                            : ""}
                        </h3>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${style.bg} ${style.text}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`}
                        />
                        {style.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[9px] font-black text-brown-300 uppercase tracking-widest mb-1">
                          Total Payload
                        </p>
                        <p
                          className={`text-sm font-black ${theme === "dark" ? "text-white" : "text-primary"}`}
                        >
                          ₹{order.total_price?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-brown-300 uppercase tracking-widest mb-1">
                          Time Lock
                        </p>
                        <p
                          className={`text-sm font-black ${theme === "dark" ? "text-white" : "text-primary"}`}
                        >
                          {order.delivery_date}
                        </p>
                      </div>
                      <div className="hidden lg:block lg:text-right">
                        <p className="text-[9px] font-black text-brown-300 uppercase tracking-widest mb-1">
                          Financial State
                        </p>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                              order.payment_status?.toLowerCase() === "paid"
                                ? "bg-green-500/10 text-green-500"
                                : order.payment_status?.toLowerCase() ===
                                    "refunded"
                                  ? "bg-orange-500/10 text-orange-500"
                                  : "bg-gray-500/10 text-gray-500"
                            }`}
                          >
                            {order.payment_status || "Pending"}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/invoice/${order.id}`);
                            }}
                            className="text-[9px] font-black text-accent uppercase tracking-[0.2em] hover:underline flex items-center gap-1"
                          >
                            <HiOutlineDocumentText className="text-sm" />{" "}
                            Invoice
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Map & Detailed Tracker */}
          <div className="sticky top-32 space-y-8">
            <AnimatePresence mode="wait">
              {selectedOrder ? (
                <motion.div
                  key={selectedOrder.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  {/* Financial Detail Card */}
                  <div
                    className={`p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden transition-all duration-700 ${
                      theme === "dark"
                        ? "bg-[#1A1110] border-white/5"
                        : "bg-white border-brown-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div>
                        <h3
                          className={`font-black text-xl tracking-tighter uppercase mb-1 ${theme === "dark" ? "text-white" : "text-primary"}`}
                        >
                          Financial Intelligence
                        </h3>
                        <p className="text-[10px] font-bold text-brown-400 uppercase tracking-widest">
                          Encrypted transaction signal verified
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-3xl text-2xl ${theme === "dark" ? "bg-white/5 text-accent" : "bg-secondary text-accent"}`}
                      >
                        <HiOutlineCreditCard />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative z-10">
                      <div
                        className={`p-5 rounded-3xl border ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-secondary/50 border-transparent"}`}
                      >
                        <p className="text-[8px] font-black uppercase text-brown-300 mb-2">
                          Payment ID
                        </p>
                        <p
                          className={`text-[10px] font-mono font-bold break-all ${theme === "dark" ? "text-white/80" : "text-primary"}`}
                        >
                          {selectedOrder.payment_id || "LOCAL_SIGNAL_0X1"}
                        </p>
                      </div>
                      <div
                        className={`p-5 rounded-3xl border ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-secondary/50 border-transparent"}`}
                      >
                        <p className="text-[8px] font-black uppercase text-brown-300 mb-2">
                          Acquisition Status
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${selectedOrder.payment_status?.toLowerCase() === "paid" ? "bg-green-500" : "bg-orange-500"} animate-pulse`}
                          />
                          <p
                            className={`text-xs font-black uppercase ${theme === "dark" ? "text-white" : "text-primary"}`}
                          >
                            {selectedOrder.payment_status || "Unverified"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`p-5 rounded-3xl border ${theme === "dark" ? "bg-white/5 border-white/5" : "bg-secondary/50 border-transparent"}`}
                      >
                        <p className="text-[8px] font-black uppercase text-brown-300 mb-2">
                          Refund Archives
                        </p>
                        <div className="flex items-center gap-2">
                          <HiOutlineRefresh
                            className={`text-sm ${selectedOrder.refund_status?.toLowerCase() === "completed" ? "text-orange-500" : "text-brown-200"}`}
                          />
                          <p
                            className={`text-xs font-black uppercase ${theme === "dark" ? "text-white" : "text-primary"}`}
                          >
                            {selectedOrder.refund_status || "No Records"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/invoice/${selectedOrder.id}`)}
                        className="md:col-span-3 flex items-center justify-center gap-2 py-4 bg-accent/10 text-accent font-black rounded-2xl hover:bg-accent/20 transition-all uppercase tracking-widest text-[10px]"
                      >
                        <HiOutlineDocumentText className="text-lg" /> Access
                        Financial Invoice (PDF)
                      </button>
                    </div>

                    {/* Abstract background glow */}
                    <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />
                  </div>

                  {/* Map Mock */}
                  <div
                    className={`rounded-[3rem] overflow-hidden border shadow-luxury relative ${
                      theme === "dark"
                        ? "bg-[#1A1110] border-white/5"
                        : "bg-white border-brown-100"
                    }`}
                  >
                    <div className="h-80 w-full relative bg-secondary/50 grayscale-[0.5] brightness-90 flex items-center justify-center overflow-hidden">
                      {/* Stylish Background Pattern */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage:
                            "radial-gradient(#4A2A1A 1px, transparent 1px)",
                          backgroundSize: "20px 20px",
                        }}
                      />

                      {/* Coordinate Grid Lines */}
                      <div
                        className="absolute inset-0 border-[40px] border-transparent opacity-5"
                        style={{
                          backgroundImage:
                            "linear-gradient(to right, #4A2A1A 1px, transparent 1px), linear-gradient(to bottom, #4A2A1A 1px, transparent 1px)",
                          backgroundSize: "40px 40px",
                        }}
                      />

                      <div className="relative scale-125 z-10">
                        <div className="w-16 h-16 bg-accent/20 rounded-full animate-ping absolute -inset-2" />
                        <div className="w-12 h-12 bg-white rounded-full p-2 relative shadow-2xl flex items-center justify-center text-3xl">
                          🧁
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10">
                        <p className="text-[8px] font-black text-white uppercase tracking-[0.3em] mb-1">
                          Signal Locked
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-white/60 font-mono">
                          <span>LAT: 28.6139° N</span>
                          <span>LON: 77.2090° E</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-accent/10 text-accent rounded-2xl text-2xl">
                          <HiOutlineLocationMarker />
                        </div>
                        <div>
                          <h3
                            className={`text-xl font-black ${theme === "dark" ? "text-white" : "text-primary"}`}
                          >
                            Delivery Coordinates
                          </h3>
                          <p className="text-xs font-bold text-brown-400 capitalize">
                            {selectedOrder.status} - Signal is secure.
                          </p>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-secondary/30 border border-brown-50/50">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brown-300 mb-3 ml-1">
                          Archive Destination
                        </p>
                        <p
                          className={`text-sm font-bold leading-relaxed ${theme === "dark" ? "text-white/80" : "text-primary"}`}
                        >
                          {selectedOrder.delivery_details?.address ||
                            "Loading encrypted delivery path..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div
                  className={`p-20 rounded-[3rem] text-center border-2 border-dashed border-brown-100/30 flex flex-col items-center justify-center h-[600px] ${
                    theme === "dark" ? "bg-white/5" : "bg-white/50"
                  }`}
                >
                  <div className="text-8xl mb-10 grayscale-[0.8] opacity-10 animate-bounce cursor-default">
                    🛸
                  </div>
                  <h4 className="text-sm font-black text-brown-400 uppercase tracking-[0.5em] mb-4">
                    Initialize Intelligence
                  </h4>
                  <p className="text-[10px] font-black text-brown-300 uppercase leading-relaxed max-w-[200px] mx-auto opacity-50">
                    Select an archival record to restore the full temporal and
                    financial signal.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
