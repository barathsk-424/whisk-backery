import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiMicrophone, HiX } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/useStore";
import toast from "react-hot-toast";

export default function VoiceFAB() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showModal, setShowModal] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { setSearchQuery, setBudgetRange, products } = useStore();

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-IN";

      recognitionRef.current.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };

      recognitionRef.current.onerror = () => {
        setListening(false);
        toast.error("Voice recognition failed. Please try again.");
      };
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice recognition is not supported in your browser.");
      return;
    }
    setTranscript("");
    setListening(true);
    setShowModal(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const applySearch = () => {
    const text = transcript.toLowerCase().trim();
    if (!text) return;

    let foundBudget = null;
    const budgetMatch =
      text.match(/under\s?(?:rs|rupees|₹)?\s?(\d+)/i) ||
      text.match(/(\d+)\s?(?:rs|rupees|₹)?\s?(?:budget|max)/i);
    if (budgetMatch) {
      foundBudget = parseInt(budgetMatch[1]);
      setBudgetRange([0, foundBudget]);
    }

    // Keyword intent logic
    let filterQuery = text;
    if (text.includes("chocolate")) filterQuery = "chocolate";
    if (text.includes("vanilla")) filterQuery = "vanilla";
    if (text.includes("strawberry")) filterQuery = "strawberry";
    if (text.includes("red velvet")) filterQuery = "red velvet";

    setSearchQuery(filterQuery);

    let msg = `Searching for: "${filterQuery}"`;
    if (foundBudget) msg += ` under ₹${foundBudget}`;
    toast.success(msg, { icon: "🤖" });

    setShowModal(false);
    setTranscript("");
    navigate("/menu");
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={startListening}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 ${
          listening ? "bg-error pulse-glow" : "gradient-accent"
        }`}
        aria-label="Voice ordering"
      >
        <HiMicrophone className="w-6 h-6" />
      </motion.button>

      {/* Voice Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                stopListening();
                setShowModal(false);
              }}
              className="fixed inset-0 bg-black/60 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              className="fixed bottom-24 right-6 left-6 md:left-auto md:w-96 z-50 bg-white rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-primary">
                  🎤 Voice Order
                </h3>
                <button
                  onClick={() => {
                    stopListening();
                    setShowModal(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-brown-100"
                >
                  <HiX className="w-5 h-5" />
                </button>
              </div>

              {/* Waveform */}
              {listening && (
                <div className="flex items-center justify-center gap-1 h-16 mb-4">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [8, 32, 16, 40, 12, 28, 8, 36][i % 8],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                      }}
                      className="w-2 bg-accent rounded-full"
                      style={{ minHeight: 8 }}
                    />
                  ))}
                </div>
              )}

              <p className="text-sm text-brown-400 mb-2">
                {listening ? "Listening..." : "Tap the microphone to start"}
              </p>

              {transcript && (
                <div className="bg-secondary rounded-xl p-3 mb-4">
                  <p className="text-sm font-medium text-primary">
                    "{transcript}"
                  </p>
                </div>
              )}

              <p className="text-xs text-brown-300 mb-4">
                Try: "I want a chocolate cake for birthday under ₹1000"
              </p>

              <div className="flex gap-2">
                {listening ? (
                  <button
                    onClick={stopListening}
                    className="flex-1 py-2.5 bg-error text-white font-semibold rounded-xl text-sm"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={startListening}
                    className="flex-1 py-2.5 gradient-accent text-white font-semibold rounded-xl text-sm"
                  >
                    🎤 Speak Again
                  </button>
                )}
                {transcript && (
                  <button
                    onClick={applySearch}
                    className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm"
                  >
                    Search →
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
