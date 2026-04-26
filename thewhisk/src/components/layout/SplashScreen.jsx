import { motion } from "framer-motion";

const SplashScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <img 
            src="/logo.png" 
            alt="Whisk Bakery" 
            className="w-48 md:w-64 h-auto drop-shadow-[0_20px_50px_rgba(74,42,26,0.3)]" 
          />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-8 flex flex-col items-center"
        >
          <div className="h-[2px] w-12 bg-brown-200/30 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-full w-full bg-gradient-to-r from-transparent via-brown-400 to-transparent"
            />
          </div>
          <p className="mt-4 font-black text-brown-300 uppercase tracking-[0.5em] text-[8px]">
            Crafting Perfection
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
