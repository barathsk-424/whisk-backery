import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineClock } from 'react-icons/hi';
import useStore from '../../store/useStore';

export default function Footer() {
  const { theme } = useStore();
  return (
    <footer className={`transition-colors duration-500 border-t ${
      theme === 'dark' ? 'bg-[#0D0807] text-white border-white/5' : 'bg-secondary text-primary border-brown-100/10'
    }`}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">🧁</span>
              <div>
                <h3 className={`font-heading text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>The Whisk</h3>
                <p className="text-xs text-accent tracking-widest uppercase">AI Bakery</p>
              </div>
            </div>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-primary/70'}`}>
              Redefining the bakery experience with AI-powered customization, 3D cake building, and seamless ordering.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className={`font-heading font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: 'Home', path: '/' },
                { name: 'Menu', path: '/menu' },
                { name: 'Cake Builder', path: '/cake-builder' },
                { name: 'Bundles', path: '/bundles' },
                { name: 'Track Order', path: '/track-orders' },
                { name: 'Contact', path: '#contact' }
              ].map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`text-sm transition-colors hover:text-accent ${theme === 'dark' ? 'text-white/60' : 'text-primary/60'}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          {/* Contact */}
          <div>
            <h4 className={`font-heading font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Contact Us</h4>
            <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-primary/70'}`}>
              <li className="flex items-start gap-3 group">
                <HiOutlineLocationMarker className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <a 
                  href="https://www.google.com/maps/search/?api=1&query=Mannivakkam+Chennai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Mannivakkam, Chennai
                </a>
              </li>
              <li className="flex items-center gap-3">
                <HiOutlinePhone className="w-5 h-5 text-accent shrink-0" />
                <a href="tel:+916374618833" className="hover:text-accent transition-colors">
                  +91 6374618833
                </a>
              </li>
              <li className="flex items-center gap-3">
                <HiOutlineMail className="w-5 h-5 text-accent shrink-0" />
                <a href="mailto:skbarath424@gmail.com" className="hover:text-accent transition-colors">
                  skbarath424@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <HiOutlineClock className="w-5 h-5 text-accent shrink-0" />
                <span>9 AM - 10 PM, Mon-Sun</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className={`font-heading font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>Stay Sweet</h4>
            <p className={`text-sm mb-3 ${theme === 'dark' ? 'text-white/60' : 'text-primary/70'}`}>Get exclusive offers and new flavor alerts!</p>
            <div className="flex">
              <input
                type="email"
                placeholder="your@email.com"
                className={`flex-1 px-3 py-2 border rounded-l-lg text-sm focus:outline-none focus:border-accent ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20' : 'bg-primary/5 border-primary/10 text-primary placeholder:text-primary/30'
                }`}
              />
              <button className="px-4 py-2 gradient-accent text-white text-sm font-semibold rounded-r-lg hover:opacity-90 transition-opacity">
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className={`mt-10 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 ${theme === 'dark' ? 'border-white/5' : 'border-primary/5'}`}>
          <p className={`text-xs ${theme === 'dark' ? 'text-white/20' : 'text-primary/40'}`}>© 2026 The Whisk. All rights reserved.</p>
          <div className={`flex items-center gap-4 text-sm ${theme === 'dark' ? 'text-white/20' : 'text-primary/40'}`}>
            <span className="hover:text-accent cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-accent cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-accent cursor-pointer transition-colors">Refund Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
