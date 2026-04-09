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
        customer_phone: invoice?.customer_phone || order.phone || "",
        customer_address: invoice?.customer_address || order.delivery_details?.address || order.address?.address || "Address Not Captured",
        payment_method: order.payment_method || "Online UPI",
        delivery_slot: order.delivery_time || "Priority Processing",
        total_amount: order.total_price || order.amount || invoice?.total_amount || 0,
        subtotal: invoice?.subtotal || (order.total_price / 1.18),
        gst_amount: invoice?.gst_amount || (order.total_price - (order.total_price / 1.18)),
        status: order.status || 'Verified'
    };

    const result = downloadInvoiceAsPDF(payload, order.items || []);
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
        <div className={`shadow-[0_40px_100px_rgba(0,0,0,0.06)] rounded-[2rem] md:rounded-[3rem] border p-6 md:p-20 relative overflow-hidden print:shadow-none print:border-none print:p-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-[#1A1110] border-white/5 shadow-white/5' 
            : 'bg-white border-brown-100/50 shadow-luxury'
        }`}>
             
             {/* Large Watermark Background */}
             <div className={`absolute top-12 right-12 text-[120px] font-black tracking-[-0.05em] uppercase pointer-events-none select-none z-0 transition-colors ${
               theme === 'dark' ? 'text-white/5' : 'text-[#F4F1ED]/40'
             }`}>
                INVOICE
             </div>

             {/* Header Section */}
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12 mb-12 md:mb-20">
                <div className="flex items-start gap-8">
                    <div className={`w-24 h-24 rounded-3xl p-3 shadow-sm shrink-0 flex items-center justify-center overflow-hidden border transition-all ${
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
                              e.target.parentNode.innerHTML = '<span class="text-4xl">🧁</span>';
                            }
                          }}
                        />
                    </div>
                    <div>
                        <h2 className={`text-2xl md:text-4xl font-black tracking-[-0.04em] uppercase leading-[0.9] transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                        }`}>
                            THE WHISK<br/><span className="text-[#A67C52]">BAKERY</span>
                        </h2>
                        <div className={`mt-6 space-y-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                          theme === 'dark' ? 'text-white/60' : 'text-[#A67C52]'
                        }`}>
                            <p>Mannivakkam, Chennai, Tamil Nadu,</p>
                            <p>600048, India</p>
                            <div className="mt-2 text-[#FF6B35]">
                                <p>Ph: +91 6374618833</p>
                                <p>Email: skbarath424@gmail.com</p>
                                <p className="font-black mt-1">GSTIN: {invoice?.shop_gstin || "29AAAAA0000A1Z5"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-left md:text-right flex flex-col items-start md:items-end">
                    <div className="mb-6">
                        <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 pr-1 ${theme === 'dark' ? 'text-white/40' : 'text-brown-300'}`}>Acquisition Signal ID</p>
                        <p className={`text-3xl font-black tracking-tighter uppercase transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-primary'
                        }`}>{invoice?.invoice_id || "INV-2026-0003"}</p>
                    </div>
                    <div className="flex md:flex-col gap-6 md:gap-2">
                        <div>
                            <p className={`text-[8px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-brown-300'}`}>Timestamp: {new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className={`text-[8px] font-black uppercase tracking-widest italic ${theme === 'dark' ? 'text-white/20' : 'text-brown-200'}`}>Order Index: #{order.id.slice(0, 10).toUpperCase()}</p>
                        </div>
                    </div>
                </div>
             </div>

             <div className={`w-full h-[1px] mb-20 transition-colors ${
               theme === 'dark' ? 'bg-white/10' : 'bg-[#F4F1ED]'
             }`}></div>

             {/* Consignee & Coordinates Grid */}
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 mb-16 md:mb-28">
                {/* Billing Card */}
                <div className={`rounded-[2.5rem] p-10 border transition-all ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-[#FAF9F6] border-[#F0E6D9]/50'
                } relative`}>
                    <div className="absolute top-6 left-10">
                        <span className={`text-[9px] font-black text-[#FF6B35] uppercase tracking-[0.4em] px-3 py-1 rounded-full shadow-sm transition-colors ${
                          theme === 'dark' ? 'bg-[#1A1110]' : 'bg-white'
                        }`}>Billed to Consignee</span>
                    </div>
                    <div className="mt-8 md:mt-10">
                        <p className={`text-2xl md:text-3xl font-black tracking-tighter uppercase mb-2 transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                        }`}>{invoice?.customer_name || order.customer_name || 'Artisan Guest'}</p>
                        <p className={`text-sm font-bold lowercase mb-8 transition-colors ${
                          theme === 'dark' ? 'text-white/60' : 'text-brown-400'
                        }`}>{invoice?.customer_email || order.user_email || 'Signal Lost'}</p>
                        <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`}>Terminal:</span>
                            <span className={`text-[9px] font-black uppercase border px-3 py-1 rounded-lg transition-all ${
                              theme === 'dark' ? 'text-white bg-white/5 border-white/10' : 'text-primary bg-white border-brown-100'
                            }`}>WEB-CORE-V2</span>
                        </div>
                    </div>
                </div>

                {/* Shipment                 <div className="flex flex-col justify-center">
                    <p className={`text-[10px] font-black uppercase tracking-[0.5em] mb-6 ${theme === 'dark' ? 'text-white/20' : 'text-brown-200'}`}>Shipment Coordinates</p>
                    <p className={`text-lg font-black uppercase leading-tight mb-4 max-w-[300px] transition-colors ${
                      theme === 'dark' ? 'text-white' : 'text-primary'
                    }`}>
                        {invoice?.customer_address || formatAddress(order.delivery_details || order.address)}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-[#FF6B35] uppercase tracking-widest pr-2">Comm-Link:</span>
                        <span className="text-sm font-black text-[#FF6B35]">
                             {invoice?.customer_phone || order.phone || order.delivery_details?.phone || order.address?.phone || "Not Provided"}
                        </span>
                    </div>
                </div>       </div>
             </div>

             {/* Acquisition Logic Table */}
             <div className="relative z-10 mb-20 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className={`text-[10px] font-black text-brown-300 uppercase tracking-[0.4em] border-b transition-colors ${
                          theme === 'dark' ? 'border-white/10' : 'border-[#F4F1ED]'
                        }`}>
                            <th className="text-left pb-10 w-[50%]">Blueprint Description</th>
                            <th className="text-center pb-10">Unit</th>
                            <th className="text-right pb-10">Price</th>
                            <th className="text-right pb-10 pr-4">Acquisition</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y transition-colors ${
                      theme === 'dark' ? 'divide-white/5' : 'divide-[#F4F1ED]/60'
                    }`}>
                        {(order.items || invoice?.items || []).map((item, idx) => (
                            <tr key={idx} className="group">
                                <td className="py-12">
                                    <p className={`text-xl font-black tracking-tighter uppercase leading-none mb-3 transition-colors ${
                                      theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                                    }`}>
                                        {item.name || item.product_name}
                                    </p>
                                    <div className="flex gap-2">
                                        <span className="text-[8px] font-black text-[#FF6B35] uppercase bg-[#FF6B35]/5 px-2 py-0.5 rounded italic">Flavor: {item.flavor || "Chocolate"}</span>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded italic transition-colors ${
                                          theme === 'dark' ? 'text-brown-400 bg-white/5' : 'text-brown-300 bg-brown-50'
                                        }`}>Shape: {item.shape || "Round"}</span>
                                    </div>
                                </td>
                                <td className={`py-12 text-center text-sm font-black transition-colors ${
                                  theme === 'dark' ? 'text-white/50' : 'text-brown-400'
                                }`}>{item.quantity || item.qty}</td>
                                <td className={`py-12 text-right text-sm font-black tracking-tighter transition-colors ${
                                  theme === 'dark' ? 'text-white/50' : 'text-brown-400'
                                }`}>Rs. {item.price}</td>
                                <td className={`py-12 text-right text-2xl font-black tracking-tighter pr-4 transition-colors ${
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
                     <div className="w-full md:w-[400px] flex flex-col gap-6">
                    <div className={`flex justify-between items-center text-[10px] font-black uppercase tracking-widest pb-4 border-b transition-colors ${
                      theme === 'dark' ? 'text-white/40 border-white/10' : 'text-brown-300 border-brown-50'
                    }`}>
                        <span>Subtotal</span>
                        <span className={`text-sm tracking-tighter transition-colors ${
                          theme === 'dark' ? 'text-white' : 'text-primary'
                        }`}>Rs.{invoice?.subtotal || (order.total_price / 1.18).toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between items-center text-[9px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/30' : 'text-brown-200'}`}>
                        <span>CGST (9%)</span>
                        <span className={`text-xs transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Rs.{(invoice?.gst_amount / 2 || (order.total_price * 0.09)).toFixed(2)}</span>
                    </div>
                    <div className={`flex justify-between items-center text-[9px] font-bold uppercase tracking-widest pb-6 border-b-2 border-[#FF6B35] ${theme === 'dark' ? 'text-white/30' : 'text-brown-200'}`}>
                        <span>SGST (9%)</span>
                        <span className={`text-xs transition-colors ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Rs.{(invoice?.gst_amount / 2 || (order.total_price * 0.09)).toFixed(2)}</span>
                    </div>
                </div>
                    <div className="flex justify-between items-center pt-4">
                        <div>
                            <p className="text-[10px] font-black text-[#FF6B35] uppercase tracking-[0.5em] mb-1">Total Due</p>
                            <p className={`text-[8px] font-bold italic opacity-60 ${theme === 'dark' ? 'text-white' : 'text-brown-300'}`}>Financial Integrity Verified</p>
                        </div>
                        <div className="text-right">
                             <p className={`text-5xl font-black tracking-tighter leading-none flex items-center justify-end gap-3 transition-colors ${
                               theme === 'dark' ? 'text-white' : 'text-[#4A2A1A]'
                             }`}>
                                 <span className="text-lg md:text-xl">Rs.</span> {order.total_price || order.amount || 0}
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
