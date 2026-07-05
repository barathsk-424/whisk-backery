import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiOutlinePhone } from 'react-icons/hi';
import useStore from '../../store/useStore';

const WHATSAPP_NUMBER = '916374618833';
const PHONE_NUMBER = '+916374618833';

export default function StickyConversionBar() {
  const { theme } = useStore();

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hi! I would like to order from Whisk Bakery 🎂');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const handleCall = () => {
    window.open(`tel:${PHONE_NUMBER}`, '_self');
  };

  const handleOrder = () => {
    const el = document.getElementById('order-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#order-form';
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5, type: 'spring', stiffness: 120 }}
      className={`fixed bottom-0 left-0 right-0 z-[9997] border-t backdrop-blur-xl safe-area-inset-bottom lg:hidden ${
        theme === 'dark'
          ? 'bg-[#1A1110]/95 border-white/10'
          : 'bg-white/95 border-brown-100/30'
      }`}
      style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.1)' }}
    >
      <div className="max-w-[1440px] mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
        {/* Order Now */}
        <button
          onClick={handleOrder}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-accent text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-accent/20 hover:opacity-90 active:scale-95 transition-all mobile-touch-target"
        >
          <HiOutlineShoppingCart className="w-4 h-4" />
          <span>Order Now</span>
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all mobile-touch-target"
          style={{
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.25)',
          }}
        >
          <svg viewBox="0 0 32 32" fill="white" className="w-4 h-4">
            <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.052 9.38L1.056 31.5l6.316-2.012A15.916 15.916 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.32 22.616c-.392 1.1-1.94 2.016-3.164 2.284-.84.18-1.936.324-5.628-1.208-4.724-1.96-7.76-6.752-7.996-7.068-.228-.316-1.9-2.528-1.9-4.824 0-2.296 1.204-3.424 1.632-3.892.392-.428 1.044-.624 1.672-.624.2 0 .38.012.54.02.468.02.704.048 1.012.784.384.92 1.32 3.216 1.436 3.452.116.236.232.548.076.86-.148.316-.276.512-.512.788-.236.276-.472.488-.708.784-.22.26-.468.536-.2.96.268.428 1.192 1.964 2.56 3.184 1.76 1.568 3.24 2.056 3.704 2.284.384.188.624.16.876-.096.256-.268.96-1.048 1.216-1.412.252-.364.508-.3.856-.18.352.116 2.224 1.048 2.604 1.24.38.188.632.284.728.44.092.156.092.904-.3 2.008z" />
          </svg>
          <span>WhatsApp</span>
        </button>

        {/* Call Now */}
        <button
          onClick={handleCall}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all mobile-touch-target border ${
            theme === 'dark'
              ? 'bg-white/10 text-white border-white/10'
              : 'bg-primary text-white border-primary/10'
          }`}
        >
          <HiOutlinePhone className="w-4 h-4" />
          <span>Call Now</span>
        </button>
      </div>
    </motion.div>
  );
}
