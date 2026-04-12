import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInvoiceByOrderId, downloadInvoiceAsPDF } from "../../lib/invoiceService";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import useStore from "../../store/useStore";

const InvoicePage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { theme } = useStore();

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      try {
        // 1. Recover Order Data directly from Supabase to ensure single source of truth
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();

        if (orderError) throw orderError;
        setOrder(orderData);

        // 2. Recover or Refresh Invoice Data using direct Lib access
        const { success, data: invData, error: invError } = await getInvoiceByOrderId(orderId);
        
        if (success && invData) {
          setInvoice(invData);
        } else {
          console.warn("[InvoicePage] Vault Signal Missing:", invError);
        }
      } catch (err) {
        console.error("[InvoicePage] Fatal error:", err.message);
        toast.error("Archive Acquisition Signal Failed.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchInvoiceData();
  }, [orderId]);

  const handleDownload = async () => {
    if (!invoice && !order) {
        toast.error("No data available to synthesize record.");
        return;
    }
    
    setDownloading(true);
    // Prefer Invoice record, fallback to Order record metadata
    const payload = {
        ...invoice,
        order_id: order.id,
        customer_name: order.customer_name || invoice?.customer_name || 'Artisan Guest',
        customer_email: order.user_email || invoice?.customer_email || 'guest@thewhisk.com',
        customer_phone: invoice?.customer_phone || order.phone || order.delivery_details?.phone || order.address?.phone || "",
        customer_address: invoice?.customer_address || formatAddress(order.delivery_details || order.address),
        payment_method: order.payment_method || "Online UPI",
        delivery_slot: order.delivery_time || "Priority Processing",
        total_amount: Number(order.total_price || order.amount || invoice?.total_amount || 0),
        subtotal: Number(invoice?.subtotal || (order.total_price / 1.18)),
        gst_amount: Number(invoice?.gst_amount || (order.total_price - (order.total_price / 1.18))),
        status: order.status || 'Verified'
    };

    const itemsList = Array.isArray(order.items) ? order.items : (Array.isArray(invoice?.items) ? invoice.items : []);
    const result = downloadInvoiceAsPDF(payload, itemsList);
    if (result.success) {
        toast.success("Artisan Acquisition Exported Successfully.");
    }
    setTimeout(() => setDownloading(false), 2000);
  };

  if (loading)
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-body transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-[#FFF8E7]'}`}>
        <div className="relative w-24 h-24 mb-8">
          <div className={`absolute inset-0 border-4 rounded-full ${theme === 'dark' ? 'border-white/5' : 'border-[#FF6B3522]'}`}></div>
          <div className="absolute inset-0 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🍰
          </div>
        </div>
        <p className={`font-heading font-black uppercase tracking-[0.3em] text-xs ${theme === 'dark' ? 'text-white/60' : 'text-[#4A2A1A]'}`}>
          Synchronizing Archive Signal...
        </p>
      </div>
    );

  if (!order)
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 text-center font-body transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-[#FFF8E7]'}`}>
        <div className="text-6xl mb-6">🛰️</div>
        <h2 className={`text-2xl font-black font-heading mb-4 uppercase tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'}`}>
          Signal Interrupted
        </h2>
        <p className={`mb-8 max-w-sm uppercase text-[10px] font-black tracking-widest leading-loose ${theme === 'dark' ? 'text-white/40' : 'text-[#A67C52]'}`}>
          The specified acquisition record could not be restored from the master
          vault. Return to tracking to verify order state.
        </p>
        <button
          onClick={() => navigate("/track-orders")}
          className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all ${
            theme === 'dark' ? 'bg-accent text-white' : 'bg-[#4A2A1A] text-white'
          }`}
        >
          Back to Archive
        </button>
      </div>
    );

  const formatAddress = (addr) => {
    if (!addr) return "Registered Vault Location";
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.address || addr.line1 || "",
      addr.city || "",
      addr.pincode || addr.zip || ""
    ].filter(p => p && p.trim() !== "");
    return parts.join(", ") || "Address Not Recorded";
  };

  return (
    <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-body selection:bg-accent/20 transition-all duration-500 ${
      theme === 'dark' ? 'bg-[#0A0504]' : 'bg-[#FAF9F6]'
    }`}>
      <div className="max-w-5xl mx-auto">
        {/* Control Bar: No-Print */}
        <div className="flex justify-between items-center mb-10 no-print">
            <button 
                onClick={() => navigate(-1)}
                className={`group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  theme === 'dark' ? 'text-brown-400 hover:text-white' : 'text-brown-300 hover:text-primary'
                }`}
            >
                <span className="group-hover:-translate-x-1 transition-transform">← Return to Vault</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`flex items-center gap-3 px-8 py-4 transition-all font-black uppercase text-[10px] tracking-[0.3em] rounded-full shadow-2xl ${
                downloading 
                  ? "bg-brown-100 text-brown-300 cursor-wait" 
                  : theme === 'dark' 
                    ? "bg-accent text-white hover:bg-accent-dark hover:-translate-y-1 shadow-accent/20"
                    : "bg-[#4A2A1A] text-white hover:bg-black hover:-translate-y-1"
              }`}
            >
              {downloading ? "Synthesizing Signal..." : "Download PDF Bill"}
            </button>
        </div>

        {/* PHYSICAL INVOICE CONTAINER */}
        <div className={`shadow-[0_40px_100px_rgba(0,0,0,0.06)] rounded-[2rem] md:rounded-[3rem] border p-5 md:p-20 relative overflow-hidden print:shadow-none print:border-none print:p-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-[#1A1110] border-white/5 shadow-white/5' 
            : 'bg-white border-brown-100/50 shadow-luxury'
        }`}>
             
             {/* Large Watermark Background */}
             <div className={`absolute top-6 md:top-12 right-6 md:right-12 text-[60px] md:text-[120px] font-black tracking-[-0.05em] uppercase pointer-events-none select-none z-0 transition-colors ${
               theme === 'dark' ? 'text-white/5' : 'text-[#F4F1ED]/40'
             }`}>
                INVOICE
             </div>

             {/* Header Section */}
             <div className="relative z-10 grid grid-cols-[1.5fr_1fr] gap-4 md:gap-12 mb-10 md:mb-20">
                <div className="flex items-start gap-3 md:gap-8">
                    <div className={`w-12 h-12 md:w-24 md:h-24 rounded-xl md:rounded-3xl p-1.5 md:p-3 shadow-sm shrink-0 flex items-center justify-center overflow-hidden border transition-all ${
                      theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-[#FFFBF0] border-brown-50'
                    }`}>
                        <img 
                          src="/logo.png" 
                          alt="Cupcake Logo" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            if (e.target.src.includes('/logo.png')) {
                              e.target.src = 'logo.png';
                            } else {
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = '<span class="text-2xl md:text-4xl text-inherit">🧁</span>';
                            }
                          }}
                        />
                    </div>
                    <div className="flex-1">
                        <h2 className={`text-lg md:text-3xl font-black tracking-[-0.04em] uppercase leading-[0.9] transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                        }`}>
                            THE WHISK<br/><span className="text-[#A67C52]">BAKERY</span>
                        </h2>
                        <div className={`mt-2 md:mt-4 space-y-0.5 md:space-y-1 text-[7px] md:text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                          theme === 'dark' ? 'text-white/60' : 'text-[#A67C52]'
                        }`}>
                            <p className="hidden md:block">Mannivakkam, Chennai, Tamil Nadu, 600048, India</p>
                            <p className="md:hidden">Mannivakkam, Chennai</p>
                            <div className="mt-1 md:mt-2 text-[#FF6B35] flex flex-wrap gap-x-2 md:gap-x-4">
                                <p>Ph: +91 6374618</p>
                                <p className="hidden md:block">Email: skbarath424@gmail.com</p>
                            </div>
                            <p className="font-black mt-0.5">GST: {invoice?.shop_gstin?.slice(0, 10) || "29AAAAA000"}...</p>
                        </div>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end justify-start">
                    <div className="mb-2 md:mb-4">
                        <p className={`text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mb-0.5 md:mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-brown-300'}`}>Acquisition Signal</p>
                        <p className={`text-base md:text-3xl font-black tracking-tighter uppercase transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-primary'
                        }`}>{invoice?.invoice_id || "INV-MASTER"}</p>
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                        <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-brown-300'}`}>TS: {new Date(order.created_at).toLocaleDateString()}</p>
                        <p className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest italic ${theme === 'dark' ? 'text-white/20' : 'text-brown-200'}`}>Ref: #{order.id.slice(-6).toUpperCase()}</p>
                    </div>
                </div>
             </div>

             <div className={`w-full h-[1px] mb-8 md:mb-20 transition-colors ${
               theme === 'dark' ? 'bg-white/10' : 'bg-[#F4F1ED]'
             }`}></div>

             {/* Consignee & Coordinates Grid */}
             <div className="relative z-10 grid grid-cols-[1.3fr_1fr] gap-4 md:gap-20 mb-10 md:mb-28">
                {/* Billing Card */}
                <div className={`rounded-[1.5rem] md:rounded-[2.5rem] p-4 md:p-10 border transition-all ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-[#FAF9F6] border-[#F0E6D9]/50'
                } relative overflow-hidden`}>
                    <div className="md:absolute md:top-6 md:left-10 mb-4 md:mb-0">
                        <span className={`text-[7px] md:text-[9px] font-black text-[#FF6B35] uppercase tracking-[0.2em] md:tracking-[0.4em] px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-sm transition-colors ${
                          theme === 'dark' ? 'bg-[#1A1110]' : 'bg-white'
                        }`}>Billed to Consignee</span>
                    </div>
                    <div className="md:mt-10">
                        <p className={`text-sm md:text-3xl font-black tracking-tighter uppercase mb-1 md:mb-2 transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                        }`}>{invoice?.customer_name || order.customer_name || 'Artisan Guest'}</p>
                        <p className={`text-[8px] md:text-sm font-bold lowercase mb-4 md:mb-8 transition-colors ${
                          theme === 'dark' ? 'text-white/60' : 'text-brown-400'
                        }`}>{invoice?.customer_email || order.user_email || 'Signal Lost'}</p>
                        <div className="flex items-center gap-2 md:gap-3">
                            <span className={`text-[6px] md:text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`}>Terminal:</span>
                            <span className={`text-[6px] md:text-[9px] font-black uppercase border px-2 py-0.5 md:px-3 md:py-1 rounded-[4px] md:rounded-lg transition-all ${
                              theme === 'dark' ? 'text-white bg-white/5 border-white/10' : 'text-primary bg-white border-brown-100'
                            }`}>WEB-CORE-V2</span>
                        </div>
                    </div>
                </div>

                {/* Shipment */}
                <div className="flex flex-col justify-start md:justify-center pt-2">
                    <p className={`text-[7px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.5em] mb-2 md:mb-6 ${theme === 'dark' ? 'text-white/40' : 'text-brown-400'}`}>Shipment Coordinates</p>
                    <p className={`text-[10px] md:text-lg font-black uppercase leading-tight mb-2 md:mb-4 max-w-[300px] transition-colors ${
                       theme === 'dark' ? 'text-white' : 'text-primary'
                    }`}>
                        {invoice?.customer_address || formatAddress(order.delivery_details || order.address)}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[7px] md:text-[10px] font-black text-[#FF6B35] uppercase tracking-widest pr-1">Comm-Link:</span>
                        <span className="text-[9px] md:text-sm font-black text-[#FF6B35]">
                             {invoice?.customer_phone || order.phone || order.delivery_details?.phone || order.address?.phone || "N/A"}
                        </span>
                    </div>
                </div>
             </div>

             {/* Acquisition Logic Table */}
             <div className="relative z-10 mb-12 md:mb-20 overflow-x-auto pb-4 custom-scrollbar">
                <table className="w-full min-w-[700px] border-separate border-spacing-y-4">
                    <thead>
                        <tr className={`text-[10px] md:text-xs font-black text-brown-400 uppercase tracking-[0.2em] md:tracking-[0.4em] transition-colors`}>
                            <th className="text-left pb-4 pl-4 w-1/2">Blueprint Description</th>
                            <th className="text-center pb-4">Qty</th>
                            <th className="text-right pb-4 px-6 text-nowrap">Unit Price</th>
                            <th className="text-right pb-4 pr-10 text-nowrap">Acquisition Total</th>
                        </tr>
                    </thead>
                    <tbody className="transition-colors">
                        {(order.items || invoice?.items || []).map((item, idx) => (
                            <tr key={idx} className={`group ${theme === 'dark' ? 'bg-white/5' : 'bg-secondary/10'} rounded-3xl overflow-hidden`}>
                                <td className="py-8 pl-10 rounded-l-[1.5rem]">
                                    <p className={`text-xl md:text-2xl font-black tracking-tighter uppercase leading-none mb-3 transition-colors ${
                                      theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                                    }`}>
                                        {item.name || item.product_name}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-[8px] md:text-[9px] font-black text-[#FF6B35] uppercase bg-[#FF6B35]/10 px-2.5 py-1 rounded-lg">Flavor: {item.flavor || "Chocolate"}</span>
                                        <span className={`text-[8px] md:text-[9px] font-black uppercase px-2.5 py-1 rounded-lg transition-colors ${
                                          theme === 'dark' ? 'text-brown-400 bg-black/20' : 'text-brown-300 bg-white'
                                        }`}>Shape: {item.shape || "Round"}</span>
                                    </div>
                                </td>
                                <td className={`py-8 text-center text-xs md:text-sm font-black transition-colors ${
                                  theme === 'dark' ? 'text-white/50' : 'text-brown-400'
                                }`}>{item.quantity || item.qty}</td>
                                <td className={`py-8 text-right text-xs md:text-sm font-black px-6 transition-colors ${
                                  theme === 'dark' ? 'text-white/50' : 'text-brown-400'
                                }`}>Rs.{item.price}</td>
                                <td className={`py-8 text-right text-2xl font-black tracking-tighter pr-10 rounded-r-[1.5rem] transition-colors ${
                                  theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                                }`}>
                                    Rs.{((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             {/* Settlement Summary */}
             <div className={`relative z-10 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-dashed transition-all duration-500 ${
               theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-[#FAF9F6]/30 border-brown-50'
             }`}>
                <div className="max-w-xs opacity-40">
                    <p className={`text-[9px] font-bold leading-relaxed uppercase tracking-tighter transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-brown-400'
                    }`}>
                        This digital signal serves as a formal treaty between The Whisk Bakery and the consignee. All artisanal calibrations are final upon acquisition.
                    </p>
                </div>
                      <div className="w-full md:w-[400px] flex flex-col gap-4 md:gap-6">
                    <div className={`flex justify-between items-center text-xs font-black uppercase tracking-widest pb-4 border-b transition-colors ${
                      theme === 'dark' ? 'text-white/70 border-white/10' : 'text-brown-300 border-brown-50'
                    }`}>
                        <span>Subtotal (Excl Tax)</span>
                        <span className={`text-base tracking-tighter transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-primary'
                        }`}>Rs.{invoice?.subtotal || (order.total_price / 1.18).toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between items-center text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-brown-200'}`}>
                        <span>CGST (9%)</span>
                        <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Rs.{(invoice?.gst_amount / 2 || (order.total_price * 0.09)).toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between items-center text-[10px] font-bold uppercase tracking-widest pb-6 border-b-2 border-[#FF6B35] ${theme === 'dark' ? 'text-white/60' : 'text-brown-200'}`}>
                        <span>SGST (9%)</span>
                        <span className={`text-sm transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Rs.{(invoice?.gst_amount / 2 || (order.total_price * 0.09)).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center pt-4 w-full">
                        <div>
                            <p className="text-[9px] md:text-[10px] font-black text-[#FF6B35] uppercase tracking-[0.3em] md:tracking-[0.5em] mb-1">Total Due</p>
                            <p className={`text-[7px] md:text-[8px] font-bold italic opacity-60 ${theme === 'dark' ? 'text-white' : 'text-brown-300'}`}>Financial Integrity Verified</p>
                        </div>
                        <div className="text-right">
                             <p className={`text-2xl md:text-5xl font-black tracking-tighter leading-none flex items-center justify-end gap-2 md:gap-3 transition-colors ${
                               theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                             }`}>
                                 <span className="text-sm md:text-xl">Rs.</span> {order.total_price || order.amount || 0}
                             </p>
                        </div>
                    </div>
                </div>
             </div>

             {/* Premium Footer area */}
             <div className={`relative z-10 mt-16 md:mt-32 pt-8 md:pt-16 border-t flex flex-col items-center transition-colors ${
               theme === 'dark' ? 'border-white/10' : 'border-[#F4F1ED]'
             }`}>
                 <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 text-[80px] md:text-[180px] font-black uppercase tracking-tighter pointer-events-none select-none -z-10 transition-colors ${
                   theme === 'dark' ? 'text-white/5' : 'text-[#F4F1ED]/20'
                 }`}>
                    WHISK
                 </div>

                 <div className="flex gap-20 mb-12">
                    <div className="text-center">
                        <div className={`w-16 h-[1px] mx-auto mb-4 transition-colors ${theme === 'dark' ? 'bg-white/20' : 'bg-brown-100'}`}></div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-brown-200'}`}>Digital Auth Signature</p>
                    </div>
                    <div className="text-center">
                        <div className={`w-16 h-[1px] mx-auto mb-4 transition-colors ${theme === 'dark' ? 'bg-white/20' : 'bg-brown-100'}`}></div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-brown-200'}`}>Master Artisan Seal</p>
                    </div>
                 </div>

                 <div className="text-center">
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[1em] mb-4 ${theme === 'dark' ? 'text-white/20' : 'text-brown-300'}`}>
                        THE WHISK BAKERY // STANDARD ACQUISITION TREATY V2.0
                    </p>
                    <p className={`text-[11px] font-black tracking-tighter uppercase opacity-80 transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                    }`}>
                        Thank you for commissioning an artisan masterpiece. 🍰
                    </p>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
