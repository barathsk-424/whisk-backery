import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlinePencil, HiCheck, HiX } from 'react-icons/hi';
import useStore from '../../store/useStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const defaultStats = [
  { icon: '🎂', value: '10,000+', label: 'Cakes Delivered' },
  { icon: '⭐', value: '4.9/5', label: 'Customer Rating' },
  { icon: '🏆', value: '8+', label: 'Years of Excellence' },
  { icon: '💕', value: '500+', label: 'Unique Designs' },
];

const defaultFeatures = [
  {
    emoji: '🧈',
    title: 'Premium Ingredients',
    desc: 'We use only the finest imported chocolate, organic flour, and farm-fresh dairy in every creation.',
  },
  {
    emoji: '👩‍🍳',
    title: 'Expert Bakers',
    desc: 'Our team of skilled artisan bakers brings years of passion and precision to every cake.',
  },
  {
    emoji: '🚚',
    title: 'Same-Day Delivery',
    desc: 'Order before 2 PM and receive your freshly baked cake on the same day across Chennai.',
  },
  {
    emoji: '🎨',
    title: 'Custom Designs',
    desc: 'From themed cakes to photo cakes — dream it, and we\'ll craft it to perfection.',
  },
];

export default function AboutSection() {
  const { theme, isAdmin } = useStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [content, setContent] = useState({
    title: 'About Whisk Bakery',
    description: 'Born from a passion for baking and a love for making celebrations special, Whisk Bakery has been Chennai\'s go-to destination for artisan cakes and desserts. Every creation is baked fresh with love, using only premium ingredients.',
    stats: defaultStats,
    features: defaultFeatures
  });

  const [editForm, setEditForm] = useState(content);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .eq('id', 1)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching about content:', error);
      } else if (data) {
        setContent({
          title: data.title,
          description: data.description,
          stats: data.stats,
          features: data.features
        });
        setEditForm({
          title: data.title,
          description: data.description,
          stats: data.stats,
          features: data.features
        });
      }
    } catch (err) {
      console.error('Failed to load about content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('about_content')
        .upsert({ id: 1, ...editForm, updated_at: new Date().toISOString() });
        
      if (error) throw error;
      
      setContent(editForm);
      setIsEditing(false);
      toast.success('About section updated successfully!');
    } catch (err) {
      toast.error('Failed to update content.');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setEditForm(content);
    setIsEditing(false);
  };

  const inputClasses = `w-full px-4 py-2 rounded-xl border transition-all outline-none text-sm font-medium ${
    theme === 'dark'
      ? 'bg-white/5 text-white border-white/10 focus:border-accent focus:bg-white/10'
      : 'bg-white text-primary border-brown-100/50 focus:border-accent'
  }`;

  if (isLoading) return <div className="py-20 text-center">Loading...</div>;

  return (
    <section className={`py-20 relative transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-white'}`}>
      
      {isAdmin && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full hover:bg-accent hover:text-white transition-all text-sm font-bold"
        >
          <HiOutlinePencil className="w-4 h-4" /> Edit Section
        </button>
      )}

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {isEditing ? (
          <div className={`max-w-4xl mx-auto p-6 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-[#1A1110] border-white/10' : 'bg-gray-50 border-brown-100/30'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Edit About Section</h3>
              <div className="flex gap-2">
                <button onClick={handleCancel} className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-all"><HiX className="w-5 h-5" /></button>
                <button onClick={handleSave} className="p-2 rounded-full hover:bg-green-500/10 text-green-500 transition-all"><HiCheck className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>Title</label>
                <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className={inputClasses} />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>Description</label>
                <textarea rows={4} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className={inputClasses} />
              </div>
            </div>

            <h4 className={`font-bold text-md mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Stats</h4>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {editForm.stats.map((stat, i) => (
                <div key={i} className="space-y-2 p-3 border rounded-xl border-dashed border-gray-300 dark:border-gray-700">
                  <input value={stat.icon} onChange={e => { const newStats = [...editForm.stats]; newStats[i].icon = e.target.value; setEditForm({...editForm, stats: newStats}); }} placeholder="Icon" className={inputClasses} />
                  <input value={stat.value} onChange={e => { const newStats = [...editForm.stats]; newStats[i].value = e.target.value; setEditForm({...editForm, stats: newStats}); }} placeholder="Value" className={inputClasses} />
                  <input value={stat.label} onChange={e => { const newStats = [...editForm.stats]; newStats[i].label = e.target.value; setEditForm({...editForm, stats: newStats}); }} placeholder="Label" className={inputClasses} />
                </div>
              ))}
            </div>

            <h4 className={`font-bold text-md mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Features</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {editForm.features.map((feature, i) => (
                <div key={i} className="space-y-2 p-3 border rounded-xl border-dashed border-gray-300 dark:border-gray-700">
                  <input value={feature.emoji} onChange={e => { const newFeatures = [...editForm.features]; newFeatures[i].emoji = e.target.value; setEditForm({...editForm, features: newFeatures}); }} placeholder="Emoji" className={inputClasses} />
                  <input value={feature.title} onChange={e => { const newFeatures = [...editForm.features]; newFeatures[i].title = e.target.value; setEditForm({...editForm, features: newFeatures}); }} placeholder="Title" className={inputClasses} />
                  <textarea rows={2} value={feature.desc} onChange={e => { const newFeatures = [...editForm.features]; newFeatures[i].desc = e.target.value; setEditForm({...editForm, features: newFeatures}); }} placeholder="Description" className={inputClasses} />
                </div>
              ))}
            </div>
            
            <button onClick={handleSave} className="mt-6 w-full py-3 gradient-accent text-white font-bold rounded-xl shadow-lg">Save Changes</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 rounded-full text-accent text-xs font-bold uppercase tracking-widest mb-6">
                ✨ Our Story
              </div>
              <h2 className={`font-heading text-3xl sm:text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                {content.title}
              </h2>
              <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed whitespace-pre-line ${theme === 'dark' ? 'text-white/60' : 'text-brown-400'}`}>
                {content.description}
              </p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              {content.stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`text-center p-6 sm:p-8 rounded-3xl border transition-all hover:shadow-xl ${
                    theme === 'dark'
                      ? 'bg-[#1A1110] border-white/5 hover:border-accent/20'
                      : 'bg-brown-50/50 border-brown-100/30 hover:border-accent/20'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl block mb-3">{stat.icon}</span>
                  <p className="font-heading text-xl sm:text-2xl font-black text-accent mb-1">{stat.value}</p>
                  <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-white/40' : 'text-brown-400'}`}>
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                  className={`p-6 sm:p-8 rounded-3xl border group transition-all hover:shadow-xl ${
                    theme === 'dark'
                      ? 'bg-[#1A1110] border-white/5 hover:border-accent/20'
                      : 'bg-white border-brown-100/30 hover:border-accent/20'
                  }`}
                >
                  <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:bg-accent group-hover:text-white transition-all duration-300">
                    <span className="group-hover:scale-110 transition-transform">{feature.emoji}</span>
                  </div>
                  <h3 className={`font-heading font-bold text-base mb-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                    {feature.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-white/50' : 'text-brown-400'}`}>
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
