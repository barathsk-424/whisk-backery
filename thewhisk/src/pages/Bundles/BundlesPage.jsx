import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { bundles as mockBundles } from '../../data/mockData';
import { supabase } from '../../lib/supabase';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

export default function BundlesPage() {
  const { addToCart, user, navigate } = useStore();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from('bundles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBundles(data || []);
    } catch (error) {
      console.error('Fetch Error:', error);
      setBundles(mockBundles); // Fallback to mock data on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddBundle = (bundle) => {
    if (!user) {
      toast.error("Please login to reserve this bundle.", { icon: "🔐" });
      navigate('/login');
      return;
    }

    addToCart({
      id: bundle.id,
      name: bundle.name,
      description: bundle.items.join(', '),
      category: 'bundle',
      base_price: bundle.final_price,
      image_url: bundle.image_url,
      tags: [bundle.occasion],
      rating: 4.8,
    });
    toast.success(`${bundle.name} added to cart!`, { icon: '🎁' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-bold text-primary">Loading Bundles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-3xl font-bold text-primary">🎁 Smart Bundles</h1>
          <p className="text-brown-400 mt-2 max-w-lg mx-auto">
            Curated combos for every occasion. Save up to 20% with our specially designed bundles.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bundles.map((bundle, i) => (
            <motion.div
              key={bundle.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg group hover:shadow-xl transition-shadow"
            >
              <div className="grid sm:grid-cols-2">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={bundle.image_url}
                    alt={bundle.name}
                    className="w-full h-full min-h-[250px] object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute top-4 left-4 bg-success text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
                    {bundle.discount}% OFF
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                    {bundle.emoji} {bundle.occasion}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-heading text-xl font-bold text-primary mb-3">
                      {bundle.emoji} {bundle.name}
                    </h3>
                    <p className="text-sm text-brown-400 mb-4">What's included:</p>
                    <ul className="space-y-2">
                      {bundle.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-brown-500">
                          <span className="w-2 h-2 bg-accent rounded-full shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-brown-100">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg text-brown-300 line-through">₹{bundle.original_price}</span>
                      <span className="font-heading text-2xl font-bold text-accent">₹{bundle.final_price}</span>
                      <span className="text-xs bg-success/10 text-success font-bold px-2 py-0.5 rounded-full">
                        Save ₹{bundle.original_price - bundle.final_price}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddBundle(bundle)}
                      className="w-full py-3 gradient-accent text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
