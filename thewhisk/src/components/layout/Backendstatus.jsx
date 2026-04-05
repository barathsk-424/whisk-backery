import { useState, useEffect } from "react";
import { checkBackendHealth } from "../../lib/orderApi";
import { motion, AnimatePresence } from "framer-motion";

export default function BackendStatus() {
  const [status, setStatus] = useState("checking");
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const health = await checkBackendHealth();
        setStatus(health.online ? "online" : "offline");
        setDetails(health);
      } catch (err) {
        setStatus("offline");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex items-center gap-2 group pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)] ${
          status === "online"
            ? "bg-green-500"
            : status === "offline"
              ? "bg-red-500 animate-pulse"
              : "bg-yellow-500 animate-bounce"
        }`}
      />
      <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-brown-100 shadow-luxury text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto">
        {status === "online" ? (
          <span className="flex items-center gap-2">
            Artisan Backend Linked
            <span className="text-[8px] opacity-40">
              MDB: {details?.mongodb || "N/A"}
            </span>
          </span>
        ) : status === "offline" ? (
          "Backend Silent (Supabase Fallback)"
        ) : (
          "Syncing Vault..."
        )}
      </div>
    </div>
  );
}
