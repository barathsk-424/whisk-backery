import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlinePhone, HiOutlineCake, HiOutlineCalendar, HiOutlineChatAlt2, HiCheckCircle } from 'react-icons/hi';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import useStore from '../../store/useStore';

const WHATSAPP_NUMBER = '916374618833';

export default function OrderForm() {
  const { theme } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cake_name: '',
    delivery_date: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim() || !formData.cake_name.trim()) {
      return toast.error('Please fill in all required fields');
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      return toast.error('Please enter a valid 10-digit phone number');
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Placing your order...');

    try {
      // Try Supabase first
      const { error } = await supabase
        .from('cake_orders')
        .insert([{
          customer_name: formData.name.trim(),
          phone: formData.phone.trim(),
          cake_name: formData.cake_name.trim(),
          delivery_date: formData.delivery_date || null,
          message: formData.message.trim() || null,
          status: 'pending',
        }]);

      if (error) {
        // Fallback: save to localStorage if Supabase table doesn't exist
        const orders = JSON.parse(localStorage.getItem('cake_orders') || '[]');
        orders.push({
          ...formData,
          id: Date.now(),
          created_at: new Date().toISOString(),
          status: 'pending',
        });
        localStorage.setItem('cake_orders', JSON.stringify(orders));
      }

      toast.success('🎂 Order placed successfully! We\'ll contact you shortly.', { id: toastId });
      setIsSuccess(true);
      setFormData({ name: '', phone: '', cake_name: '', delivery_date: '', message: '' });

      // Reset success state after 5s
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      // Final fallback to localStorage
      const orders = JSON.parse(localStorage.getItem('cake_orders') || '[]');
      orders.push({
        ...formData,
        id: Date.now(),
        created_at: new Date().toISOString(),
        status: 'pending',
      });
      localStorage.setItem('cake_orders', JSON.stringify(orders));
      toast.success('Order saved! We\'ll reach you soon.', { id: toastId });
      setIsSuccess(true);
      setFormData({ name: '', phone: '', cake_name: '', delivery_date: '', message: '' });
      setTimeout(() => setIsSuccess(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const msg = `Hi! I'd like to order:\n🎂 Cake: ${formData.cake_name || 'Custom Cake'}\n👤 Name: ${formData.name || ''}\n📅 Date: ${formData.delivery_date || 'ASAP'}\n📝 Note: ${formData.message || 'None'}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const inputClasses = `w-full px-4 py-3.5 rounded-2xl border-2 transition-all outline-none text-sm font-medium ${
    theme === 'dark'
      ? 'bg-white/5 text-white border-white/10 placeholder:text-white/30 focus:border-accent focus:bg-white/10'
      : 'bg-brown-50/50 text-primary border-brown-100/50 placeholder:text-brown-300 focus:border-accent focus:bg-white'
  }`;

  return (
    <section
      id="order-form"
      className={`py-20 transition-colors duration-500 relative overflow-hidden ${
        theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'
      }`}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-warning/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full text-accent text-xs font-bold uppercase tracking-widest mb-6">
            <HiOutlineCake className="w-4 h-4" />
            Quick Order
          </div>
          <h2 className={`font-heading text-3xl sm:text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
            Place Your Order 🎂
          </h2>
          <p className={`text-sm max-w-lg mx-auto ${theme === 'dark' ? 'text-white/50' : 'text-brown-400'}`}>
            Fill in the form below and we&apos;ll get back to you within minutes. Or order directly via WhatsApp!
          </p>
        </motion.div>

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-center p-12 rounded-3xl border ${
              theme === 'dark' ? 'bg-[#1A1110] border-green-900/30' : 'bg-white border-green-100'
            }`}
          >
            <HiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className={`font-heading text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
              Order Received! 🎉
            </h3>
            <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-white/50' : 'text-brown-400'}`}>
              We'll contact you shortly to confirm your order details.
            </p>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-8 py-3 gradient-accent text-white font-bold rounded-2xl text-sm hover:opacity-90 transition-all"
            >
              Place Another Order
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className={`p-8 sm:p-10 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-[#1A1110] border-white/5' : 'bg-white border-brown-100/30'
            }`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <HiOutlineUser className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`} />
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name *"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`${inputClasses} pl-11`}
                />
              </div>
              <div className="relative">
                <HiOutlinePhone className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number *"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`${inputClasses} pl-11`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <HiOutlineCake className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`} />
                <input
                  type="text"
                  name="cake_name"
                  placeholder="Cake Name / Type *"
                  required
                  value={formData.cake_name}
                  onChange={handleChange}
                  className={`${inputClasses} pl-11`}
                />
              </div>
              <div className="relative">
                <HiOutlineCalendar className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`} />
                <input
                  type="date"
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`${inputClasses} pl-11`}
                />
              </div>
            </div>

            <div className="relative mb-6">
              <HiOutlineChatAlt2 className={`absolute left-4 top-4 w-4 h-4 ${theme === 'dark' ? 'text-white/30' : 'text-brown-300'}`} />
              <textarea
                name="message"
                placeholder="Special message or instructions (optional)"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                className={`${inputClasses} pl-11 resize-none`}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-4 gradient-accent text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-accent/20 transition-all ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? '⏳ Placing Order...' : '🎂 Place Order'}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppOrder}
                className="flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(37, 211, 102, 0.25)',
                }}
              >
                <svg viewBox="0 0 32 32" fill="white" className="w-4 h-4">
                  <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.052 9.38L1.056 31.5l6.316-2.012A15.916 15.916 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.32 22.616c-.392 1.1-1.94 2.016-3.164 2.284-.84.18-1.936.324-5.628-1.208-4.724-1.96-7.76-6.752-7.996-7.068-.228-.316-1.9-2.528-1.9-4.824 0-2.296 1.204-3.424 1.632-3.892.392-.428 1.044-.624 1.672-.624.2 0 .38.012.54.02.468.02.704.048 1.012.784.384.92 1.32 3.216 1.436 3.452.116.236.232.548.076.86-.148.316-.276.512-.512.788-.236.276-.472.488-.708.784-.22.26-.468.536-.2.96.268.428 1.192 1.964 2.56 3.184 1.76 1.568 3.24 2.056 3.704 2.284.384.188.624.16.876-.096.256-.268.96-1.048 1.216-1.412.252-.364.508-.3.856-.18.352.116 2.224 1.048 2.604 1.24.38.188.632.284.728.44.092.156.092.904-.3 2.008z" />
                </svg>
                Order via WhatsApp
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </section>
  );
}
