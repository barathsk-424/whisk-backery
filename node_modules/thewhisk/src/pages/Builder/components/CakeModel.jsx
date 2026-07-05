import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text, ContactShadows, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useCakeStore from '../../../store/useCakeStore';

const flavorColors = {
  Vanilla: '#F3E5AB', Chocolate: '#3D1F1F', 'Red Velvet': '#9B1B30',
  Strawberry: '#FF4D6D', 'Black Forest': '#23120B', Pineapple: '#FFCC33',
};
const fillingColors = {
  Buttercream: '#FFFDD0', Ganache: '#2E1A11', 'Cream Cheese': '#FDF5E6',
  'Fruit Jam': '#C41E3A', Nutella: '#4B2D1F',
};

/* ── Candle flame ─────────────────────────── */
const CandleFlame = () => {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const t = performance.now() / 1000;
    const s = 1 + Math.sin(t * 10) * 0.1;
    ref.current.scale.set(s, s * 1.5, s);
    ref.current.position.y = 0.4 + Math.sin(t * 5) * 0.05;
  });
  return (
    <group position={[0, 0.5, 0]}>
      <mesh ref={ref}>
        <coneGeometry args={[0.08, 0.25, 8]} />
        <meshStandardMaterial color="#FF9D00" emissive="#FF4500" emissiveIntensity={6} transparent opacity={0.9} />
      </mesh>
      <pointLight intensity={3} distance={4} color="#FF9D00" />
    </group>
  );
};

/* ── Toppings ─────────────────────────────── */
const Strawberry = () => (
  <group>
    <mesh castShadow scale={[0.9, 1.1, 0.9]}>
      <coneGeometry args={[0.22, 0.4, 12]} />
      <meshPhysicalMaterial color="#dc2626" roughness={0.1} clearcoat={1} />
    </mesh>
    <mesh position={[0, 0.22, 0]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#166534" />
    </mesh>
  </group>
);

const ChocolateChunk = () => (
  <group>
    <mesh position={[0.12, 0, 0.05]} castShadow rotation={[0.2, 0.3, 0.1]}>
      <boxGeometry args={[0.18, 0.12, 0.18]} />
      <meshStandardMaterial color="#3C1F0E" roughness={0.4} />
    </mesh>
    <mesh position={[-0.08, 0.02, -0.08]} castShadow rotation={[-0.1, 0.5, 0.2]}>
      <boxGeometry args={[0.15, 0.1, 0.15]} />
      <meshStandardMaterial color="#5C2E14" roughness={0.4} />
    </mesh>
    <mesh position={[0.0, 0, 0.12]} castShadow rotation={[0.1, -0.2, 0.3]}>
      <boxGeometry args={[0.14, 0.1, 0.14]} />
      <meshStandardMaterial color="#3C1F0E" roughness={0.4} />
    </mesh>
  </group>
);

const Macaron = () => (
  <group>
    <mesh position={[0, 0.07, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.1, 18]} />
      <meshPhysicalMaterial color="#FFB6C1" roughness={0.4} />
    </mesh>
    <mesh>
      <cylinderGeometry args={[0.21, 0.21, 0.05, 18]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    <mesh position={[0, -0.07, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.1, 18]} />
      <meshPhysicalMaterial color="#FFB6C1" roughness={0.4} />
    </mesh>
  </group>
);

const GoldLeaf = () => (
  <group>
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.18, 8]} />
      <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.05} transparent opacity={0.9} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0.5, 0]}>
      <circleGeometry args={[0.14, 7]} />
      <meshStandardMaterial color="#FFC200" metalness={1} roughness={0.05} transparent opacity={0.7} />
    </mesh>
  </group>
);

const SprinklesGroup = () => {
  const sprinkles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      x: (Math.random() - 0.5) * 0.5,
      z: (Math.random() - 0.5) * 0.5,
      ry: Math.random() * Math.PI,
      color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#B8B8FF'][i % 6],
    }));
  }, []);
  return (
    <group>
      {sprinkles.map((sp, i) => (
        <mesh key={i} position={[sp.x, 0.01, sp.z]} rotation={[Math.PI / 2, 0, sp.ry]}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 6]} />
          <meshStandardMaterial color={sp.color} />
        </mesh>
      ))}
    </group>
  );
};

