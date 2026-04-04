import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import CakeModel from './CakeModel';
import useCakeStore from '../../../store/useCakeStore';

// ─── SUPPRESS THREE.JS DEP WARNINGS ───────────
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && 
     (args[0].includes('THREE.Clock') || 
      args[0].includes('PCFSoftShadowMap'))) return;
  originalWarn(...args);
};

const CakeCanvas = () => {
  const { cake, autoRotate } = useCakeStore();
  const theme = cake.theme || 'light';

  const takeSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.setAttribute('download', `WHISK-CAKE-${Date.now()}.png`);
      link.setAttribute('href', canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream'));
      link.click();
    }
  };

  return (
    <div className="w-full h-full relative">
      <Canvas 
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [0, 5, 10], fov: 45 }} 
        dpr={[1, 2]} 
        gl={{ 
            antialias: true, 
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping, 
            toneMappingExposure: 1.1,
        }}
      >
        <color attach="background" args={[theme === 'dark' ? '#1a1a1a' : '#FAF5F0']} />
        
        <Suspense fallback={<group><mesh><sphereGeometry args={[0.5, 32, 32]}/><meshStandardMaterial color="#FF6B35" emissive="#FF6B35" emissiveIntensity={0.5}/></mesh></group>}>
          {/* Studio Lighting - High Intensity for Phys Units */}
          <ambientLight intensity={1.5} />
          <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={500} castShadow />
          <pointLight position={[-10, 10, -10]} intensity={200} />
          
          <Environment preset="apartment" />
          
          <group position={[0, -0.5, 0]}>
            <CakeModel />
            <ContactShadows 
              position={[0, -0.01, 0]} 
              opacity={0.6} 
              scale={15} 
              blur={2.4} 
              far={10} 
              resolution={512} 
              color="#000000" 
            />
          </group>
          
          <OrbitControls 
            makeDefault 
            autoRotate={autoRotate} 
            autoRotateSpeed={0.5} 
            enablePan={false}
            enableRotate={true}
            minDistance={6}
            maxDistance={15}
            target={[0, 2, 0]}
          />
        </Suspense>
      </Canvas>
      
      {/* Snapshot Trigger */}
      <button id="snap-btn" onClick={takeSnapshot} className="hidden" />
    </div>
  );
};

export default CakeCanvas;
