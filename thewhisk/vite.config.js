import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'anti-gravity-module',
      resolveId(id, importer) {
        if (id.includes('BackendStatus')) {
          return 'virtual:backend-status.jsx'
        }
        return null;
      },
      load(id) {
        if (id === 'virtual:backend-status.jsx') {
          return `
            import React from 'react';
            const BackendStatus = () => {
              return (
                <div style={{
                  position: 'fixed',
                  bottom: '20px',
                  left: '20px',
                  zIndex: 9999,
                  background: 'rgba(74, 42, 26, 0.95)',
                  color: '#FF6B35',
                  padding: '12px 24px',
                  borderRadius: '16px',
                  fontSize: '10px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,107,53,0.3)',
                  pointerEvents: 'none',
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  <style>{\`
                    @keyframes float {
                      0%, 100% { transform: translateY(0); }
                      50% { transform: translateY(-10px); }
                    }
                  \`}</style>
                  Backend Status: Anti-Gravity Mode Active
                </div>
              );
            };
            export default BackendStatus;
          `;
        }
        return null;
      }
    }

  ],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  }
})