const BerriesGroup = () => (
  <group>
    <mesh position={[0.1, 0, 0]} castShadow><sphereGeometry args={[0.1, 12, 12]} /><meshPhysicalMaterial color="#6B2737" roughness={0.1} clearcoat={1} /></mesh>
    <mesh position={[-0.09, 0, 0.08]} castShadow><sphereGeometry args={[0.09, 12, 12]} /><meshPhysicalMaterial color="#7B2D8B" roughness={0.1} clearcoat={1} /></mesh>
    <mesh position={[0.02, 0, -0.1]} castShadow><sphereGeometry args={[0.1, 12, 12]} /><meshPhysicalMaterial color="#6B2737" roughness={0.1} clearcoat={1} /></mesh>
  </group>
);

const ToppingRenderer = ({ id }) => {
  switch (id) {
    case 'strawberry': return <Strawberry />;
    case 'chocolate':  return <ChocolateChunk />;
    case 'macarons':   return <Macaron />;
    case 'goldleaf':   return <GoldLeaf />;
    case 'sprinkles':  return <SprinklesGroup />;
    case 'berries':    return <BerriesGroup />;
    default: return null;
  }
};

/*
  Heart shape in XY plane, sized to radius r.
  Mesh rotation = [-PI/2, 0, 0]:
    local-Z → world +Y (UP — extrusion grows upward ✓)
*/
const buildHeart = (r) => {
  const s = new THREE.Shape();
  s.moveTo(0, -r * 0.85);
  s.bezierCurveTo( r*0.45, -r*0.5,  r,      -r*0.25,  r,      r*0.15);
  s.bezierCurveTo( r,       r*0.5,   r*0.5,  r*0.72,   0,      r*0.38);
  s.bezierCurveTo(-r*0.5,   r*0.72, -r,      r*0.5,   -r,      r*0.15);
  s.bezierCurveTo(-r,      -r*0.25, -r*0.45,-r*0.5,    0,     -r*0.85);
  return s;
};

