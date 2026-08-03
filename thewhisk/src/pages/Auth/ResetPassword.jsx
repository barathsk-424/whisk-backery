import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import useStore from "../../store/useStore";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useStore();

  useEffect(() => {
    // Check if user arrived via recovery link with active recovery session
    const checkRecoverySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasRecoverySession(true);
        } else {
          // Listen for session state changes (Supabase handles URL hash tokens automatically)
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "PASSWORD_RECOVERY" || session) {
              setHasRecoverySession(true);
            }
          });
          
          // Check session once more after brief delay for hash parsing
          setTimeout(async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (currentSession) {
              setHasRecoverySession(true);
            }
            setSessionChecking(false);
          }, 1000);

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error("Session verification error:", err);
      } finally {
        setSessionChecking(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = "Passwords do not match.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
      } else {
        toast.success("Password updated successfully! Redirecting to login... 🔒");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      const netErr = "Failed to update password. Please try again.";
      setError(netErr);
      toast.error(netErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-80px)] flex items-center justify-center py-12 sm:py-24 px-4 sm:px-6 transition-colors duration-700 ${theme === "dark" ? "bg-[#0D0807]" : "bg-secondary"}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div
          className={`rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl border transition-all ${theme === "dark"
            ? "bg-[#1A1110] border-white/5 shadow-white/5"
            : "bg-white border-brown-100"
            }`}
        >
          <div className="text-center mb-6 sm:mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 rounded-[1.25rem] sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-3xl sm:text-4xl"
            >
              🔒
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-primary">
              Reset Password
            </h1>
            <p className="text-accent font-black uppercase text-[8px] sm:text-[10px] tracking-[0.3em] sm:tracking-[0.4em] mt-2 sm:mt-3">
              Set Your New Secure Cipher
            </p>
          </div>

          {sessionChecking ? (
            <div className="text-center py-8 text-brown-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Verifying recovery session...
            </div>
          ) : !hasRecoverySession ? (
            <div className="text-center py-6">
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest">
                ⚠️ Recovery session missing or expired. Please request a new password reset link.
              </div>
              <Link
                to="/forgot-password"
                className={`inline-block w-full py-4 font-black text-xs rounded-2xl shadow-xl transition-all uppercase tracking-[0.3em] ${theme === "dark"
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-primary text-white hover:bg-primary-light"
                  }`}
              >
                Request New Link
              </Link>
            </div>
          ) : (
            <>
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
                <div>
                  <label className="block text-[10px] font-black text-brown-400 uppercase tracking-widest mb-2 ml-4 self-start text-left">
                    New Secure Cipher (Password)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-5 py-4 sm:px-6 sm:py-4.5 rounded-xl sm:rounded-2xl border font-black text-[10px] sm:text-xs focus:outline-none focus:ring-4 transition-all ${theme === "dark"
                      ? "bg-white/5 border-white/10 text-white focus:ring-white/5 tracking-widest"
                      : "bg-secondary/30 border-brown-50 text-primary focus:ring-primary/5"
                      }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-brown-400 uppercase tracking-widest mb-2 ml-4 self-start text-left">
                    Confirm Secure Cipher
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-5 py-4 sm:px-6 sm:py-4.5 rounded-xl sm:rounded-2xl border font-black text-[10px] sm:text-xs focus:outline-none focus:ring-4 transition-all ${theme === "dark"
                      ? "bg-white/5 border-white/10 text-white focus:ring-white/5 tracking-widest"
                      : "bg-secondary/30 border-brown-50 text-primary focus:ring-primary/5"
                      }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-5 font-black text-xs rounded-2xl shadow-xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.3em] ${theme === "dark"
                    ? "bg-white text-black hover:bg-white/90 shadow-white/5"
                    : "bg-primary text-white hover:bg-primary-light shadow-luxury"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-12 text-center border-t border-brown-50 pt-8 flex items-center justify-center gap-3">
            <p className="text-[10px] font-black text-brown-400 uppercase tracking-widest">
              Back to{" "}
              <Link to="/login" className="text-accent font-black hover:underline">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-4 text-[8px] font-black uppercase tracking-widest text-brown-300 opacity-50">
            <span>Identity Secured</span>
            <span>•</span>
            <span>Node & Supabase Auth</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
