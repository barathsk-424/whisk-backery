import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  shape: 'round',
  size: 1,
  layers: 2, // Standardize to 2 layers for better 3D depth
  tiers: 1,
  glaze: 'glossy',
  pattern: 'smooth', // NEW: Icing texture pattern (smooth/ripple/swirl)
  stand: 'marble', // NEW: Stand base (marble/gold/wood)
  explodedView: false, // NEW: View internal layers
  flavor: 'Vanilla',
  filling: 'Buttercream',
  icingColor: '#FFFFFF', // Clean start
  toppings: [],
  customText: 'The Whisk',
  textColor: '#4A2A1A',
  textSize: 0.22,
  textStyle: 'classic',   // 'modern' | 'classic' | 'bespoke'  (independent of size)
  textX: 0,
  textZ: 0,
  textFont: '/fonts/font.json',
  referenceImage: null,
  theme: 'light',
  autoRotate: true,
  showCandle: false,
};

const useCakeStore = create(
  persist(
    (set) => ({
      cake: initialState,
      
      setShape: (shape) => set((state) => ({ cake: { ...state.cake, shape } })),
      setSize: (size) => set((state) => ({ cake: { ...state.cake, size } })),
      setLayers: (layers) => set((state) => ({ cake: { ...state.cake, layers } })),
      setFlavor: (flavor) => set((state) => ({ cake: { ...state.cake, flavor } })),
      setFilling: (filling) => set((state) => ({ cake: { ...state.cake, filling } })),
      setIcingColor: (icingColor) => set((state) => ({ cake: { ...state.cake, icingColor } })),
      
      setTiers: (tiers) => set((state) => ({ cake: { ...state.cake, tiers } })),
      setGlaze: (glaze) => set((state) => ({ cake: { ...state.cake, glaze } })),
      setPattern: (pattern) => set((state) => ({ cake: { ...state.cake, pattern } })),
      setStand: (stand) => set((state) => ({ cake: { ...state.cake, stand } })),
      toggleExplodedView: () => set((state) => ({ cake: { ...state.cake, explodedView: !state.cake.explodedView } })),
      
      setTheme: (theme) => set((state) => ({ cake: { ...state.cake, theme } })),
      setAutoRotate: (autoRotate) => set((state) => ({ cake: { ...state.cake, autoRotate } })),
      setShowCandle: (showCandle) => set((state) => ({ cake: { ...state.cake, showCandle } })),
      
      toggleTopping: (topping) => set((state) => {
        const exists = state.cake.toppings.find((t) => t.id === topping.id);
        const newToppings = exists
          ? state.cake.toppings.filter((t) => t.id !== topping.id)
          : [...state.cake.toppings, topping];
        return { cake: { ...state.cake, toppings: newToppings } };
      }),
      
      setCustomText: (customText) => set((state) => ({ cake: { ...state.cake, customText } })),
      setTextStyle: (style) => set((state) => ({ cake: { ...state.cake, ...style } })),
      setReferenceImage: (referenceImage) => set((state) => ({ cake: { ...state.cake, referenceImage } })),
      
      resetCake: () => {
         localStorage.removeItem('cake-design-storage');
         set({ cake: initialState });
      },
    }),
    {
      name: 'cake-design-storage',
      // Safe Storage Adapter to prevent JSON.parse errors
      storage: {
         getItem: (name) => {
           try {
             return localStorage.getItem(name);
           } catch {
             return null;
           }
         },
         setItem: (name, value) => {
           try {
             localStorage.setItem(name, value);
           } catch (e) {
             console.warn("Storage Full: Icing melted!", e);
           }
         },
         removeItem: (name) => localStorage.removeItem(name),
      },
      onRehydrateStorage: () => (state) => {
        if (!state || !state.cake?.shape) {
           console.warn("Corrupted State Detected. Purging...");
           localStorage.removeItem('cake-design-storage');
        }
      }
    }
  )
);

export default useCakeStore;
