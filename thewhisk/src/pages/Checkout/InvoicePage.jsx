import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import html2pdf from "html2pdf.js";

const InvoicePage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef();

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Order Details
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderError) throw orderError;
        setOrder(orderData);

        // 2. Fetch or Generate Invoice
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/invoices/order/${orderId}`);
        const result = await response.json();

        if (result.success && result.invoice) {
          setInvoice(result.invoice);
        } else {
          console.error("[InvoicePage] Invoice search failure:", result.error);
        }
      } catch (err) {
        console.error("[InvoicePage] Fatal error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchInvoiceData();
  }, [orderId]);

  const downloadPDF = async () => {
    if (downloading) return;

    // 1. Validate Element Existence (Requirement 6 & 7)
    const element = document.getElementById("invoice");
    if (!element) {
      alert(
        "Error: Critical Acquisition Signal (Invoice #invoice) not detected in the current layer.",
      );
      return;
    }

    setDownloading(true);

    try {
      // 2. Ensure Proper Rendering & Visibility (Requirement 2 & 5)
      // Scroll to top briefly to ensure full visibility if needed, though usually element-based capture is fine
      element.scrollIntoView({ behavior: "smooth", block: "start" });

      // 3. Capture Delay (Requirement 2: 500ms)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 4. Enhanced PDF Configuration (Requirement 1, 3, 4)
      const options = {
        margin: [10, 10, 10, 10],
        filename: `THE_WHISK_BILL_${invoice?.invoice_id || "OFFLINE"}.pdf`,
        image: { type: "jpeg", quality: 1 }, // Requirement 3
        html2canvas: {
          scale: 3, // Requirement 3: Ultra High Definition
          useCORS: true, // Requirement 4
          logging: false,
          backgroundColor: "#FFFFFF",
          onclone: (clonedDoc) => {
            const target = clonedDoc.getElementById("invoice");
            if (target) {
              target.style.padding = "40px";
              // Hardened HEX Fallback to prevent modern CSS parsing errors
              const items = target.getElementsByTagName("*");
              for (let i = 0; i < items.length; i++) {
                const style = window.getComputedStyle(items[i]);
                if (style.color.includes("okl"))
                  items[i].style.color = "#4A2A1A";
                if (style.backgroundColor.includes("okl"))
                  items[i].style.backgroundColor = "transparent";
              }
            }
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }, // Requirement 3
      };

      // 5. Execute Generation (Requirement 1)
      await html2pdf().set(options).from(element).save();

      toast.success("Artisan Acquisition Exported Successfully.");
    } catch (err) {
      console.error("[PDF Engine] Fatal Exception:", err);
      toast.error(
        "Synthesis Failed: Potential Browser Incompatibility Detected.",
      );
      alert("PDF could not be synthesized. Please try Chrome/Edge desktop.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF8E7] font-body">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-[#FF6B3522] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🍰
          </div>
        </div>
        <p className="font-heading font-black text-[#4A2A1A] uppercase tracking-[0.3em] text-xs">
          Synchronizing Archive Signal...
        </p>
      </div>
    );

  if (!invoice || !order)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF8E7] text-[#4A2A1A] p-4 text-center font-body">
        <div className="text-6xl mb-6">🛰️</div>
        <h2 className="text-2xl font-black font-heading mb-4 uppercase tracking-tighter">
          Signal Interrupted
        </h2>
        <p className="text-[#A67C52] mb-8 max-w-sm uppercase text-[10px] font-black tracking-widest leading-loose">
          The specified acquisition record could not be restored from the master
          vault. Return to tracking to verify order state.
        </p>
        <button
          onClick={() => navigate("/track-orders")}
          className="px-10 py-4 bg-[#4A2A1A] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
        >
          Back to Archive
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-8 no-print">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-heading font-black text-[#4A2A1A] tracking-tighter uppercase">
              Artisan Invoice
            </h1>
            <p className="text-[#FF6B35] font-black uppercase text-[10px] tracking-[0.4em] mt-2">
              Verified acquisition record // {invoice.invoice_id}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className={`flex items-center gap-3 px-8 py-4 transition-all font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl ${downloading ? "bg-gray-300" : "bg-[#FF6B35] text-white shadow-[#FF6B3522] hover:scale-105"}`}
              id="download_invoice_btn"
            >
              {downloading ? (
                "Processing Signal..."
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    ></path>
                  </svg>
                  Export Bill (PDF)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Professional Invoice Element - STRIPPED OF ALL THEME CLASSES THAT USE OKLCH */}
        <div
          id="invoice"
          ref={invoiceRef}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "48px",
            border: "1px solid #F0E6D9",
            boxShadow: "0 25px 50px -12px rgba(74, 42, 26, 0.15)",
          }}
          className="p-6 sm:p-16 text-[#1F2937] relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#4A2A1A 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          ></div>

          {/* Header */}
          <div
            style={{ borderBottom: "2px solid #F3F4F6" }}
            className="flex flex-col sm:flex-row justify-between pb-12 mb-12 relative z-10"
          >
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">🧁</span>
                <h2 className="text-4xl font-heading font-black text-[#4A2A1A] tracking-tighter uppercase leading-none whitespace-pre-wrap">
                  {invoice.shop_name || "The Whisk\nBakery"}
                </h2>
              </div>
              <div className="space-y-1 text-xs font-bold text-[#A67C52] uppercase tracking-widest leading-relaxed">
                <p className="max-w-[200px] whitespace-pre-wrap">
                  {invoice.shop_address ||
                    "123 Artisan Lane, Flour District\nBangalore, Karnataka - 560001"}
                </p>
                <p className="text-[#FF6B35]">
                  GSTIN: {invoice.shop_gstin || "29AAAAA0000A1Z5"}
                </p>
              </div>
            </div>
            <div className="mt-10 sm:mt-0 text-left sm:text-right flex flex-col justify-end">
              <h3 className="text-5xl font-heading font-black text-[#F3F4F6] uppercase tracking-tighter leading-none mb-4">
                Invoice
              </h3>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-[#C9A87C] tracking-[0.2em]">
                  Acquisition Signal ID
                </p>
                <p className="text-xl font-black text-[#4A2A1A]">
                  {invoice.invoice_id}
                </p>
                <div className="pt-4 flex flex-col sm:items-end gap-1">
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase">
                    Timestamp:{" "}
                    {new Date(invoice.created_at).toLocaleDateString()} |{" "}
                    {new Date(invoice.created_at).toLocaleTimeString()}
                  </p>
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase font-mono tracking-tighter">
                    Order Index: #{order.id.slice(0, 8)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid sm:grid-cols-2 gap-8 mb-16 relative z-10">
            <div
              style={{
                backgroundColor: "#F9F7F5",
                border: "1px solid #F0E6D9",
                borderRadius: "32px",
              }}
              className="p-8"
            >
              <h4 className="text-[10px] font-black uppercase text-[#FF6B35] tracking-[0.3em] mb-6">
                Billed To Consignee
              </h4>
              <p className="text-2xl font-black text-[#4A2A1A] mb-2 tracking-tight">
                {invoice.customer_name || "Artisan Guest"}
              </p>
              <p className="text-sm font-bold text-[#A67C52] lowercase truncate mb-4">
                {invoice.customer_email}
              </p>
              <div
                style={{ borderTop: "1px solid #F0E6D9" }}
                className="pt-6 flex items-center gap-3"
              >
                <span className="text-xs font-black uppercase tracking-widest text-[#C9A87C]">
                  Terminal:
                </span>
                <span
                  style={{
                    border: "1px solid #F0E6D9",
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                  }}
                  className="px-3 py-1 text-[10px] font-black text-[#4A2A1A]"
                >
                  WEB-CORE-V2
                </span>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase text-[#C9A87C] tracking-[0.3em] mb-6">
                Shipment Coordinates
              </h4>
              <p className="text-sm font-black text-[#4A2A1A] leading-loose uppercase tracking-tight">
                {order.delivery_details?.address ||
                  order.address?.address ||
                  (typeof order.address === "string" ? order.address : "") ||
                  "No coordinates provided."}
              </p>
              {order.delivery_details?.phone && (
                <p className="text-xs font-bold text-[#FF6B35] mt-4">
                  Comm-Link: +91 {order.delivery_details.phone}
                </p>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="mb-16 relative z-10 overflow-x-auto overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr
                  style={{ borderBottom: "2px solid #F0E6D9" }}
                  className="text-[10px] font-black uppercase text-[#C9A87C] tracking-[0.3em]"
                >
                  <th className="pb-6">Blueprint Description</th>
                  <th className="pb-6 text-center">Unit</th>
                  <th className="pb-6 text-right">Price</th>
                  <th className="pb-6 text-right">Acquisition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-8">
                      <p className="text-sm font-black text-[#4A2A1A] uppercase tracking-tight mb-1">
                        {item.name || item.product_name}
                      </p>
                      <div className="flex gap-2">
                        {item.flavor && (
                          <span
                            style={{
                              color: "#FF6B35",
                              backgroundColor: "#FF6B3511",
                            }}
                            className="text-[9px] font-bold uppercase px-2 py-0.5 rounded italic"
                          >
                            Flavor: {item.flavor}
                          </span>
                        )}
                        {item.shape && (
                          <span
                            style={{
                              color: "#C9A87C",
                              backgroundColor: "#F0E6D955",
                            }}
                            className="text-[9px] font-bold uppercase px-2 py-0.5 rounded italic"
                          >
                            Shape: {item.shape}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-8 text-center text-sm font-black text-[#C9A87C]">
                      {item.quantity || item.qty || 1}
                    </td>
                    <td className="py-8 text-right text-sm font-bold text-[#A67C52]">
                      ₹{item.price}
                    </td>
                    <td className="py-8 text-right text-lg font-black text-[#4A2A1A] tracking-tighter">
                      ₹
                      {(item.price * (item.quantity || item.qty || 1)).toFixed(
                        2,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end relative z-10">
            <div className="w-full sm:w-80 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-[#C9A87C] tracking-[0.2em]">
                  Subtotal
                </span>
                <span className="font-black text-[#4A2A1A]">
                  ₹{invoice.subtotal}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#9CA3AF]">
                  <span>CGST (9%)</span>
                  <span>₹{(invoice.gst_amount / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-[#9CA3AF]">
                  <span>SGST (9%)</span>
                  <span>₹{(invoice.gst_amount / 2).toFixed(2)}</span>
                </div>
              </div>
              <div
                style={{ borderTop: "2px solid #FF6B35" }}
                className="pt-6 flex justify-between items-end"
              >
                <div>
                  <p className="text-[10px] font-black uppercase text-[#FF6B35] tracking-[0.4em] mb-1">
                    Total Due
                  </p>
                  <p className="text-[8px] font-bold text-[#C9A87C] italic leading-tight">
                    Financial integrity verified
                  </p>
                </div>
                <span className="text-4xl font-heading font-black text-[#4A2A1A] tracking-tighter">
                  ₹{invoice.total_amount}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div
            style={{ borderTop: "1px solid #F3F4F6" }}
            className="mt-24 pt-12 flex flex-col items-center gap-6 text-center relative z-10"
          >
            <div className="flex gap-12">
              <div className="flex flex-col items-center">
                <div
                  style={{ borderBottom: "2px solid rgba(74, 42, 26, 0.1)" }}
                  className="w-16 h-1 mb-4"
                ></div>
                <p className="text-[8px] font-black text-[#C9A87C] uppercase tracking-widest">
                  Digital Auth Signature
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div
                  style={{ borderBottom: "2px solid rgba(74, 42, 26, 0.1)" }}
                  className="w-16 h-1 mb-4"
                ></div>
                <p className="text-[8px] font-black text-[#C9A87C] uppercase tracking-widest">
                  Master Artisan Seal
                </p>
              </div>
            </div>
            <p className="text-[10px] font-black text-[#D1D5DB] uppercase tracking-[0.6em] mt-6 italic">
              The Whisk Bakery // Standard Acquisition Treaty v2.0
            </p>
          </div>

          <div className="absolute bottom-[-100px] left-[-100px] text-[300px] opacity-[0.02] transform -rotate-12 pointer-events-none uppercase font-black tracking-tighter text-[#4A2A1A]">
            WHISK
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
