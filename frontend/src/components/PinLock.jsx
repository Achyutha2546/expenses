import React, { useState } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { Lock } from 'lucide-react';

const PinLock = () => {
    const { pin, verifyPin } = useSecurity();
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const pinLength = pin ? pin.length : 4;

    const handleInput = (val) => {
        if (input.length < pinLength) {
            const newVal = input + val;
            setInput(newVal);
            setError(false);
            if (newVal.length === pinLength) {
                if (!verifyPin(newVal)) {
                    setError(true);
                    setTimeout(() => {
                        setInput('');
                        setError(false);
                    }, 600);
                }
            }
        }
    };

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') {
                handleInput(e.key);
            } else if (e.key === 'Backspace') {
                handleDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [input, pinLength, verifyPin]);

    const handleDelete = () => {
        setInput(input.slice(0, -1));
        setError(false);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-dark)', zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
            fontFamily: 'Outfit, Inter, sans-serif'
        }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
            }}>
                <Lock size={40} color="var(--primary)" />
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>App Locked</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Enter your PIN to access your data</p>

            <div className="flex gap-4 mb-10" style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                {Array.from({ length: pinLength }).map((_, i) => (
                    <div key={i} style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: input.length > i ? 'var(--primary)' : 'var(--border)',
                        transition: 'all 0.2s ease',
                        transform: error ? 'translateX(0)' : 'none',
                        boxShadow: input.length > i ? '0 0 10px var(--primary)' : 'none'
                    }} className={error ? 'shake' : ''}></div>
                ))}
            </div>

            <div style={{ minHeight: '24px', marginBottom: '16px' }}>
                {error && <p style={{ color: 'var(--expense)', fontSize: '0.9rem', fontWeight: '500' }}>Incorrect PIN. Try again.</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '300px', width: '100%' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button key={n} onClick={() => handleInput(n.toString())} style={{
                        height: '64px', fontSize: '1.5rem', fontWeight: '600',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: '16px', color: 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {n}
                    </button>
                ))}
                <div></div>
                <button onClick={() => handleInput('0')} style={{
                    height: '64px', fontSize: '1.5rem', fontWeight: '600',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: '16px', color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    0
                </button>
                <button onClick={handleDelete} style={{
                    height: '64px', fontSize: '1.1rem', fontWeight: '600',
                    background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--border)',
                    borderRadius: '16px', color: 'var(--expense)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    Del
                </button>
            </div>
        </div>
    );
};

export default PinLock;
