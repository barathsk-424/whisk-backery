import React, { useMemo, useRef, Suspense } from 'react';
import * as THREE from 'three';
import { Text3D, Center, ContactShadows, Environment, Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useCakeStore from '../../../store/useCakeStore';

const flavorColors = {
  Vanilla: '#F3E5AB', // Richer Butter Cream Gold
  Chocolate: '#3D1F1F', // Deep Dutch Dark Cocoa
  'Red Velvet': '#9B1B30', // Ruby Velvet Crimson
  Strawberry: '#FF4D6D', // Vibrant Berry Pink
  'Black Forest': '#23120B', // Intense Bittersweet cocoa
  Pineapple: '#FFCC33', // Deep Tropical Mango-Yellow
};

const CandleFlame = () => {
  const flameRef = useRef();
  useFrame((state) => {
    if (flameRef.current) {
      const time = performance.now() / 1000;
      const s = 1 + Math.sin(time * 10) * 0.1;
      flameRef.current.scale.set(s, s * 1.5, s);
      flameRef.current.position.y = 0.4 + Math.sin(time * 5) * 0.05;
    }
  });
  return (
    <group position={[0, 0.5, 0]}>
       <mesh ref={flameRef}>
          <coneGeometry args={[0.08, 0.25, 8]} />
          <meshStandardMaterial color="#FF9D00" emissive="#FF4500" emissiveIntensity={6} transparent opacity={0.9} />
       </mesh>
       <pointLight intensity={3} distance={4} color="#FF9D00" />
    </group>
  );
};

const fillingColors = {
  Buttercream: '#FFFDD0', // Silk Cream
  Ganache: '#2E1A11', // Molten Chocolate
  'Cream Cheese': '#FDF5E6', // Velvety Ivory
  'Fruit Jam': '#C41E3A', // Vibrant Ruby Jam
  Nutella: '#4B2D1F', // Nutty Hazelnut Gloss
};

const CakeModel = () => {
  const { cake } = useCakeStore();
  const { 
    shape, size, layers, flavor, filling, icingColor, toppings, 
    customText, textColor, textSize, bevelSize, bevelThickness,
    showCandle 
  } = cake;

  const h = 0.8;
  const baseScale = 2.2 + (size * 0.2);
  const cakeColor = flavorColors[flavor] || flavorColors.Vanilla;
  const fillingColor = fillingColors[filling] || fillingColors.Buttercream;

  const heartShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -3); 
    s.bezierCurveTo(0, -3, -1.5, -4.5, -3, -3); 
    s.bezierCurveTo(-4.5, -1.5, -3, 1.5, 0, 3);
    s.bezierCurveTo(3, 1.5, 4.5, -1.5, 3, -3); 
    s.bezierCurveTo(1.5, -4.5, 0, -3, 0, -3);
    return s;
  }, []);

  const extrudeSettings = { bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3 };

  return (
    <group position={[0, -0.5, 0]}>
      {/* ── PLATE ─────────────────────────────────── */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
         <cylinderGeometry args={[baseScale + 0.5, baseScale + 1, 0.2, 64]} />
         <meshPhysicalMaterial color="#ffffff" transmission={0} roughness={0.1} clearcoat={1} />
      </mesh>

      {/* ── CAKE LAYERS ───────────────────────────── */}
      <group>
        {Array.from({ length: layers }).map((_, i) => {
          // Tapering logic: each layer is progressively smaller
          const layerScale = 1 - (i * 0.15); 
          const r = baseScale;
          const layerGap = 0.12; 
          const yPos = (i * (h + layerGap)) + (h / 2);

          return (
            <group key={i} position={[0, yPos, 0]} scale={[layerScale, 1, layerScale]}>
               {/* Sponge Core */}
               <mesh castShadow receiveShadow rotation={shape === 'heart' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
                  {shape === 'round' ? <cylinderGeometry args={[r, r, h, 64]} /> :
                   shape === 'heart' ? <extrudeGeometry args={[heartShape, { depth: h, ...extrudeSettings }]} /> :
                   shape === 'rectangle' ? <boxGeometry args={[r * 2.8, h, r * 1.8]} /> :
                   <boxGeometry args={[r*2, h, r*2]} />}
                  <meshPhysicalMaterial color={cakeColor} roughness={0.8} />
               </mesh>

               {/* Icing Shell */}
               <mesh scale={[1.02, 1.01, 1.02]} position={[0, 0.01, 0]} rotation={shape === 'heart' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
                  {shape === 'round' ? <cylinderGeometry args={[r, r, h, 64]} /> :
                   shape === 'heart' ? <extrudeGeometry args={[heartShape, { depth: h, ...extrudeSettings }]} /> :
                   shape === 'rectangle' ? <boxGeometry args={[r * 2.8, h, r * 1.8]} /> :
                   <boxGeometry args={[r*2, h, r*2]} />}
                  <meshPhysicalMaterial 
                    color={icingColor === '#FFFFFF' ? cakeColor : icingColor} 
                    roughness={0.3} 
                    clearcoat={0.8} 
                    clearcoatRoughness={0.2}
                    transmission={0.05}
                    thickness={0.1}
                  />
               </mesh>

               {/* Precision Internal Filling Layer */}
               {i < layers - 1 && (
                  <group position={[0, h/2 + layerGap/2, 0]}>
                    <mesh rotation={shape === 'heart' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
                        {shape === 'round' ? <cylinderGeometry args={[r, r, layerGap, 64]} /> :
                         shape === 'heart' ? <extrudeGeometry args={[heartShape, { depth: layerGap, ...extrudeSettings }]} /> :
                         shape === 'rectangle' ? <boxGeometry args={[r * 2.8, layerGap, r * 1.8]} /> :
                         <boxGeometry args={[r*2, layerGap, r*2]} />}
                        <meshPhysicalMaterial 
                          color={fillingColor} 
                          roughness={0.15} 
                          clearcoat={1} 
                          clearcoatRoughness={0.1}
                          reflectivity={1}
                        />
                    </mesh>
                  </group>
               )}
            </group>
          );
        })}
      </group>

      {/* ── TOPPINGS (REALISTIC MODULES) ──────────── */}
      <group position={[0, layers * (h + 0.12) + 0.1, 0]}>
         {toppings.map((t, i) => {
            const angle = (i / toppings.length) * Math.PI * 2;
            const topLayerScale = 1 - ((layers - 1) * 0.15);
            const r = shape === 'rectangle' ? (baseScale * topLayerScale * 0.9) : (baseScale * topLayerScale * 0.8);
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;

            return (
              <group key={i} position={[x, 0, z]} rotation={[0, -angle, 0]}>
                 {t.id === 'strawberry' ? (
                   <mesh castShadow scale={[0.8, 1, 0.8]}>
                      <coneGeometry args={[0.2, 0.35, 12]} />
                      <meshPhysicalMaterial color="#dc2626" roughness={0.1} clearcoat={1} />
                   </mesh>
                 ) : t.id === 'macarons' ? (
                   <group scale={0.7}>
                      <mesh position={[0, 0.1, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.1, 16]} /><meshPhysicalMaterial color="#FFB6C1" roughness={0.4} /></mesh>
                      <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.21, 0.21, 0.05, 16]} /><meshStandardMaterial color="#ffffff" /></mesh>
                      <mesh position={[0, -0.1, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.1, 16]} /><meshPhysicalMaterial color="#FFB6C1" roughness={0.4} /></mesh>
                   </group>
                 ) : t.id === 'chocolate' ? (
                   <group>
                      <mesh position={[0.1, 0, 0]} castShadow><boxGeometry args={[0.15, 0.15, 0.15]} /><meshStandardMaterial color="#3C1F0E" /></mesh>
                      <mesh position={[-0.05, 0, 0.1]} castShadow><boxGeometry args={[0.15, 0.15, 0.15]} /><meshStandardMaterial color="#3C1F0E" /></mesh>
                   </group>
                 ) : t.id === 'berries' ? (
                   <group>
                      <mesh position={[0.08, 0, 0]} castShadow><sphereGeometry args={[0.08, 12, 12]} /><meshPhysicalMaterial color="#4A1D1D" roughness={0.1} /></mesh>
                      <mesh position={[-0.05, 0, 0.06]} castShadow><sphereGeometry args={[0.08, 12, 12]} /><meshPhysicalMaterial color="#4A1D1D" roughness={0.1} /></mesh>
                      <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.08, 12, 12]} /><meshPhysicalMaterial color="#4A1D1D" roughness={0.1} /></mesh>
                   </group>
                 ) : t.id === 'goldleaf' ? (
                   <mesh rotation={[Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
                      <circleGeometry args={[0.15, 8]} />
                      <meshStandardMaterial color="#FFD700" metalness={1} roughness={0.1} transparent opacity={0.8} />
                   </mesh>
                 ) : (
                   <mesh castShadow><boxGeometry args={[0.1, 0.1, 0.1]} /><meshStandardMaterial color="#ffffff" /></mesh>
                 )}
              </group>
            );
         })}
      </group>

      {/* ── INSCRIPTION ───────────────────────────── */}
      {customText && (
        <Suspense fallback={<mesh><boxGeometry args={[0.1, 0.1, 0.1]}/><meshStandardMaterial color={textColor}/></mesh>}>
          <group position={[0, layers * (h + 0.12) + 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Center top>
              <Text3D 
                font="/fonts/helvetiker_regular.typeface.json" 
                size={textSize || 0.12} 
                height={0.05} 
                bevelEnabled 
                bevelThickness={bevelThickness || 0.01} 
                bevelSize={bevelSize || 0.01}
                bevelSegments={3}
              >
                {customText}
                <meshStandardMaterial color={textColor || '#4A2A1A'} roughness={0.1} metalness={0.5} />
              </Text3D>
            </Center>
          </group>
        </Suspense>
      )}

      {/* ── ATMOSPHERIC ELEMENTS ──────────────────── */}
      {showCandle && (
        <group position={[0, layers * (h + 0.12) + 0.4, -0.8]}>
           <mesh castShadow><cylinderGeometry args={[0.03, 0.03, 0.8, 16]} /><meshStandardMaterial color="#38bdf8" /></mesh>
           <CandleFlame />
        </group>
      )}
      
      <Sparkles count={40} scale={10} size={2} speed={0.4} opacity={0.2} color={icingColor} />
      <ContactShadows resolution={1024} scale={15} blur={2.5} opacity={0.4} far={10} color="#000000" position={[0, -0.6, 0]} />
    </group>
  );
};

export default CakeModel;
