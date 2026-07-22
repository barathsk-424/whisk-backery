import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SplashScreen = () => {
  const logoRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!logoRef.current || !lineRef.current) return;

    // Logo entrance animation
    gsap.fromTo(
      logoRef.current,
      { opacity: 0, scale: 0.9, y: -20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.5,
        ease: "power2.out",
        repeat: 0,
      }
    );

    // Floating bounce animation (infinite, respects reduced motion)
    const bounce = gsap.to(logoRef.current, {
      y: -10,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      duration: 2,
    });

    // Line sweep animation
    gsap.fromTo(
      lineRef.current,
      { x: "-100%" },
      {
        x: "100%",
        duration: 2,
        repeat: -1,
        ease: "linear",
      }
    );

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      bounce.pause();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary overflow-hidden">
      {/* Accessible live region for screen readers */}
      <div className="sr-only" aria-live="polite" role="status">
        Whisk Bakery – Crafting Perfection
      </div>
      <div className="relative flex flex-col items-center">
        <img
          ref={logoRef}
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="Whisk Bakery"
          className="w-48 md:w-64 h-auto drop-shadow-[0_20px_50px_rgba(74,42,26,0.3)]"
        />
        <div className="mt-8 flex flex-col items-center">
          <div className="h-[2px] w-12 bg-brown-200/30 rounded-full overflow-hidden">
            <div ref={lineRef} className="h-full w-full bg-gradient-to-r from-transparent via-brown-400 to-transparent" />
          </div>
          <p className="mt-4 font-black text-brown-300 uppercase tracking-[0.5em] text-[8px]">
            Crafting Perfection
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

