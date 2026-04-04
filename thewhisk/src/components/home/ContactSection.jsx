import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineClock } from 'react-icons/hi';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const contactInfo = [
  { icon: HiOutlineLocationMarker, label: 'Visit Us', value: 'Mannivakkam, Chennai', sub: 'Main Bakery & Store' },
  { icon: HiOutlinePhone, label: 'Call Us', value: '+91 6374618833', sub: 'Mon-Sun, 9AM-10PM' },
  { icon: HiOutlineMail, label: 'Email Us', value: 'skbarath424@gmail.com', sub: 'Get a quick response' },
  { icon: HiOutlineClock, label: 'Hours', value: '9 AM - 10 PM', sub: 'Everyday (Mon-Sun)' },
];

export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      return toast.error('Please fill in all fields');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return toast.error('Please enter a valid email address');
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading('Sending message...');
    
    try {
      const { error } = await supabase
        .from('contacts')
        .insert([{ 
          name: formData.name.trim(), 
          email: formData.email.trim(), 
          message: formData.message.trim() 
        }]);

      if (error) throw error;
      
      toast.success('Message sent successfully! We will get back to you soon.', { id: toastId });
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message: ' + err.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-brown-50">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary mb-4">
              Get in Touch
            </h2>
            <p className="text-brown-400 max-w-xl mx-auto">
              We'd love to hear from you! Whether it's a bulk order, a wedding cake query, or just a hello, reach out to us.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {contactInfo.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-brown-100/50 text-center group"
            >
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent transition-all duration-300">
                <item.icon className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-heading font-bold text-primary mb-2">{item.label}</h3>
              <p className="text-sm font-semibold text-primary mb-1">{item.value}</p>
              <p className="text-xs text-brown-400">{item.sub}</p>
            </motion.div>

          ))}
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-12">
          {/* Quick Contact Form (Simplified) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-brown-100/50"
          >
            <h3 className="font-heading text-xl font-bold text-primary mb-6">Send us a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-brown-50 border border-transparent focus:border-accent focus:bg-white transition-all outline-none text-sm"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-brown-50 border border-transparent focus:border-accent focus:bg-white transition-all outline-none text-sm"
                />
              </div>
              <textarea
                placeholder="Tell us what you're thinking..."
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-brown-50 border border-transparent focus:border-accent focus:bg-white transition-all outline-none text-sm resize-none"
              />
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full py-4 gradient-accent text-white font-bold rounded-xl shadow-lg transition-all ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'shadow-accent/20 hover:opacity-90'
                }`}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>

          {/* Map / Visual Element */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl overflow-hidden shadow-sm border border-brown-100/50 bg-secondary h-full min-h-[400px] flex items-center justify-center relative p-8 text-center"
          >
             <div className="relative z-10">
                <div className="text-6xl mb-6 scale-animation">🍰</div>
                <h3 className="font-heading text-2xl font-bold text-primary mb-3">Freshness Guaranteed</h3>
                <p className="text-sm text-brown-400 max-w-sm mx-auto mb-6">
                  Come by our store in Mannivakkam to inhale the sweet aroma of freshly baked artisan bread and customized cakes.
                </p>
                <div className="inline-block px-6 py-2 bg-accent/20 text-accent font-bold rounded-full text-xs">
                  FREE SAMPLES ON WEEKENDS!
                </div>
             </div>
             
             {/* Abstract background decorative blobs */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-2xl rounded-full" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-warning/5 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
