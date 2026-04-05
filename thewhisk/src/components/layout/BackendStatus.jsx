import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const BackendStatus = () => {
    const location = useLocation();
    const [status, setStatus] = useState('Checking...');
    const [dotColor, setDotColor] = useState('#F59E0B'); // Orange/Amber

    // Only show on Admin/Command Hub routes
    const isAdminRoute = location.pathname.startsWith('/admin') || 
                        location.pathname.startsWith('/finance') || 
                        location.pathname.startsWith('/stock');

    useEffect(() => {
        if (!isAdminRoute) {
            setStatus('Checking...');
            return;
        }
        
        const checkConnection = async () => {
            try {
                // 1. Check Supabase connectivity
                const { error: supabaseError } = await supabase
                    .from('invoices')
                    .select('id')
                    .limit(1);

                if (supabaseError) throw new Error('Supabase Off-Signal');

                // 2. Check Backend API connectivity
                const apiUrl = import.meta.env.VITE_API_URL || "https://whisk-backery.onrender.com";
                let backendOk = false;
                try {
                    const res = await fetch(`${apiUrl}/api/products`);
                    if (res.ok) backendOk = true;
                } catch (e) {
                    console.warn('[BackendStatus] API Link Broken');
                }

                if (backendOk) {
                    setStatus('✅ ALL SYSTEMS ONLINE');
                    setDotColor('#10B981'); // Green
                } else {
                    setStatus('⚠️ BACKEND OFFLINE');
                    setDotColor('#F59E0B'); // Orange
                }
            } catch (err) {
                console.error('[BackendStatus] Sync Failure:', err.message);
                setStatus('❌ SYSTEM FAILURE');
                setDotColor('#EF4444'); // Red
            }
        };

        checkConnection();
        const interval = setInterval(checkConnection, 15000); // Check every 15s
        return () => clearInterval(interval);
    }, [isAdminRoute]);

    if (!isAdminRoute) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #E5E7EB',
            padding: '10px 16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            transition: 'all 0.3s ease'
        }}>
            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: dotColor,
                boxShadow: `0 0 10px ${dotColor}`,
                animation: status.includes('✅') ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#374151'
            }}>
                {status}
            </span>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default BackendStatus;
