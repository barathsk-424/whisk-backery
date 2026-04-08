import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineClock } from 'react-icons/hi';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const contactInfo = [
  { 
    icon: HiOutlineLocationMarker, 
    label: 'Visit Us', 
    value: 'Mannivakkam, Chennai', 
    sub: 'Main Bakery & Store',
    link: 'https://www.google.com/maps/search/?api=1&query=Mannivakkam+Chennai'
  },
  { 
    icon: HiOutlinePhone, 
    label: 'Call Us', 
    value: '+91 6374618833', 
    sub: 'Mon-Sun, 9AM-10PM',
    link: 'tel:+916374618833'
  },
  { 
    icon: HiOutlineMail, 
    label: 'Email Us', 
    value: 'skbarath424@gmail.com', 
    sub: 'Get a quick response',
    link: 'mailto:skbarath424@gmail.com'
  },
  { 
    icon: HiOutlineClock, 
    label: 'Hours', 
    value: '9 AM - 10 PM', 
    sub: 'Everyday (Mon-Sun)' 
  },
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
          {contactInfo.map((item, i) => {
            const Content = (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className={`bg-secondary p-8 rounded-3xl shadow-sm border border-brown-100/50 text-center group h-full transition-all ${item.link ? 'cursor-pointer hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5' : ''}`}
              >
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent transition-all duration-300">
                  <item.icon className="w-6 h-6 text-accent group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="font-heading font-bold text-primary mb-2">{item.label}</h3>
                <p className="text-sm font-semibold text-primary mb-1">{item.value}</p>
                <p className="text-xs text-brown-400">{item.sub}</p>
                {item.link && (
                  <div className="mt-4 pt-4 border-t border-brown-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">Click to connect →</span>
                  </div>
                )}
              </motion.div>
            );

            return item.link ? (
              <a key={item.label} href={item.link} target={item.link.startsWith('http') ? '_blank' : undefined} rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}>
                {Content}
              </a>
            ) : (
              <div key={item.label}>{Content}</div>
            );
          })}
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-12">
          {/* Quick Contact Form (Simplified) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-secondary rounded-3xl p-8 shadow-sm border border-brown-100/50"
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
                  className="w-full px-4 py-3 rounded-xl bg-brown-50 border border-transparent focus:border-accent focus:bg-secondary transition-all outline-none text-sm"
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-brown-50 border border-transparent focus:border-accent focus:bg-secondary transition-all outline-none text-sm"
                />
              </div>
              <textarea
                placeholder="Tell us what you're thinking..."
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-brown-50 border border-transparent focus:border-accent focus:bg-secondary transition-all outline-none text-sm resize-none"
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
            className="rounded-3xl overflow-hidden shadow-sm border border-brown-100/50 bg-secondary h-full min-h-[400px] flex flex-col items-center justify-center relative p-10 text-center"
          >
             <div className="relative z-10 space-y-6">
                <div className="text-6xl mb-2 scale-animation">🥐</div>
                <div>
                  <h3 className="font-heading text-2xl font-bold text-primary mb-3">Freshness Guaranteed</h3>
                  <div className="w-12 h-1 gradient-accent mx-auto mb-6 rounded-full" />
                </div>
                
                <div className="grid gap-4 text-left">
                  {[
                    { t: '2-Hour Protocol', d: 'Baked exactly 120 minutes before delivery signal.', i: '⏱️' },
                    { t: 'Zero Preservatives', d: '100% natural artisan ingredients only.', i: '🚫' },
                    { t: 'Organic Sourcing', d: 'Dairy and flour sourced from local organic farms.', i: '🐄' },
                    { t: 'Temperature Controlled', d: 'Delivered in insulated thermal containers.', i: '❄️' }
                  ].map(spec => (
                    <div key={spec.t} className="flex gap-4 items-start">
                       <span className="text-xl">{spec.i}</span>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">{spec.t}</p>
                          <p className="text-[10px] text-brown-400 font-bold">{spec.d}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="inline-block mt-8 px-6 py-3 bg-accent/10 text-accent font-black rounded-2xl text-[10px] uppercase tracking-widest border border-accent/20">
                  LIVE BAKE STREAM: <span className="text-primary">ONLINE 🟢</span>
                </div>
             </div>
             
             {/* Abstract background decorative blobs */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-warning/5 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
