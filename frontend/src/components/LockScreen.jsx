import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { Lock, Unlock } from 'lucide-react';

// Reusable SVG Pattern Component
export const PatternPad = ({ onComplete, hasError, resetError }) => {
    const [path, setPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currX, setCurrX] = useState(null);
    const [currY, setCurrY] = useState(null);
    const containerRef = useRef(null);

    const PAD_SIZE = 280;
    const SPACING = PAD_SIZE / 3;

    const getDotCenter = (index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        return {
            x: col * SPACING + SPACING / 2,
            y: row * SPACING + SPACING / 2
        };
    };

    const getTouchPos = (e) => {
        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleStart = (e) => {
        if (hasError) resetError();
        const pos = getTouchPos(e);
        if (!pos) return;
        setIsDrawing(true);
        setPath([]);
        setCurrX(pos.x);
        setCurrY(pos.y);
        checkHit(pos);
    };

    const handleMove = (e) => {
        if (!isDrawing) return;
        // prevent scrolling
        if (e.cancelable) e.preventDefault(); 
        
        const pos = getTouchPos(e);
        if (!pos) return;
        setCurrX(pos.x);
        setCurrY(pos.y);
        checkHit(pos);
    };

    const handleEnd = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        setCurrX(null);
        setCurrY(null);
        if (path.length > 0) {
            onComplete(path.join('-'));
            // Wait for verification before clearing
            setTimeout(() => setPath([]), 800);
        }
    };

    const checkHit = (pos) => {
        for (let i = 0; i < 9; i++) {
            if (path.includes(i)) continue;
            const center = getDotCenter(i);
            const dist = Math.hypot(pos.x - center.x, pos.y - center.y);
            if (dist < 30) { // hit radius
                setPath(prev => [...prev, i]);
                break;
            }
        }
    };

    // Construct SVG Polyline path
    let d = '';
    path.forEach((dotIndex, i) => {
        const c = getDotCenter(dotIndex);
        if (i === 0) d += `M ${c.x} ${c.y}`;
        else d += ` L ${c.x} ${c.y}`;
    });
    if (isDrawing && currX !== null && path.length > 0) {
        d += ` L ${currX} ${currY}`;
    }

    const lineColor = hasError ? 'var(--expense)' : 'var(--primary)';

    return (
        <div 
            ref={containerRef}
            className={hasError ? 'shake' : ''}
            style={{
                position: 'relative', width: PAD_SIZE, height: PAD_SIZE,
                touchAction: 'none', margin: '0 auto', background: 'transparent'
            }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
        >
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <path d={d} fill="none" stroke={lineColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" 
                    style={{ transition: 'stroke 0.3s ease' }} />
            </svg>

            {Array.from({ length: 9 }).map((_, i) => {
                const c = getDotCenter(i);
                const isActive = path.includes(i);
                return (
                    <div key={i} style={{
                        position: 'absolute',
                        left: c.x - 25, top: c.y - 25,
                        width: '50px', height: '50px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            width: isActive ? '18px' : '10px',
                            height: isActive ? '18px' : '10px',
                            borderRadius: '50%',
                            background: isActive ? lineColor : 'rgba(255,255,255,0.2)',
                            boxShadow: isActive ? `0 0 15px ${lineColor}` : 'none',
                            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                        }} />
                    </div>
                );
            })}
        </div>
    );
};

export const PinPad = ({ onComplete, hasError, resetError }) => {
    const [input, setInput] = useState('');
    
    // Configurable pin length from backend? Default 4.
    const pinLength = 4;

    const handleInput = useCallback((val) => {
        if (hasError) resetError();
        if (input.length < pinLength) {
            const newVal = input + val;
            setInput(newVal);
            if (newVal.length === pinLength) {
                onComplete(newVal);
                setTimeout(() => setInput(''), 800);
            }
        }
    }, [input, pinLength, hasError, resetError, onComplete]);

    const handleDelete = useCallback(() => {
        if (hasError) resetError();
        setInput(input.slice(0, -1));
    }, [input, hasError, resetError]);

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') handleInput(e.key);
            else if (e.key === 'Backspace') handleDelete();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleInput, handleDelete]);

    return (
        <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
            <div className={`flex gap-4 mb-10 justify-center ${hasError ? 'shake' : ''}`} style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
                {Array.from({ length: pinLength }).map((_, i) => (
                    <div key={i} style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: input.length > i ? 'var(--primary)' : 'var(--border)',
                        transition: 'all 0.2s ease',
                        boxShadow: input.length > i ? '0 0 10px var(--primary)' : 'none',
                        border: hasError && input.length > i ? '2px solid var(--expense)' : 'none',
                        backgroundColor: hasError && input.length > i ? 'var(--expense)' : (input.length > i ? 'var(--primary)' : 'var(--border)')
                    }}></div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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

export default function LockScreen() {
    const { lockType, verifyLock, hasRecovery, sendOtpAPI, verifyOtpAPI } = useSecurity();
    const [verifying, setVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const [failures, setFailures] = useState(0);
    const [disabledUntil, setDisabledUntil] = useState(null);
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [recoveryOtp, setRecoveryOtp] = useState('');
    const [recoveryError, setRecoveryError] = useState('');
    
    const hasError = !!errorMsg || !!recoveryError;
    const isDisabled = disabledUntil && disabledUntil > Date.now();

    const handleVerify = async (credentials) => {
        setVerifying(true);
        setErrorMsg('');
        const res = await verifyLock(credentials);
        setVerifying(false);

        if (res.success) {
            setSuccess(true);
            setFailures(0);
        } else {
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
            const nextFailures = failures + 1;
            setFailures(nextFailures);
            if (nextFailures >= 3) {
                setErrorMsg('Too many attempts! Wait 10 seconds.');
                setDisabledUntil(Date.now() + 10000);
                setTimeout(() => {
                    setDisabledUntil(null);
                    setFailures(0);
                    setErrorMsg('');
                }, 10000);
            } else {
                setErrorMsg(res.message || 'Incorrect');
            }
        }
    };

    return (
        <div className={success ? 'fade-out-scale' : ''} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-dark)',
            backgroundColor: 'rgba(10, 10, 15, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '20px',
            fontFamily: 'Outfit, Inter, sans-serif'
        }}>
            <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: success ? 'rgba(52, 168, 83, 0.15)' : (hasError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: success ? '0 0 20px rgba(52, 168, 83, 0.3)' : (hasError ? '0 0 20px rgba(239, 68, 68, 0.3)' : '0 0 20px rgba(139, 92, 246, 0.3)'),
                transition: 'all 0.3s'
            }}>
                {success ? <Unlock size={40} color="#34a853" /> : <Lock size={40} color={hasError ? "var(--expense)" : "var(--primary)"} />}
            </div>

            <h2 className={success ? 'fade-in-text' : ''} style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
                {success ? 'Welcome back' : (recoveryMode ? 'Account Recovery' : 'App Locked')}
            </h2>
            <p style={{ color: hasError ? 'var(--expense)' : 'var(--text-secondary)', marginBottom: '40px', minHeight: '24px' }}>
                {recoveryMode 
                    ? (recoveryError ? recoveryError : (otpSent ? 'Enter the 6-digit OTP sent to your email' : 'Enter your registered email address'))
                    : (errorMsg ? errorMsg : (lockType === 'pattern' ? 'Draw your pattern' : 'Enter your PIN'))
                }
            </p>

            {recoveryMode ? (
                <div className="flex flex-col gap-4 w-full" style={{ maxWidth: '300px' }}>
                    {!otpSent ? (
                        <>
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={recoveryEmail} 
                                onChange={(e) => { setRecoveryEmail(e.target.value); setRecoveryError(''); }} 
                                autoFocus
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '1rem', textAlign: 'center' }}
                            />
                            <button 
                                onClick={async () => {
                                    if (!recoveryEmail.trim()) return;
                                    setVerifying(true);
                                    setRecoveryError('');
                                    const res = await sendOtpAPI(recoveryEmail);
                                    setVerifying(false);
                                    if (res.success) {
                                        setOtpSent(true);
                                    } else {
                                        setRecoveryError(res.message || 'Failed to send OTP');
                                    }
                                }}
                                style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '600' }}
                            >
                                Send OTP
                            </button>
                        </>
                    ) : (
                        <>
                            <input 
                                type="text" 
                                placeholder="6-digit OTP" 
                                value={recoveryOtp} 
                                onChange={(e) => { setRecoveryOtp(e.target.value); setRecoveryError(''); }} 
                                autoFocus
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '1rem', textAlign: 'center', letterSpacing: '4px' }}
                            />
                            <button 
                                onClick={async () => {
                                    if (!recoveryOtp.trim()) return;
                                    setVerifying(true);
                                    setRecoveryError('');
                                    const res = await verifyOtpAPI(recoveryEmail, recoveryOtp);
                                    setVerifying(false);
                                    if (res.success) {
                                        setSuccess(true);
                                    } else {
                                        setRecoveryError(res.message || 'Incorrect OTP');
                                    }
                                }}
                                style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: '600' }}
                            >
                                Verify OTP
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => {
                            setRecoveryMode(false);
                            setOtpSent(false);
                            setRecoveryEmail('');
                            setRecoveryOtp('');
                            setRecoveryError('');
                        }}
                        style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '12px', borderRadius: '12px', fontWeight: '600' }}
                    >
                        Return to Lock
                    </button>
                 </div>
            ) : isDisabled ? (
                <div style={{ textAlign: 'center', margin: '40px 0', opacity: 0.5, color: 'var(--expense)' }}>
                    <Lock size={48} style={{ margin: '0 auto 16px' }} />
                    <p style={{ fontWeight: '600' }}>Locked Out</p>
                </div>
            ) : (
                <div style={{ pointerEvents: verifying ? 'none' : 'auto', opacity: verifying ? 0.7 : 1 }}>
                    {lockType === 'pin' ? (
                        <PinPad onComplete={(pin) => handleVerify({ pin })} hasError={hasError} resetError={() => setErrorMsg('')} />
                    ) : (
                        <PatternPad onComplete={(pattern) => handleVerify({ pattern })} hasError={hasError} resetError={() => setErrorMsg('')} />
                    )}
                </div>
            )}
            
            {!recoveryMode && !isDisabled && (
                <button 
                    onClick={() => { setRecoveryMode(true); setErrorMsg(''); }}
                    style={{ marginTop: '24px', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}
                >
                    Forgot Lock?
                </button>
            )}
            
            <div style={{ minHeight: '24px', marginTop: '20px' }}>
                {verifying && <p style={{ color: 'var(--primary)', fontWeight: '500', animation: 'pulse 1.5s infinite' }}>Verifying...</p>}
            </div>
        </div>
    );
}
