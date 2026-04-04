import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_URL =
  import.meta.env.VITE_API_URL || "https://whisk-backery.onrender.com";

/* ── Simple password strength ──────────────────────── */
function getStrength(pwd) {
  if (!pwd) return { label: "", color: "", pct: 0 };
  if (pwd.length < 6) return { label: "Too short", color: "#ef4444", pct: 20 };
  if (pwd.length < 8) return { label: "Weak", color: "#f97316", pct: 40 };
  if (!/[A-Z]/.test(pwd) || !/\d/.test(pwd))
    return { label: "Fair", color: "#eab308", pct: 65 };
  if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd))
    return { label: "Strong", color: "#22c55e", pct: 100 };
  return { label: "Good", color: "#84cc16", pct: 80 };
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("otp"); // 'otp' | 'password' | 'done'
  const [recoveryToken, setRecoveryToken] = useState("");

  const strength = getStrength(newPwd);

  // ── OTP box keyboard nav ─────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  // ── Verify OTP through Backend ───────────────────────
  const verifyOtp = async () => {
    const entered = otp.join("");
    const email = localStorage.getItem("resetEmail") || "";

    if (entered.length < 6) {
      toast.error("Identity code requires 6 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/verify-recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: entered }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Identity confirmed! 🔐");
        setRecoveryToken(data.token);
        setStep("password");
      } else {
        toast.error(data.message || "Invalid or expired code.");
      }
    } catch (err) {
      toast.error("Verification relay failure.");
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password through Backend ───────────────────
  const handleReset = async () => {
    if (!newPwd) {
      toast.error("Cipher required.");
      return;
    }
    if (newPwd.length < 6) {
      toast.error("Cipher too short.");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Ciphers do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: recoveryToken, password: newPwd }),
      });

      const data = await res.json();
      if (res.ok) {
        // Cleanup
        localStorage.removeItem("resetEmail");
        setStep("done");
        toast.success("🎉 Vault re-secured!");
      } else {
        toast.error(data.message || "Vault update failure.");
      }
    } catch (err) {
      toast.error("Security server error.");
    } finally {
      setLoading(false);
    }
  };

  // ── Done ─────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-white/20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="text-7xl mb-6"
            >
              🎉
            </motion.div>
            <h2 className="font-heading text-2xl font-bold text-primary mb-2">
              Password Reset!
            </h2>
            <p className="text-brown-400 text-sm mb-8">
              Your password has been updated successfully. You can now sign in
              with your new password.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-4 gradient-accent text-white font-bold rounded-2xl
                         shadow-lg shadow-accent/20 hover:opacity-90 transition-all"
            >
              Go to Sign In →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
              transition={{ delay: 0.2, type: "spring" }}
              className="text-6xl block mb-4"
            >
              {step === "otp" ? "🔢" : "🔑"}
            </motion.span>
            <h1 className="font-heading text-3xl font-bold text-primary">
              {step === "otp" ? "Verify OTP" : "New Password"}
            </h1>
            <p className="text-brown-400 mt-2 text-sm">
              {step === "otp"
                ? "Enter the 6-digit code that was shown in the notification"
                : "Choose a strong password for your account"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 1: OTP ─────────────────────────────── */}
            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-primary mb-3 text-center">
                    6-Digit OTP
                  </label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        className="w-12 h-14 text-center text-xl font-bold rounded-2xl border-2
                                   border-brown-100 focus:outline-none focus:border-accent
                                   focus:ring-4 focus:ring-accent/10 transition-all bg-white/70
                                   caret-transparent"
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={verifyOtp}
                  className="w-full py-4 gradient-accent text-white font-bold rounded-2xl
                             shadow-lg shadow-accent/20 hover:opacity-90 hover:-translate-y-0.5
                             active:scale-[0.98] transition-all"
                >
                  Verify OTP →
                </button>

                <p className="text-center text-sm text-brown-400">
                  Wrong email?{" "}
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="text-accent font-bold hover:underline"
                  >
                    Go back
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: New Password ─────────────────────── */}
            {step === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* New password */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5 ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-3.5 pr-12 rounded-2xl border border-brown-100 text-sm
                                 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10
                                 transition-all bg-white/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brown-300 hover:text-primary transition-colors"
                    >
                      {showPwd ? "🙈" : "👁️"}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPwd && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2"
                    >
                      <div className="h-1.5 bg-brown-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${strength.pct}%` }}
                          style={{ backgroundColor: strength.color }}
                          className="h-full rounded-full transition-all duration-300"
                        />
                      </div>
                      <p
                        className="text-xs mt-1 ml-1"
                        style={{ color: strength.color }}
                      >
                        {strength.label}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5 ml-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm
                                focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all bg-white/50
                                ${
                                  confirmPwd && confirmPwd !== newPwd
                                    ? "border-red-300 focus:border-red-400"
                                    : "border-brown-100 focus:border-accent"
                                }`}
                  />
                  {confirmPwd && confirmPwd !== newPwd && (
                    <p className="text-xs text-red-500 mt-1 ml-1">
                      Passwords don't match
                    </p>
                  )}
                </div>

                <button
                  onClick={handleReset}
                  disabled={loading}
                  className={`w-full py-4 gradient-accent text-white font-bold rounded-2xl
                              shadow-lg shadow-accent/20 flex items-center justify-center gap-2
                              transition-all
                              ${loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98]"}`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "🔐 Reset Password"
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back to login */}
          <div className="mt-8 text-center border-t border-brown-50 pt-6">
            <p className="text-sm text-brown-400">
              <button
                onClick={() => navigate("/login")}
                className="text-accent font-bold hover:underline"
              >
                ← Back to Sign In
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
