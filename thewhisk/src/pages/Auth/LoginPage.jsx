import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setAuthData, theme } = useStore();

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
    return regex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        const decoded = JSON.parse(atob(data.token.split('.')[1]));
        setAuthData({ ...decoded, ...data.user }, data.token);
        
        toast.success(`Welcome, ${data.user?.name || 'Artisan'}! 🧁`);
        if (decoded.role === "admin") navigate("/admin-dashboard");
        else navigate("/");
      } else {
        setError(data.message || "Invalid credentials");
        toast.error(data.message || "Invalid credentials");
      }
    } catch (err) {
      toast.error("Network error. Backend service unreachable.");
    } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setError("Please enter a valid artisan email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Membership Created! You can now authenticate.");
        setIsSignUp(false);
        setPassword("");
      } else {
        setError(data.message || "Membership creation failed.");
        toast.error(data.message || "Membership creation failed.");
      }
    } catch (err) {
      toast.error("Network error during registration.");
    } finally { setLoading(false); }
  };

  const handleSubmit = (e) => {
    if (isSignUp) handleSignup(e);
    else handleLogin(e);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center py-24 px-6 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D0807]' : 'bg-secondary'}`}>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className={`rounded-[3rem] p-10 shadow-2xl border transition-all ${
           theme === 'dark' ? 'bg-[#1A1110] border-white/5 shadow-white/5' : 'bg-white border-brown-100'
        }`}>
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring' }}
              className="w-20 h-20 bg-accent/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl"
            >
              🧁
            </motion.div>
            <h1 className={`text-3xl font-black uppercase tracking-tighter ${theme === 'dark' ? 'text-secondary' : 'text-primary'}`}>
              Artisan Gateway
            </h1>
            <p className="text-accent font-black uppercase text-[10px] tracking-[0.4em] mt-3">
              {isSignUp ? 'Create Membership' : 'Unified Intelligence Portal'}
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center"
              >
                🚨 {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <label className="block text-[10px] font-black text-brown-400 uppercase tracking-widest mb-2 ml-4 self-start text-left">Masterpiece Signature (Name)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EX: PIERRE HERMÉ"
                  className={`w-full px-6 py-4.5 rounded-2xl border font-black text-xs tracking-widest focus:outline-none focus:ring-4 transition-all uppercase ${
                    theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:ring-white/5 placeholder:text-white/20' : 'bg-secondary/30 border-brown-50 text-primary focus:ring-primary/5 placeholder:text-brown-200'
                  }`}
                />
              </motion.div>
            )}

            <div>
              <label className="block text-[10px] font-black text-brown-400 uppercase tracking-widest mb-2 ml-4 self-start text-left">Identity (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOU@ARTISAN.COM"
                className={`w-full px-6 py-4.5 rounded-2xl border font-black text-xs tracking-widest focus:outline-none focus:ring-4 transition-all uppercase ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:ring-white/5 placeholder:text-white/20' : 'bg-secondary/30 border-brown-50 text-primary focus:ring-primary/5 placeholder:text-brown-200'
                }`}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-brown-400 uppercase tracking-widest mb-2 ml-4 self-start text-left">Secure Cipher (Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-6 py-4.5 rounded-2xl border font-black text-xs focus:outline-none focus:ring-4 transition-all ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white focus:ring-white/5 tracking-widest' : 'bg-secondary/30 border-brown-50 text-primary focus:ring-primary/5'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 bg-primary text-white font-black text-xs rounded-2xl shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.3em] ${
                loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-light active:bg-primary-dark shadow-luxury'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>{isSignUp ? 'Initiate Membership' : 'Authenticate Identity'}</>
              )}
            </button>
          </form>

          <div className="mt-12 text-center border-t border-brown-50 pt-8 flex items-center justify-center gap-3">
             <p className="text-[10px] font-black text-brown-400 uppercase tracking-widest">
               {isSignUp ? 'Already a member?' : "New to the community?"}{' '}
               <button
                 type="button"
                 onClick={() => {
                   setIsSignUp(!isSignUp);
                   setError(null);
                 }}
                 className="text-accent font-black hover:underline"
               >
                 {isSignUp ? 'Sign In Instead' : 'Create Identity'}
               </button>
             </p>
          </div>

          <div className="mt-8 flex justify-center gap-4 text-[8px] font-black uppercase tracking-widest text-brown-300 opacity-50">
            <span>Identity Secured</span>
            <span>•</span>
            <span>Node Secure JWT Protocols</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
