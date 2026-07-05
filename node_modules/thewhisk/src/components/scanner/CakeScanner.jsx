import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCamera, HiX, HiLightningBolt, HiOutlineSparkles, HiShoppingBag } from 'react-icons/hi';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function CakeScanner({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const { scanCake, theme } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      toast.error("Visions restricted. Camera access required.");
      onClose();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
    setResults([]);
  };

  const handleCapture = async () => {
    if (!videoRef.current || scanning) return;
    
    setScanning(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    
    try {
      const suggestions = await scanCake(imageData);
      setResults(suggestions);
      toast.success("Artisan algorithms matched similar designs!", { icon: '✨' });
    } catch (err) {
      toast.error("Signal interference. Try again.");
    } finally {
      setScanning(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 md:p-10">
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             onClick={onClose}
             className="absolute inset-0 bg-black/90 backdrop-blur-2xl" 
          />
          
          <motion.div 
             initial={{ scale: 0.9, y: 50, opacity: 0 }}
             animate={{ scale: 1, y: 0, opacity: 1 }}
             exit={{ scale: 0.9, y: 50, opacity: 0 }}
             className={`relative w-full max-w-5xl h-[92vh] sm:h-[85vh] rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border flex flex-col md:flex-row transition-colors duration-500 mx-auto ${
                theme === 'dark' ? 'bg-[#1A1110] border-white/10' : 'bg-white border-brown-50'
             }`}
          >
             {/* Left: Camera Feed */}
             <div className="relative flex-1 bg-black overflow-hidden group">
                <video 
                   ref={videoRef} 
                   autoPlay 
                   playsInline 
                   className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all duration-700" 
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* HUD Overlays */}
                <div className="absolute inset-0 pointer-events-none border-[20px] border-black/20" />
                <div className="absolute inset-10 border border-white/20 rounded-[2rem]">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent" />
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-accent" />
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-accent" />
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent" />
                </div>

                {scanning && (
                   <motion.div 
                      initial={{ top: '10%' }}
                      animate={{ top: '80%' }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
                      className="absolute left-[10%] right-[10%] h-0.5 bg-accent/50 shadow-[0_0_20px_rgba(255,77,109,0.8)] z-10"
                   />
                )}

                <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8 px-8 pointer-events-auto">
                   <button 
                     onClick={onClose}
                     className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-xl transition-all"
                   >
                      <HiX className="text-2xl" />
                   </button>
                   
                   <button 
                      onClick={handleCapture}
                      disabled={scanning}
                      className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${
                         scanning ? 'border-accent/50 scale-90' : 'border-white hover:scale-110 active:scale-95'
                      }`}
                   >
                      <div className={`w-14 h-14 rounded-full ${scanning ? 'bg-accent/50 animate-pulse' : 'bg-white'}`} />
                   </button>

                   <div className="p-4 bg-white/10 text-white rounded-full backdrop-blur-xl">
                      <HiLightningBolt className="text-2xl" />
                   </div>
                </div>

                <div className="absolute top-12 left-12 flex items-center gap-3">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-white/60 tracking-[0.3em] uppercase">Artisan Sight Protocol v4.0</span>
                </div>
             </div>

             {/* Right: Results Panel */}
             <div className={`w-full md:w-[400px] flex flex-col p-10 transition-all duration-700 ${
                results.length > 0 ? 'opacity-100 translate-x-0' : 'opacity-50'
             }`}>
                <div className="mb-10">
                   <h2 className={`font-heading text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>
                      Identified Artifacts
                   </h2>
                   <p className="text-brown-400 text-xs font-bold uppercase tracking-widest leading-loose">
                      {scanning ? "Synchronizing molecular data..." : results.length > 0 ? `${results.length} Analogous forms detected` : "Awaiting visual signal input."}
                   </p>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                   {results.map((product, i) => (
                      <motion.div 
                        key={product.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`group p-4 rounded-3xl border transition-all hover:scale-[1.02] cursor-pointer ${
                           theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-secondary border-transparent hover:bg-white hover:shadow-xl'
                        }`}
                        onClick={() => { onClose(); navigate('/menu'); }}
                      >
                         <div className="flex gap-4">
                            <img src={product.image_url} className="w-16 h-16 rounded-2xl object-cover shadow-lg" />
                            <div className="flex-1">
                               <h4 className={`text-xs font-black uppercase tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-primary'}`}>{product.name}</h4>
                               <div className="flex items-center gap-2 mb-2">
                                  <span className="text-[10px] font-bold text-accent">₹{product.price || product.base_price}</span>
                                  <span className="w-1 h-1 bg-brown-200 rounded-full" />
                                  <span className="text-[9px] font-medium text-brown-400 capitalize">{product.category}</span>
                               </div>
                               <button className="flex items-center gap-1.5 text-[9px] font-black uppercase text-accent tracking-widest group-hover:gap-3 transition-all">
                                  Inspect <HiLightningBolt />
                                </button>
                            </div>
                         </div>
                      </motion.div>
                   ))}

                   {results.length === 0 && !scanning && (
                      <div className="py-20 text-center opacity-30">
                         <HiOutlineSparkles className="text-5xl mx-auto mb-4 text-brown-200" />
                         <p className="text-[10px] font-black uppercase tracking-tighter">Scan a cake to reveal <br/>hidden artisan blueprints.</p>
                      </div>
                   )}
                </div>

                <div className="mt-10 pt-8 border-t border-brown-50/10">
                   <button 
                     onClick={() => navigate('/menu')}
                     className="w-full py-4 border-2 border-accent text-accent font-black rounded-2xl hover:bg-accent hover:text-white transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-3"
                   >
                      Browse Repository <HiShoppingBag />
                   </button>
                </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
