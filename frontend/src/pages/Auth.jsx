import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Sun, Moon, Download, LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [signingIn, setSigningIn] = useState(false);
    const { signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallBtn, setShowInstallBtn] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallBtn(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowInstallBtn(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setSigningIn(true);
        try {
            const userData = await signInWithGoogle();
            navigate(userData.isNewUser ? '/onboarding' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSigningIn(false);
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSigningIn(true);
        try {
            const userData = isLogin
                ? await signInWithEmail(email, password)
                : await signUpWithEmail(email, password);
            navigate(userData.isNewUser ? '/onboarding' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSigningIn(false);
        }
    };

    return (
        <div className="container animate-in" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px',
            position: 'relative'
        }}>
            {/* Top Tools */}
            <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                {showInstallBtn && (
                    <button
                        onClick={handleInstallClick}
                        style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}
                    >
                        <Download size={20} />
                    </button>
                )}
                <button
                    onClick={toggleTheme}
                    style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>

            {/* Branding Area */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    margin: '0 auto 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.5), inset 0 2px 4px rgba(255,255,255,0.2)',
                    color: 'white'
                }}>
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.75px', marginBottom: '8px' }}>
                    Expense Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {isLogin ? "Welcome back! Sign in to continue." : "Create an account to get started."}
                </p>
            </div>

            {/* Auth Card */}
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '420px',
                margin: '0 auto',
                padding: '32px',
                borderRadius: '28px',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(20px)'
            }}>
                <div className="flex items-center gap-3 mb-8" style={{ justifyContent: 'center' }}>
                    {isLogin ? <LogIn size={22} color="var(--primary)" /> : <UserPlus size={22} color="var(--primary)" />}
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </h2>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--expense)',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        fontWeight: '500',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                {/* Google Sign-In Button */}
                <button
                    id="google-sign-in-btn"
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    style={{
                        width: '100%',
                        padding: '14px 24px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        cursor: signingIn ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        opacity: signingIn ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    margin: '24px 0'
                }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>or</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '4px' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginLeft: '4px' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                <Lock size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={signingIn} style={{
                        marginTop: '4px',
                        padding: '16px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        borderRadius: '16px',
                        opacity: signingIn ? 0.7 : 1,
                        cursor: signingIn ? 'not-allowed' : 'pointer'
                    }}>
                        {signingIn ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-8" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        style={{
                            background: 'transparent',
                            color: 'var(--primary)',
                            fontWeight: '700',
                            padding: '0 4px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {isLogin ? 'Register' : 'Sign In'}
                    </button>
                </div>
            </div>

            {/* Footer Tagline */}
            <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Secure • Private • Simplified
            </p>
        </div>
    );
};

export default Auth;
