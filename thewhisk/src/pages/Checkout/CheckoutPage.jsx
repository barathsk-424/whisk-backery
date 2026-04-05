import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/useStore";
import {
  HiOutlineBadgeCheck,
  HiOutlineCreditCard,
  HiOutlineArrowLeft,
} from "react-icons/hi";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getCartTotal, placeOrder, user, profile, fetchOrders, theme } =
    useStore();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [delivery, setDelivery] = useState({
    name: profile?.full_name || user?.user_metadata?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    city: profile?.city || "",
    pincode: profile?.pincode || "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "Afternoon (12PM–4PM)",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (profile) {
      setDelivery((prev) => ({
        ...prev,
        name: prev.name || profile.full_name || "",
        phone: prev.phone || profile.phone || "",
        address: prev.address || profile.address || "",
        city: prev.city || profile.city || "",
        pincode: prev.pincode || profile.pincode || "",
      }));
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDelivery((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!delivery.name) newErrors.name = "Name is required";
    if (!delivery.phone || delivery.phone.length < 10)
      newErrors.phone = "Valid 10-digit phone required";
    if (!delivery.address) newErrors.address = "Address is required";
    if (!delivery.city) newErrors.city = "City is required";
    if (!delivery.pincode || delivery.pincode.length < 6)
      newErrors.pincode = "Valid 6-digit pincode required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please login to place an order");
      navigate("/login");
      return;
    }
    if (cart.length === 0) return toast.error("Your cart is empty");
    if (!validate()) return toast.error("Please fix delivery details");

    setLoading(true);
    const tid = toast.loading("Connecting to secure gateway...");

    try {
      let razorpayResponse = null;

      if (paymentMethod === "online") {
        try {
          razorpayResponse = await useStore
            .getState()
            .initiateRazorpayPayment(getCartTotal(), "payment_" + Date.now());
          toast.success("Payment Verified!", { id: tid });
        } catch (payErr) {
          toast.error("Payment was not completed", { id: tid });
          setLoading(false);
          return;
        }
      } else {
        toast.loading("Confirming your order...", { id: tid });
      }

      const payload = {
        payment_method:
          paymentMethod === "online"
            ? "Razorpay (UPI/Card)"
            : "Cash on Delivery",
        payment_status: paymentMethod === "online" ? "Paid" : "Pending",
        delivery_details: delivery,
        delivery_date: delivery.date,
        delivery_time: delivery.timeSlot,
        notes: delivery.notes,
        status: "Pending",
        payment_id: razorpayResponse?.razorpay_payment_id || null,
      };

      await placeOrder(payload);

      toast.success("Artisan order confirmed! 🎉", { id: tid, duration: 5000 });
      setTimeout(() => navigate("/order-success"), 1500);
    } catch (err) {
      console.error("Order Error:", err);
      toast.error("Order failed. Please try again.", { id: tid });
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div
      className={`min-h-screen pt-24 pb-12 px-6 transition-colors duration-500 ${theme === "dark" ? "bg-[#0D0807]" : "bg-secondary"}`}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={() => navigate("/cart")}
              className="flex items-center gap-2 text-brown-400 hover:text-accent font-black text-xs uppercase tracking-widest transition-all"
            >
              <HiOutlineArrowLeft /> Modify Cart
            </button>
            <h1
              className={`text-4xl font-black tracking-tighter ${theme === "dark" ? "text-white" : "text-primary"}`}
            >
              Secure Checkout
            </h1>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              {/* Delivery Details */}
              <div
                className={`p-10 rounded-[3rem] border shadow- luxury relative overflow-hidden transition-all ${
                  theme === "dark"
                    ? "bg-[#1A1110] border-white/5"
                    : "bg-white border-brown-50"
                }`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl">
                  🚚
                </div>
                <h3
                  className={`text-xl font-black mb-8 flex items-center gap-3 ${theme === "dark" ? "text-white" : "text-primary"}`}
                >
                  <span className="p-3 bg-accent text-white rounded-2xl shadow-lg shadow-accent/20">
                    📍
                  </span>
                  Destination Port
                </h3>

                <div className="grid md:grid-cols-2 gap-6 relative z-10">
                  {[
                    { l: "Full Name", n: "name", p: "Name of receiver" },
                    { l: "Phone Number", n: "phone", p: "Contact digit" },
                    { l: "City", n: "city", p: "Delivery city" },
                    { l: "Pincode", n: "pincode", p: "Area code" },
                  ].map((field) => (
                    <div key={field.n} className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-brown-300 tracking-[0.2em] ml-1">
                        {field.l}
                      </label>
                      <input
                        name={field.n}
                        value={delivery[field.n]}
                        onChange={handleChange}
                        placeholder={field.p}
                        className={`w-full p-4 rounded-2xl font-bold border-2 transition-all focus:scale-[1.02] ${
                          theme === "dark"
                            ? "bg-white/5 border-white/10 text-white focus:border-accent/40"
                            : "bg-secondary/50 border-transparent text-primary focus:border-accent/30"
                        } ${errors[field.n] ? "border-red-500" : ""}`}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-brown-300 tracking-[0.2em] ml-1">
                      Shipping Address
                    </label>
                    <textarea
                      name="address"
                      value={delivery.address}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Detailed house/street address..."
                      className={`w-full p-4 rounded-3xl font-bold border-2 transition-all focus:scale-[1.01] resize-none ${
                        theme === "dark"
                          ? "bg-white/5 border-white/10 text-white focus:border-accent/40"
                          : "bg-secondary/50 border-transparent text-primary focus:border-accent/30"
                      } ${errors.address ? "border-red-500" : ""}`}
                    />
                  </div>
                </div>
              </div>

              {/* Timing */}
              <div className="grid md:grid-cols-2 gap-8">
                <div
                  className={`p-8 rounded-[2.5rem] border transition-all ${
                    theme === "dark"
                      ? "bg-[#1A1110] border-white/5"
                      : "bg-white border-brown-50"
                  }`}
                >
                  <h4
                    className={`font-black mb-6 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-primary"}`}
                  >
                    📅 Schedule
                  </h4>
                  <input
                    type="date"
                    name="date"
                    value={delivery.date}
                    onChange={handleChange}
                    min={today}
                    className={`w-full p-4 rounded-xl font-bold ${theme === "dark" ? "bg-white/5 text-white border-white/10" : "bg-secondary/50 border-transparent text-primary"}`}
                  />
                </div>
                <div
                  className={`p-8 rounded-[2.5rem] border transition-all ${
                    theme === "dark"
                      ? "bg-[#1A1110] border-white/5"
                      : "bg-white border-brown-50"
                  }`}
                >
                  <h4
                    className={`font-black mb-6 flex items-center gap-2 ${theme === "dark" ? "text-white" : "text-primary"}`}
                  >
                    🏷️ Instructions
                  </h4>
                  <textarea
                    name="notes"
                    placeholder="Any special requests?"
                    onChange={handleChange}
                    className={`w-full p-4 rounded-xl font-bold h-[100px] resize-none ${theme === "dark" ? "bg-white/5 text-white border-white/10" : "bg-secondary/50 border-transparent text-primary"}`}
                  />
                </div>
              </div>
            </div>

            {/* Payment & Summary */}
            <div className="space-y-8">
              <div
                className={`p-10 rounded-[3rem] border transition-all ${
                  theme === "dark"
                    ? "bg-[#1A1110] border-white/5"
                    : "bg-white border-brown-50"
                }`}
              >
                <h3
                  className={`text-xl font-black mb-8 ${theme === "dark" ? "text-white" : "text-primary"}`}
                >
                  Settlement
                </h3>
                <div className="space-y-4 mb-10">
                  {[
                    {
                      id: "online",
                      l: "Secure Online",
                      desc: "UPI, Card, Google Pay",
                      icon: "💳",
                    },
                    {
                      id: "cod",
                      l: "Cash Payment",
                      desc: "Pay on arrival",
                      icon: "💵",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`w-full p-5 rounded-3xl border-2 flex items-center gap-4 transition-all ${
                        paymentMethod === opt.id
                          ? "border-accent bg-accent/5"
                          : theme === "dark"
                            ? "border-white/5 hover:border-white/20"
                            : "border-secondary hover:border-brown-100"
                      }`}
                    >
                      <span className="text-3xl">{opt.icon}</span>
                      <div className="text-left">
                        <p
                          className={`font-black text-sm uppercase ${theme === "dark" ? "text-white" : "text-primary"}`}
                        >
                          {opt.l}
                        </p>
                        <p className="text-[10px] font-bold text-brown-300">
                          {opt.desc}
                        </p>
                      </div>
                      {paymentMethod === opt.id && (
                        <div className="ml-auto w-3 h-3 bg-accent rounded-full animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>

                <div
                  className={`p-6 rounded-2xl mb-8 flex justify-between items-center ${theme === "dark" ? "bg-white/5" : "bg-secondary/50"}`}
                >
                  <p
                    className={`font-black text-xs uppercase ${theme === "dark" ? "text-white/60" : "text-brown-400"}`}
                  >
                    Total Due
                  </p>
                  <p className="text-3xl font-black text-accent">
                    ₹{getCartTotal().toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-5 gradient-accent text-white font-black rounded-3xl shadow-luxury hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all uppercase tracking-widest text-sm"
                >
                  {loading
                    ? "Securing Connection..."
                    : "Initiate Settlement 🚀"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
