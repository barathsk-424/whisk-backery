import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { HiOutlineDownload, HiOutlineLocationMarker, HiOutlineCheckCircle } from 'react-icons/hi';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const lastOrder = localStorage.getItem('lastOrder');
    if (lastOrder) {
      setOrder(JSON.parse(lastOrder));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!order) return null;

  const handleDownloadReceipt = () => {
    // Basic text dump invoice for the browser
    const receiptContent = `
      THE WHISK - ORDER RECEIPT
      -------------------------
      Order ID: ${order.id}
      Date: ${new Date(order.date).toLocaleString()}
      Status: ${order.status}

      Delivery Address:
      ${order.address.line1}, ${order.address.city} - ${order.address.pincode}

      Payment Method: ${order.payment_method.toUpperCase()}

      Items:
      ${order.items.map(item => `- ${item.name} (x${item.quantity}) - ₹${item.base_price * item.quantity}`).join('\n')}

      -------------------------
      TOTAL PAID: ₹${order.total.toLocaleString()}
      
      Thank you for shopping at The Whisk!
    `;
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-brown-50 relative overflow-hidden">
      
      {/* Fallback CSS animated background elements */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-32 h-32 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-[20%] w-48 h-48 bg-success rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="max-w-3xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="bg-white rounded-3xl shadow-xl border border-brown-100 p-8 md:p-12"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 text-success"
            >
              <HiOutlineCheckCircle className="w-16 h-16" />
            </motion.div>
            <h1 className="font-heading text-3xl font-bold text-primary mb-2">Order Confirmed!</h1>
            <p className="text-brown-400">Your delicious creation is being prepared. Order <b>#{order.id}</b></p>
          </div>

          {/* Items Summary with Images */}
          <div className="bg-brown-50 rounded-2xl p-6 mb-8">
            <h3 className="font-bold text-primary mb-4 border-b border-brown-200 pb-2">Order Details</h3>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm">
                  <img src={item.image_url || item.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop'} alt="Cake" className="w-20 h-20 rounded-lg object-cover bg-brown-50 border border-brown-100" />
                  <div className="flex-1">
                    <p className="font-bold text-primary leading-tight">{item.name}</p>
                    {item.message && <p className="text-xs text-accent font-medium mt-1">Message: "{item.message}"</p>}
                    <p className="text-sm text-brown-400 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-primary">₹{(item.base_price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-brown-200">
               <span className="text-brown-400 font-medium">Grand Total</span>
               <span className="text-2xl font-bold text-accent">₹{order.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Address & Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start gap-3 bg-white p-4 rounded-2xl border border-brown-100 shadow-sm">
               <HiOutlineLocationMarker className="w-6 h-6 text-accent shrink-0 mt-0.5" />
               <div>
                 <p className="text-xs font-bold text-brown-400 uppercase tracking-wider mb-1">Delivering To</p>
                 <p className="text-sm text-primary font-medium">{order.address.line1}</p>
                 <p className="text-sm text-primary">{order.address.city} - {order.address.pincode}</p>
               </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/track-order')}
              className="flex-1 py-4 gradient-accent text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity"
            >
              Track Order Live
            </button>
            <button
              onClick={handleDownloadReceipt}
              className="flex-1 py-4 bg-brown-50 text-primary font-bold rounded-xl border border-brown-200 flex items-center justify-center gap-2 hover:bg-brown-100 transition-colors"
            >
              <HiOutlineDownload className="w-5 h-5" />
              Download Receipt
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-4 text-brown-400 font-bold hover:text-primary transition-colors"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
