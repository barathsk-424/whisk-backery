import { motion } from 'framer-motion';
import { useState } from 'react';

const WHATSAPP_NUMBER = '916374618833';

export default function WhatsAppFAB() {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    const message = encodeURIComponent('Hi! I would like to place an order from Whisk Bakery 🎂');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-[9998] flex items-center gap-3 lg:hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: 20, scale: 0.8 }}
        animate={isHovered ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 20, scale: 0.8 }}
        className="bg-white dark:bg-[#1A1110] shadow-2xl rounded-2xl px-4 py-2.5 border border-green-100 dark:border-green-900/30 pointer-events-none"
      >
        <p className="text-xs font-bold text-gray-800 dark:text-white whitespace-nowrap">Order on WhatsApp 💬</p>
      </motion.div>

      {/* FAB Button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
          boxShadow: '0 8px 32px rgba(37, 211, 102, 0.4)',
        }}
        aria-label="Order on WhatsApp"
      >
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(37, 211, 102, 0.4)' }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(37, 211, 102, 0.3)' }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* WhatsApp Icon */}
        <svg viewBox="0 0 32 32" fill="white" className="w-8 h-8">
          <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.132 6.744 3.052 9.38L1.056 31.5l6.316-2.012A15.916 15.916 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.32 22.616c-.392 1.1-1.94 2.016-3.164 2.284-.84.18-1.936.324-5.628-1.208-4.724-1.96-7.76-6.752-7.996-7.068-.228-.316-1.9-2.528-1.9-4.824 0-2.296 1.204-3.424 1.632-3.892.392-.428 1.044-.624 1.672-.624.2 0 .38.012.54.02.468.02.704.048 1.012.784.384.92 1.32 3.216 1.436 3.452.116.236.232.548.076.86-.148.316-.276.512-.512.788-.236.276-.472.488-.708.784-.22.26-.468.536-.2.96.268.428 1.192 1.964 2.56 3.184 1.76 1.568 3.24 2.056 3.704 2.284.384.188.624.16.876-.096.256-.268.96-1.048 1.216-1.412.252-.364.508-.3.856-.18.352.116 2.224 1.048 2.604 1.24.38.188.632.284.728.44.092.156.092.904-.3 2.008z" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
