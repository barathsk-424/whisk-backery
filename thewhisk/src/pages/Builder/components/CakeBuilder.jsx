import React, { useState } from 'react';
import './CakeBuilder.css';

/* ── Shape → price map ──────────────────────── */
const QUOTES = { round: 3500, square: 4000, heart: 4500, rectangle: 5000 };

/* ── Text-position config per shape ────────── */
const TEXT_STYLE_MAP = {
  round:     { top: '50%',  left: '50%', transform: 'translate(-50%, -50%)' },
  square:    { top: '50%',  left: '50%', transform: 'translate(-50%, -50%)' },
  rectangle: { top: '50%',  left: '50%', transform: 'translate(-50%, -50%)' },
  // Heart: slightly above visual centre
  heart:     { top: '40%',  left: '50%', transform: 'translate(-50%, -45%)' },
};

/* ══════════════════════════════════════════════
   CakeBuilder – main component
══════════════════════════════════════════════ */
const CakeBuilder = () => {
  const [selectedShape, setSelectedShape] = useState('round');
  const [cakeText, setCakeText]           = useState('');
  const [estimatedQuote, setEstimatedQuote] = useState(QUOTES.round);

  const handleShapeChange = (shape) => {
    setSelectedShape(shape);
    setEstimatedQuote(QUOTES[shape]);
  };

  const shapeLabel = {
    round: 'Round', square: 'Square',
    heart: 'Heart', rectangle: 'Rectangle',
  }[selectedShape];

  return (
    <div className="cb-container">
      {/* ── Sidebar ──────────────────────────── */}
      <aside className="cb-sidebar">
        <div className="cb-sidebar-logo">🧁 Cake Studio</div>
        <nav className="cb-sidebar-nav">
          {['BASE SHAPE','SIZE & MASS','LAYERING','FLAVOR PALETTE','FILLING','EXTERIOR ICING'].map(item => (
            <div key={item} className="cb-nav-item">{item}</div>
          ))}
        </nav>
      </aside>

      {/* ── Main area ────────────────────────── */}
      <main className="cb-main">
        <h1 className="cb-title">{shapeLabel} Strawberry Cake</h1>

        {/* Live preview */}
        <div className="cb-preview-wrapper">
          <div className="cb-preview-label">LIVE PREVIEW</div>
          <Cake3DRenderer shape={selectedShape} text={cakeText} />
        </div>

        {/* Shape buttons */}
        <div className="cb-shape-grid">
          {['round','square','heart','rectangle'].map(shape => (
            <button
              key={shape}
              id={`shape-btn-${shape}`}
              className={`cb-shape-btn ${selectedShape === shape ? 'active' : ''}`}
              onClick={() => handleShapeChange(shape)}
            >
              <span className="cb-shape-icon">
                {shape === 'round'     ? '⬤' :
                 shape === 'square'    ? '▪' :
                 shape === 'heart'     ? '♥' : '▬'}
              </span>
              {shape.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Text input */}
        <div className="cb-text-section">
          <label className="cb-text-label" htmlFor="cake-inscription">
            ✦ Bespoke Inscription
          </label>
          <input
            id="cake-inscription"
            type="text"
            value={cakeText}
            maxLength={24}
            onChange={e => setCakeText(e.target.value)}
            placeholder="Enter text on cake…"
            className="cb-text-input"
          />
        </div>

        {/* Bottom actions */}
        <div className="cb-actions">
          <div className="cb-quote">
            ESTIMATED QUOTE<br />
            <span className="cb-quote-price">₹{estimatedQuote.toLocaleString()}</span>
          </div>
          <button className="cb-btn cb-btn-archive">ARCHIVE DESIGN</button>
          <button className="cb-btn cb-btn-prev">PREVIOUS</button>
          <button className="cb-btn cb-btn-next">NEXT STEP</button>
        </div>
      </main>
    </div>
  );
};

/* ══════════════════════════════════════════════
   Cake3DRenderer – dispatches to shape component
══════════════════════════════════════════════ */
const Cake3DRenderer = ({ shape, text }) => {
  const textStyle = TEXT_STYLE_MAP[shape] || TEXT_STYLE_MAP.round;
  const props = { text, textStyle };

  switch (shape) {
    case 'square':    return <SquareCake    {...props} />;
    case 'heart':     return <HeartCake     {...props} />;
    case 'rectangle': return <RectangleCake {...props} />;
    default:          return <RoundCake     {...props} />;
  }
};

/* ── Text overlay (shared) ──────────────────── */
const CakeText = ({ text, textStyle }) =>
  text ? (
    <div className="cake-text" style={textStyle} aria-label={`Cake inscription: ${text}`}>
      {text}
    </div>
  ) : null;

/* ── Round Cake ─────────────────────────────── */
const RoundCake = ({ text, textStyle }) => (
  <div className="cake round-cake">
    <div className="plate round-plate" />
    <div className="layer round-layer layer-3" />
    <div className="layer round-layer layer-2" />
    <div className="layer round-layer layer-1" />
    <CakeText text={text} textStyle={textStyle} />
  </div>
);

/* ── Square Cake ────────────────────────────── */
const SquareCake = ({ text, textStyle }) => (
  <div className="cake square-cake">
    <div className="plate round-plate" />
    <div className="layer square-layer layer-3" />
    <div className="layer square-layer layer-2" />
    <div className="layer square-layer layer-1" />
    <CakeText text={text} textStyle={textStyle} />
  </div>
);

/* ── Heart Cake ─────────────────────────────── */
const HeartCake = ({ text, textStyle }) => (
  <div className="cake heart-cake">
    <div className="plate round-plate" />
    {/* CSS heart using ::before and ::after pseudo-elements via a div */}
    <div className="heart-body" />
    <CakeText text={text} textStyle={textStyle} />
  </div>
);

/* ── Rectangle Cake ─────────────────────────── */
const RectangleCake = ({ text, textStyle }) => (
  <div className="cake rectangle-cake">
    <div className="plate rect-plate" />
    <div className="layer rect-layer layer-3" />
    <div className="layer rect-layer layer-2" />
    <div className="layer rect-layer layer-1" />
    <CakeText text={text} textStyle={textStyle} />
  </div>
);

export default CakeBuilder;
