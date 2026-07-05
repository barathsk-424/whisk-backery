import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import CakeModel from './CakeModel';
import useCakeStore from '../../../store/useCakeStore';

// ─── SUPPRESS KNOWN HARMLESS THREE.JS WARNINGS ───────────────────────────────
// THREE.Color alpha warnings: troika-three-text passes rgba() to outlineColor
// which is parsed by THREE.Color; alpha is intentionally handled by the Text
// component separately, so this warning is a false positive.
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' &&
     (args[0].includes('THREE.Clock') ||
      args[0].includes('PCFSoftShadowMap') ||
      args[0].includes('width(-1)') ||
      args[0].includes('height(-1)') ||
      args[0].includes('THREE.Color: Alpha component') ||
      args[0].includes('WebGL: CONTEXT_LOST') ||
      args[0].includes('WebGL: INVALID OPERATION'))) return;
  originalWarn(...args);
};

// ─── SUPPRESS THREE.WebGLRenderer context logs ────────────────────────────────
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' &&
      args[0].includes('THREE.WebGLRenderer: Context')) return;
  originalError(...args);
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
        camera={{ position: [0, 4, 10], fov: 45 }} 
        dpr={[1, 2]} 
        gl={{ 
            antialias: true, 
            preserveDrawingBuffer: true,
            toneMapping: THREE.ACESFilmicToneMapping, 
            toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => {
          // Handle WebGL context loss gracefully so the canvas auto-recovers
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => {
            e.preventDefault(); // allows context to be restored
          }, false);
          canvas.addEventListener('webglcontextrestored', () => {
            gl.setSize(canvas.clientWidth, canvas.clientHeight);
          }, false);
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
            target={[0, 1, 0]}
          />
        </Suspense>
      </Canvas>
      
      {/* Snapshot Trigger */}
      <button id="snap-btn" onClick={takeSnapshot} className="hidden" />
    </div>
  );
};

export default CakeCanvas;