/* ── Main CakeModel ───────────────────────── */
const CakeModel = () => {
  const { cake } = useCakeStore();
  const {
    shape, size, layers, flavor, filling, icingColor, toppings,
    customText, textColor, textSize, textStyle, textX, textZ, showCandle,
  } = cake;

  const h        = 0.8;
  const gap      = 0.12;
  const r        = 2.2 + size * 0.2;
  const cakeCol  = flavorColors[flavor]  || flavorColors.Vanilla;
  const fillCol  = fillingColors[filling] || fillingColors.Buttercream;
  const icingCol = (icingColor === '#FFFFFF' || !icingColor) ? cakeCol : icingColor;

  const heartShape = useMemo(() => buildHeart(r), [r]);
  const heartEx    = useMemo(() => ({ depth: h,   bevelEnabled: false }), [h]);
  const heartGapEx = useMemo(() => ({ depth: gap, bevelEnabled: false }), [gap]);

  // Top surface Y (local space, before outer group offset -0.5)
  const topY = layers * h + (layers - 1) * gap;

  // Text: map store textSize (0.06–0.40) to readable 3D size (0.2–1.4)
  const fontSize3d = Math.max(0.2, (textSize || 0.22) * 3.5);

  // Contrast-aware outline color
  const isDarkText = textColor && parseInt(textColor.replace('#',''), 16) < 0x888888;
  // Outline color uses solid hex — THREE.Color does NOT support alpha in rgba()
  // Bright white on dark text backgrounds, near-black on light backgrounds
  const outlineCol = isDarkText ? '#e8e8e8' : '#1a1a1a';

  // Text position
  const heartZBase = shape === 'heart' ? -r * 0.08 : 0;
  const maxTX = shape === 'heart' ? r * 0.55 : r * 1.2;
  const maxTZ = shape === 'heart' ? r * 0.55 : r * 1.2;
  const texPosX = Math.max(-maxTX, Math.min(maxTX, textX || 0));
  const texPosZ = Math.max(-maxTZ, Math.min(maxTZ, (textZ || 0) + heartZBase));

  // Typographic style visual properties — INDEPENDENT of textSize
  const styleProps = {
    modern:  { fontWeight: '300', letterSpacing: 0.08,  fontStyle: 'normal' },
    classic: { fontWeight: '700', letterSpacing: 0.015, fontStyle: 'italic' },
    bespoke: { fontWeight: '900', letterSpacing: -0.01, fontStyle: 'normal' },
  }[textStyle || 'classic'] || { fontWeight: '700', letterSpacing: 0.015, fontStyle: 'italic' };

  /*
   * Heart-specific topping positions [x, z] in world space.
   *
   * IMPORTANT: The heart's top layer group is scaled by topLayerTaper
   * (= 1 - (layers-1)*0.12, e.g. 0.88 for 2 layers).
   * So the VISIBLE top surface only extends to r*topLayerTaper in each direction.
   * All slot fractions below are relative to ht = r * topLayerTaper,
   * ensuring every topping is guaranteed inside the actual rendered surface.
   *
   * Heart boundary summary (in ht units, world XZ):
   *   Tip toward camera:    z ≈ +0.85
   *   Lobe top (away):      z ≈ -0.38 (at x=0), z ≈ -0.50 (at x=±0.5)
   *   Widest X extent:      x ≈ ±1.00 (at z ≈ -0.15)
   *
   * All 6 slots kept within |x| < 0.52 and z ∈ (-0.32, +0.12) for safety.
   */
  const topLayerTaper = 1 - (layers - 1) * 0.12;
  const ht = r * topLayerTaper; // effective radius of the top heart surface
  const heartToppingSlots = useMemo(() => [
    [ ht * 0.50, -ht * 0.18],  // right lobe  (safe: lobe boundary ≈ -0.50)
    [-ht * 0.50, -ht * 0.18],  // left lobe
    [ ht * 0.44,  ht * 0.10],  // right mid   (safe: tip boundary ≈ +0.85)
    [-ht * 0.44,  ht * 0.10],  // left mid
    [ ht * 0.22, -ht * 0.30],  // right inner (safe: lobe @x=0.22 ≈ -0.40)
    [-ht * 0.22, -ht * 0.30],  // left inner
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [r, topLayerTaper]);

  return (
    <group position={[0, -0.5, 0]}>

      {/* ── Plate ─────────────────────────── */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <cylinderGeometry args={[r + 0.6, r + 1.1, 0.2, 64]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.1} clearcoat={1} />
      </mesh>

      {/* ── Cake layers ───────────────────── */}
      {Array.from({ length: layers }).map((_, i) => {
        const taper   = 1 - i * 0.12;
        const yBottom = i * (h + gap);

        if (shape === 'heart') {
          return (
            <group key={i} position={[0, yBottom, 0]} scale={[taper, 1, taper]}>
              <mesh castShadow receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <extrudeGeometry args={[heartShape, heartEx]} />
                <meshPhysicalMaterial color={cakeCol} roughness={0.8} />
              </mesh>
              <mesh scale={[1.025, 1, 1.025]} rotation={[-Math.PI / 2, 0, 0]}>
                <extrudeGeometry args={[heartShape, { ...heartEx, depth: h * 1.015 }]} />
                <meshPhysicalMaterial color={icingCol} roughness={0.3} clearcoat={0.9}
                  clearcoatRoughness={0.2} transmission={0.04} thickness={0.1} />
              </mesh>
              {i < layers - 1 && (
                <mesh position={[0, h, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <extrudeGeometry args={[heartShape, heartGapEx]} />
                  <meshPhysicalMaterial color={fillCol} roughness={0.15} clearcoat={1} />
                </mesh>
              )}
            </group>
          );
        }

        const yMid = yBottom + h / 2;
        const SpnGeo  = shape === 'round'     ? <cylinderGeometry args={[r, r, h, 64]} />
                      : shape === 'square'    ? <boxGeometry args={[r*2, h, r*2]} />
                      : shape === 'rectangle' ? <boxGeometry args={[r*2.8, h, r*1.8]} />
                      : <cylinderGeometry args={[r, r, h, 64]} />;
        const FillGeo = shape === 'round'     ? <cylinderGeometry args={[r, r, gap, 64]} />
                      : shape === 'square'    ? <boxGeometry args={[r*2, gap, r*2]} />
                      : shape === 'rectangle' ? <boxGeometry args={[r*2.8, gap, r*1.8]} />
                      : <cylinderGeometry args={[r, r, gap, 64]} />;

        return (
          <group key={i} position={[0, yMid, 0]} scale={[taper, 1, taper]}>
            <mesh castShadow receiveShadow>
              {SpnGeo}<meshPhysicalMaterial color={cakeCol} roughness={0.8} />
            </mesh>
            <mesh scale={[1.025, 1.01, 1.025]} position={[0, 0.01, 0]}>
              {SpnGeo}<meshPhysicalMaterial color={icingCol} roughness={0.3} clearcoat={0.9}
                clearcoatRoughness={0.2} transmission={0.04} thickness={0.1} />
            </mesh>
            {i < layers - 1 && (
              <group position={[0, h/2 + gap/2, 0]}>
                <mesh>{FillGeo}<meshPhysicalMaterial color={fillCol} roughness={0.15} clearcoat={1} /></mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* ── Toppings ──────────────────────────────────────────────────────────
        Evenly distributed around the perimeter of the top surface.
        Each topping is fully implemented (all 6 types).
      ────────────────────────────────────────────────────────────────────── */}
      {toppings.length > 0 && (
        <group position={[0, topY + 0.05, 0]}>
          {toppings.map((t, i) => {
            if (shape === 'heart') {
              // Use pre-computed safe positions inside the heart boundary
              const slot = heartToppingSlots[i % heartToppingSlots.length];
              const [hx, hz] = slot;
              return (
                <group key={t.id} position={[hx, 0, hz]}>
                  <ToppingRenderer id={t.id} />
                </group>
              );
            }
            // For all other shapes: evenly-spaced circle at 72% of cake radius
            const angle = (i / toppings.length) * Math.PI * 2;
            const taper = 1 - (layers - 1) * 0.12;
            const rad   = r * taper * 0.72;
            return (
              <group
                key={t.id}
                position={[Math.cos(angle) * rad, 0, Math.sin(angle) * rad]}
                rotation={[0, -angle, 0]}
              >
                <ToppingRenderer id={t.id} />
              </group>
            );
          })}
        </group>
      )}

      {/* ── INSCRIPTION ───────────────────────────────────────────────────────
        <Text> = troika-three-text = true 3D geometry that rotates with cake.
        anchorX/anchorY guarantee perfect centering on every shape.
        outlineWidth + outlineColor give contrast on any cake colour.
      ────────────────────────────────────────────────────────────────────── */}
      {customText && (
        <Text
          position={[texPosX, topY + 0.09, texPosZ]}
          rotation={[-Math.PI / 2, 0, 0]}
          anchorX="center"
          anchorY="middle"
          fontSize={fontSize3d}
          color={textColor || '#4A2A1A'}
          outlineWidth={fontSize3d * 0.05}
          outlineColor={outlineCol}
          maxWidth={shape === 'heart' ? r * 1.2 : r * 1.55}
          textAlign="center"
          fontWeight={styleProps.fontWeight}
          letterSpacing={styleProps.letterSpacing}
          fontStyle={styleProps.fontStyle}
        >
          {customText}
        </Text>
      )}

      {/* ── Candle ────────────────────────── */}
      {showCandle && (
        <group position={[0, topY + 0.4, -0.8]}>
          <mesh castShadow><cylinderGeometry args={[0.03,0.03,0.8,16]}/><meshStandardMaterial color="#38bdf8"/></mesh>
          <CandleFlame />
        </group>
      )}

      <Sparkles count={40} scale={10} size={2} speed={0.4} opacity={0.2} color={icingColor || '#ffffff'} />
      <ContactShadows resolution={1024} scale={15} blur={2.5} opacity={0.4} far={10} color="#000000" position={[0,-0.6,0]} />
    </group>
  );
};

export default CakeModel;
