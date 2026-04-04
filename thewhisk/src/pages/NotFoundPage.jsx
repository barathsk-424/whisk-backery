import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-7xl mb-6"
          >
            🍰
          </motion.div>
          <h1 className="font-heading text-5xl font-bold text-primary mb-2">404</h1>
          <h2 className="font-heading text-xl font-bold text-primary mb-4">
            Page Not Found
          </h2>
          <p className="text-brown-400 mb-8 text-sm">
            Oops! This page seems to have been eaten. Let&apos;s get you back to something delicious.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-8 py-3.5 gradient-accent text-white font-bold rounded-xl shadow-lg shadow-accent/20 hover:opacity-90 transition-opacity"
            >
              ← Back to Home
            </Link>
            <Link
              to="/menu"
              className="px-8 py-3.5 bg-brown-50 text-primary font-bold rounded-xl border border-brown-200 hover:bg-brown-100 transition-colors"
            >
              Browse Menu
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
