import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlineFilter,
  HiOutlineRefresh,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentText,
  HiOutlinePencil,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API_URL } from "../../config";

const AdminInvoices = ({ theme }) => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/invoices/all`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch financial records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    const id = editingInvoice.id;
    try {
      const response = await fetch(`${API_URL}/api/invoices/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(editingInvoice),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Invoice Acquisition Record Updated.");
        setIsEditModalOpen(false);
        fetchInvoices();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error("Update Signal Failed: " + err.message);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.order_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = dateFilter
      ? inv.created_at.startsWith(dateFilter)
      : true;

    return matchesSearch && matchesDate;
  });

  const totalRevenue = filteredInvoices.reduce(
    (sum, inv) => sum + Number(inv.total_amount || 0),
    0,
  );
  const totalGst = filteredInvoices.reduce(
    (sum, inv) => sum + Number(inv.gst_amount || 0),
    0,
  );

  return (
    <div className="space-y-8 p-1 font-body">
      {/* Header / Stats Overlay */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border shadow-xl transition-all ${
            theme === 'dark' ? 'bg-[#1A1110] border-white/5 shadow-white/5' : 'bg-white border-brown-100 shadow-xl'
          }`}
        >
          <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-accent/10 text-accent rounded-xl lg:rounded-2xl">
              <HiOutlineCurrencyRupee className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <p className="text-[10px] lg:text-xs font-black uppercase text-brown-400 tracking-widest">
              Total Invoiced
            </p>
          </div>
          <h3 className={`text-2xl lg:text-3xl font-black tracking-tighter ${
            theme === 'dark' ? 'text-white' : 'text-primary'
          }`}>
            ₹{totalRevenue.toLocaleString()}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] border shadow-xl transition-all ${
            theme === 'dark' ? 'bg-[#1A1110] border-white/5 shadow-white/5' : 'bg-white border-brown-100 shadow-xl'
          }`}
        >
          <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
            <div className="p-2 lg:p-3 bg-success/10 text-success rounded-xl lg:rounded-2xl">
              <HiOutlineDocumentText className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <p className="text-[10px] lg:text-xs font-black uppercase text-brown-400 tracking-widest">
              GST Accumulation
            </p>
          </div>
          <h3 className={`text-2xl lg:text-3xl font-black tracking-tighter ${
            theme === 'dark' ? 'text-white' : 'text-primary'
          }`}>
            ₹{totalGst.toLocaleString()}
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] shadow-xl relative overflow-hidden sm:col-span-2 lg:col-span-1 border transition-all ${
            theme === 'dark' ? 'bg-[#1A1110] border-white/5 text-white' : 'bg-primary border-transparent text-white'
          }`}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
              <div className="p-2 lg:p-3 bg-white/10 rounded-xl lg:rounded-2xl">
                <HiOutlineFilter className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <p className={`text-[10px] lg:text-xs font-black uppercase tracking-widest ${theme === 'dark' ? 'text-white/60' : 'text-white/60'}`}>
                Archive Count
              </p>
            </div>
            <h3 className={`text-2xl lg:text-3xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : ''}`}>
              {filteredInvoices.length} Verified Entries
            </h3>
          </div>
          <div className="absolute -right-4 -bottom-4 text-white/5 text-6xl lg:text-8xl font-black italic">
            FIN
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className={`flex flex-col md:flex-row gap-4 items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-[2rem] border shadow-lg no-print transition-all ${
        theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'
      }`}>
        <div className="relative flex-1 w-full">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-400" />
          <input
            type="text"
            placeholder="Search Invoice ID, Order ID or Consignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-11 lg:pl-12 pr-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold outline-none border transition-all ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                : 'bg-brown-50 border-transparent focus:border-accent text-primary'
            }`}
          />
        </div>
        <div className="flex gap-2 lg:gap-4 w-full md:w-auto">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`flex-1 md:flex-none px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-xs lg:text-sm font-bold outline-none border transition-all ${
              theme === 'dark' 
                ? 'bg-white/5 border-white/10 text-white focus:border-accent' 
                : 'bg-brown-50 border-transparent focus:border-accent text-primary'
            }`}
          />
          <button
            onClick={fetchInvoices}
            className="p-2.5 lg:p-3 bg-accent text-white rounded-xl shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
          >
            <HiOutlineRefresh
              className={`w-4 h-4 lg:w-5 lg:h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-xl lg:rounded-[2rem] border shadow-xl overflow-hidden transition-all ${
        theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100'
      }`}>
        <div className="overflow-x-auto artisan-scrollbar">
          <table className="w-full text-left min-w-[800px] lg:min-w-0">
            <thead>
              <tr className={`text-[9px] lg:text-[10px] font-black uppercase tracking-[0.1em] lg:tracking-[0.2em] transition-colors ${
                theme === 'dark' ? 'bg-white/5 text-white/60' : 'bg-brown-50 text-brown-400'
              }`}>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Signal ID</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Consignee</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Fiscal Total</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5">Timestamp</th>
                <th className="px-4 lg:px-6 py-4 lg:py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-50 dark:divide-brown-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-black uppercase text-brown-400 tracking-widest animate-pulse">
                        Syncing Vault...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-brown-50/50 dark:hover:bg-brown-800/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                        {inv.invoice_id}
                      </p>
                      <p className={`text-[10px] font-mono ${theme === 'dark' ? 'text-white/60' : 'text-brown-400'}`}>
                        #{inv.order_id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                        {inv.customer_name}
                      </p>
                      <p className={`text-[10px] lowercase ${theme === 'dark' ? 'text-white/60' : 'text-brown-400'}`}>
                        {inv.customer_email}
                      </p>
                      <p className="text-[10px] text-accent font-bold">
                        {inv.customer_phone || "No Phone Captured"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-md font-black text-accent tracking-tighter">
                        ₹{inv.total_amount}
                      </p>
                      <p className={`text-[9px] uppercase font-bold tracking-tighter ${theme === 'dark' ? 'text-white/40' : 'text-brown-400'}`}>
                        Inc. ₹{inv.gst_amount} GST
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-xs font-bold uppercase ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                        {new Date(inv.created_at).toLocaleDateString()}
                      </p>
                      <p className={`text-[10px] ${theme === 'dark' ? 'text-white/60' : 'text-brown-400'}`}>
                        {new Date(inv.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => navigate(`/invoice/${inv.order_id}`)}
                          className="p-2 text-brown-400 hover:text-accent hover:bg-accent/5 rounded-lg transition-all"
                          title="View Original"
                        >
                          <HiOutlineEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingInvoice({ ...inv });
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-brown-400 hover:text-primary dark:hover:text-cream hover:bg-brown-100 dark:hover:bg-brown-800 rounded-lg transition-all"
                          title="Modify Record"
                        >
                          <HiOutlinePencil className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <p className="text-xs font-black uppercase text-brown-300 tracking-widest">
                      No matching records found in the archive.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-brown-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-brown-100 dark:border-brown-800"
            >
              <div className="px-8 py-6 border-b border-brown-50 dark:border-brown-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-primary dark:text-cream uppercase tracking-tighter">
                    Modify Acquisition Record
                  </h3>
                  <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">
                    Ref: {editingInvoice?.invoice_id}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-brown-50 dark:hover:bg-brown-800 rounded-full transition-colors text-brown-400"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>

              <form
                onSubmit={handleUpdateInvoice}
                className="p-8 space-y-4 max-h-[70vh] overflow-y-auto artisan-scrollbar"
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                        Invoice Reference
                      </label>
                      <input
                        type="text"
                        value={editingInvoice?.invoice_id || ""}
                        onChange={(e) =>
                          setEditingInvoice({
                            ...editingInvoice,
                            invoice_id: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-brown-50 dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                        Current Status
                      </label>
                      <select
                        value={editingInvoice?.status || "Paid"}
                        onChange={(e) =>
                          setEditingInvoice({
                            ...editingInvoice,
                            status: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-brown-50 dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent appearance-none transition-all"
                      >
                        <option value="Paid">Verified/Paid</option>
                        <option value="Pending">Pending Sync</option>
                        <option value="Cancelled">Inhibited</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                        Consignee Name
                      </label>
                      <input
                        type="text"
                        value={editingInvoice?.customer_name || ""}
                        onChange={(e) =>
                          setEditingInvoice({
                            ...editingInvoice,
                            customer_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-brown-50 dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                        Consignee Email
                      </label>
                      <input
                        type="email"
                        value={editingInvoice?.customer_email || ""}
                        onChange={(e) =>
                          setEditingInvoice({
                            ...editingInvoice,
                            customer_email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-brown-50 dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                      Consignee Phone (Comm-Link)
                    </label>
                    <input
                      type="text"
                      value={editingInvoice?.customer_phone || ""}
                      onChange={(e) =>
                        setEditingInvoice({
                          ...editingInvoice,
                          customer_phone: e.target.value,
                        })
                      }
                      placeholder="+91-XXXXXXXXXX"
                      className="w-full px-4 py-3 bg-brown-50 dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                      Consignee Address (Shipment Coordinates)
                    </label>
                    <textarea
                      value={editingInvoice?.customer_address || ""}
                      onChange={(e) =>
                        setEditingInvoice({
                          ...editingInvoice,
                          customer_address: e.target.value,
                        })
                      }
                      placeholder="Street, Area, City, Pin"
                      className="w-full px-4 py-3 bg-brown-50 dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all h-20 artisan-scrollbar"
                    />
                  </div>

                  <div className="p-4 bg-brown-50 dark:bg-brown-800/50 rounded-2xl border border-brown-100 dark:border-brown-800">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-4">
                      Shop Identity Metadata
                    </p>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                          Shop Name
                        </label>
                        <input
                          type="text"
                          value={editingInvoice?.shop_name || ""}
                          onChange={(e) =>
                            setEditingInvoice({
                              ...editingInvoice,
                              shop_name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                          Shop Address
                        </label>
                        <textarea
                          value={editingInvoice?.shop_address || ""}
                          onChange={(e) =>
                            setEditingInvoice({
                              ...editingInvoice,
                              shop_address: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all h-20 artisan-scrollbar"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-brown-400 uppercase tracking-widest block mb-2 px-1">
                          Shop GSTIN
                        </label>
                        <input
                          type="text"
                          value={editingInvoice?.shop_gstin || ""}
                          onChange={(e) =>
                            setEditingInvoice({
                              ...editingInvoice,
                              shop_gstin: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-white dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-brown-50 dark:bg-brown-800/50 rounded-2xl border border-brown-100 dark:border-brown-800">
                    <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-4">
                      Fiscal Ledger Details
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-black text-brown-400 uppercase tracking-widest block mb-2">
                          Subtotal (₹)
                        </label>
                        <input
                          type="number"
                          value={editingInvoice?.subtotal || 0}
                          onChange={(e) => {
                            const newVal = Number(e.target.value);
                            const gst = newVal * 0.18;
                            setEditingInvoice({
                              ...editingInvoice,
                              subtotal: newVal,
                              gst_amount: gst.toFixed(2),
                              total_amount: (newVal + gst).toFixed(2),
                            });
                          }}
                          className="w-full px-4 py-3 bg-white dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-brown-400 uppercase tracking-widest block mb-2">
                          GST (18%) (₹)
                        </label>
                        <input
                          type="number"
                          value={editingInvoice?.gst_amount || 0}
                          onChange={(e) => {
                            const gst = Number(e.target.value);
                            setEditingInvoice({
                              ...editingInvoice,
                              gst_amount: gst,
                              total_amount: (
                                Number(editingInvoice.subtotal) + gst
                              ).toFixed(2),
                            });
                          }}
                          className="w-full px-4 py-3 bg-white dark:bg-brown-800 rounded-xl text-sm font-bold text-primary dark:text-cream outline-none border border-transparent focus:border-accent transition-all"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-black text-brown-400 uppercase tracking-widest block mb-2">
                          Grand Total (₹)
                        </label>
                        <input
                          type="number"
                          value={editingInvoice?.total_amount || 0}
                          onChange={(e) => {
                            const total = Number(e.target.value);
                            const sub = total / 1.18;
                            setEditingInvoice({
                              ...editingInvoice,
                              total_amount: total,
                              subtotal: sub.toFixed(2),
                              gst_amount: (total - sub).toFixed(2),
                            });
                          }}
                          className="w-full px-4 py-3 bg-primary text-white rounded-xl text-lg font-black outline-none border-2 border-accent/20 focus:border-accent transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-4 bg-brown-100 dark:bg-brown-800 text-primary dark:text-cream rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brown-200 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Commit Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInvoices;
