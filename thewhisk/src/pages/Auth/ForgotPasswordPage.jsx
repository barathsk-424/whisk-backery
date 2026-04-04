import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef                  = useRef(null);

  // ── countdown tick ───────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
    return regex.test(email);
  };

  // ── generate & send OTP via Backend ────────────────────────
  const sendOTP = async () => {
    if (!email.trim()) {
      toast.error('Identity required to proceed.');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Please enter a valid artisan email.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('resetEmail', email.trim());
        toast.success(data.message || "Security code dispatched! 📬");
        setSent(true);
        setCountdown(60);
      } else {
        toast.error(data.message || "Recovery failure.");
      }
    } catch (err) {
      toast.error("Network relay failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setSent(false);
    setCountdown(0);
    sendOTP();
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">

          {/* Header */}
          <div className="text-center mb-8">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl block mb-4"
            >
              🔐
            </motion.span>
            <h1 className="font-heading text-3xl font-bold text-primary">Forgot Password?</h1>
            <p className="text-brown-400 mt-2 text-sm leading-relaxed">
              Enter the email linked to your account and we'll send you a 6-digit OTP.
            </p>
          </div>

          {/* Email Input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-primary mb-1.5 ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sent && sendOTP()}
              placeholder="you@thewhisk.com"
              disabled={sent}
              className="w-full px-4 py-3.5 rounded-2xl border border-brown-100 text-sm
                         focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
                         transition-all bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Send / Resend Button */}
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.button
                key="send"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={sendOTP}
                disabled={loading}
                className={`w-full py-4 gradient-accent text-white font-bold rounded-2xl
                            shadow-lg shadow-accent/20 transition-all flex items-center
                            justify-center gap-2
                            ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]'}`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  '📧 Send Reset OTP'
                )}
              </motion.button>
            ) : (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Success banner */}
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-center">
                  <p className="text-green-700 font-semibold text-sm">✅ Security code dispatched!</p>
                  <p className="text-green-500 text-xs mt-1">Please enter the 6-digit code from your inbox.</p>
                </div>

                {/* Go to Reset */}
                <button
                  onClick={() => navigate('/reset-password')}
                  className="w-full py-4 gradient-accent text-white font-bold rounded-2xl
                             shadow-lg shadow-accent/20 hover:opacity-90 hover:-translate-y-0.5
                             active:scale-[0.98] transition-all"
                >
                  Enter OTP & Reset Password →
                </button>

                {/* Resend */}
                <p className="text-center text-sm text-brown-400">
                  Didn't get it?{' '}
                  {countdown > 0 ? (
                    <span className="text-accent font-semibold">Resend in {countdown}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-accent font-bold hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to Login */}
          <div className="mt-8 text-center border-t border-brown-50 pt-6">
            <p className="text-sm text-brown-400">
              Remember your password?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-accent font-bold hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-4 text-[10px] text-brown-300">
            <span>Secure SSL Encryption</span>
            <span>•</span>
            <span>GDPR Compliant</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
