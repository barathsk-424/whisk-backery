import React from "react";
import useCakeStore from "../../../store/useCakeStore";

const ControlsPanel = ({ currentStep }) => {
  const {
    cake,
    setShape,
    setSize,
    setLayers,
    setFlavor,
    setFilling,
    setIcingColor,
    toggleTopping,
    setCustomText,
    setTextStyle,
    setReferenceImage,
    setShowCandle,
  } = useCakeStore();

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Shape
        return (
          <div className="grid grid-cols-2 gap-6">
            {[
              { id: "round", icon: "⭕", label: "Round" },
              { id: "square", icon: "⬜", label: "Square" },
              { id: "heart", icon: "❤️", label: "Heart" },
              { id: "rectangle", icon: "➖", label: "Rectangle" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setShape(s.id)}
                className={`p-8 rounded-3xl border-4 transition-all flex flex-col items-center gap-4 group ${
                  cake.shape === s.id
                    ? "border-primary bg-primary/5 ring-8 ring-primary/10 shadow-xl scale-105"
                    : "border-brown-50 bg-white hover:border-primary hover:bg-brown-50 shadow-sm"
                }`}
              >
                <span className="text-4xl group-hover:scale-125 transition-transform">
                  {s.icon}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${cake.shape === s.id ? "text-primary" : "text-brown-400"}`}
                >
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        );

      case 1: // Size
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              {[
                { v: 0, l: "Small (0.5kg)", s: "6-8 SERVINGS" },
                { v: 1, l: "Medium (1kg)", s: "12-15 SERVINGS" },
                { v: 2, l: "Large (2kg)", s: "20-25 SERVINGS" },
              ].map((sz) => (
                <button
                  key={sz.v}
                  onClick={() => setSize(sz.v)}
                  className={`w-full p-6 rounded-2xl border-4 transition-all flex items-center justify-between group ${
                    cake.size === sz.v
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-brown-50 bg-white hover:bg-brown-50"
                  }`}
                >
                  <div className="text-left">
                    <p
                      className={`text-sm font-black uppercase ${cake.size === sz.v ? "text-primary" : "text-brown-600"}`}
                    >
                      {sz.l}
                    </p>
                    <p className="text-[10px] font-bold text-brown-400">
                      {sz.s}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-4 transition-all ${cake.size === sz.v ? "border-primary bg-primary" : "border-brown-200"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        );

      case 2: // Layering
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((l) => (
                <button
                  key={l}
                  onClick={() => setLayers(l)}
                  className={`p-6 rounded-2xl border-4 flex items-center justify-between transition-all ${
                    cake.layers === l
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-brown-50 bg-white hover:bg-brown-50"
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-black uppercase text-primary">
                      {l} {l === 1 ? "Layer" : "Layers"}
                    </span>
                    <span className="text-[10px] font-bold text-brown-400">
                      {l === 1
                        ? "Single Tier"
                        : l === 2
                          ? "Double Tier Stack"
                          : "Triple Tier Grand"}
                    </span>
                  </div>
                  <div className="flex gap-1 h-8 items-end">
                    {Array.from({ length: l }).map((_, i) => (
                      <div
                        key={i}
                        className="w-4 bg-primary/30 border border-primary/50"
                        style={{ height: `${(i + 1) * 30}%` }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3: // Flavors
        return (
          <div className="grid grid-cols-2 gap-4">
            {[
              "Vanilla",
              "Chocolate",
              "Red Velvet",
              "Strawberry",
              "Black Forest",
              "Pineapple",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFlavor(f)}
                className={`p-6 rounded-2xl border-4 transition-all flex flex-col items-start gap-2 ${
                  cake.flavor === f
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-brown-50 bg-white hover:bg-brown-50"
                }`}
              >
                <div
                  className="w-full aspect-square rounded-xl mb-2 flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor:
                      f === "Vanilla"
                        ? "#F3E5AB"
                        : f === "Chocolate"
                          ? "#3D1F1F"
                          : f === "Red Velvet"
                            ? "#9B1B30"
                            : f === "Strawberry"
                              ? "#FF4D6D"
                              : f === "Black Forest"
                                ? "#23120B"
                                : "#FFCC33",
                    color: ["Chocolate", "Red Velvet", "Black Forest"].includes(
                      f,
                    )
                      ? "#fff"
                      : "#000",
                  }}
                >
                  {f[0]}
                </div>
                <span className="text-[10px] font-black uppercase text-primary">
                  {f}
                </span>
              </button>
            ))}
          </div>
        );

      case 4: // Filling
        return (
          <div className="grid grid-cols-2 gap-4">
            {[
              "Buttercream",
              "Ganache",
              "Cream Cheese",
              "Fruit Jam",
              "Nutella",
            ].map((f) => (
              <button
                key={f}
                onClick={() => setFilling(f)}
                className={`p-6 rounded-2xl border-4 transition-all text-center ${
                  cake.filling === f
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-brown-50 bg-white hover:bg-brown-50"
                }`}
              >
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                  {f}
                </span>
              </button>
            ))}
          </div>
        );

      case 5: // Icing
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-4">
              {[
                "#FFFFFF",
                "#FFB7C5",
                "#FDE0D9",
                "#FFF5BA",
                "#C1E1C1",
                "#B2DAFA",
                "#E6E6FA",
                "#4A2A1A",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => setIcingColor(c)}
                  className={`w-full aspect-square rounded-2xl border-4 transition-all hover:scale-110 ${
                    cake.icingColor === c
                      ? "border-primary ring-4 ring-primary/20 shadow-lg"
                      : "border-transparent shadow-sm"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        );

      case 6: // Modules & Art
        return (
          <div className="space-y-10 pb-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brown-400 uppercase tracking-widest flex items-center gap-2">
                ✨ Digital Modules
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "strawberry",
                  "chocolate",
                  "macarons",
                  "goldleaf",
                  "sprinkles",
                  "berries",
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() =>
                      toggleTopping({ id: t, name: t, price: 100 })
                    }
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                      cake.toppings.find((it) => it.id === t)
                        ? "border-accent bg-accent/5"
                        : "border-brown-50 hover:bg-brown-50"
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase text-primary">
                      {t}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${cake.toppings.find((it) => it.id === t) ? "bg-accent" : "bg-brown-100"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-brown-50">
              <h4 className="text-[10px] font-black text-brown-400 uppercase tracking-widest">
                Bespoke Inscription
              </h4>
              <input
                type="text"
                maxLength={15}
                value={cake.customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Happy Birthday..."
                className="w-full bg-white border border-brown-100 rounded-xl px-4 py-4 text-sm font-bold text-primary outline-none focus:border-primary transition-all shadow-sm"
              />
              <div className="flex gap-2">
                {["#4A2A1A", "#FFFFFF", "#DC2626", "#EAB308"].map((tc) => (
                  <button
                    key={tc}
                    onClick={() => setTextStyle({ textColor: tc })}
                    className={`h-12 flex-1 rounded-xl border-2 transition-all ${cake.textColor === tc ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-80 hover:opacity-100"}`}
                    style={{ backgroundColor: tc }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-brown-50 font-sans">
              <h4 className="text-[10px] font-black text-brown-400 uppercase tracking-widest flex items-center justify-between">
                🖋️ Typographic Styles
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    id: "modern",
                    name: "Modern",
                    style: {
                      textSize: 0.1,
                      bevelSize: 0.01,
                      bevelThickness: 0.01,
                    },
                  },
                  {
                    id: "classic",
                    name: "Classic",
                    style: {
                      textSize: 0.14,
                      bevelSize: 0.02,
                      bevelThickness: 0.02,
                    },
                  },
                  {
                    id: "bespoke",
                    name: "Bespoke",
                    style: {
                      textSize: 0.12,
                      bevelSize: 0.03,
                      bevelThickness: 0.04,
                    },
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTextStyle(s.style)}
                    className={`py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${
                      cake.textSize === s.style.textSize
                        ? "border-primary bg-primary text-white shadow-md"
                        : "border-brown-50 hover:bg-brown-50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-brown-50 font-sans">
              <h4 className="text-[10px] font-black text-brown-400 uppercase tracking-widest flex items-center justify-between">
                📸 Artisan Inspiration
                <span className="text-[9px] font-bold opacity-60 italic text-primary">
                  UPLOAD REF
                </span>
              </h4>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (loadEvt) =>
                        setReferenceImage(loadEvt.target?.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all bg-white shadow-sm hover:shadow-md ${
                    cake.referenceImage
                      ? "border-accent bg-accent/5"
                      : "border-brown-100 hover:border-accent"
                  }`}
                >
                  {cake.referenceImage ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={cake.referenceImage}
                        alt="Ref"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">
                          Change Image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-10 h-10 bg-brown-50 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-[11px] font-bold text-primary italic">
                        Drop design inspiration here
                      </p>
                      <p className="text-[9px] text-brown-400 font-medium tracking-tight">
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-brown-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => setShowCandle(!cake.showCandle)}
                  className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${cake.showCandle ? "bg-accent" : "bg-brown-100"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${cake.showCandle ? "left-7 px-1" : "left-1"}`}
                  />
                </div>
                <span className="text-[10px] font-black uppercase text-brown-400 tracking-widest">
                  Celebration Candle
                </span>
              </div>
              <span className="text-[10px] font-black text-accent">+ ₹150</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-white/50 shadow-luxury h-full overflow-y-auto artisan-scrollbar">
      {renderStepContent()}
    </div>
  );
};

export default ControlsPanel;
