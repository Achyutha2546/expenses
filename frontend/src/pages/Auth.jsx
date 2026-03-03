import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LogIn, UserPlus, Mail, Lock, CheckCircle2, Sun, Moon, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useEffect } from 'react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/signup';
            const { data } = await api.post(endpoint, { email, password });
            login(data);
            navigate(isLogin ? '/' : '/onboarding');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
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
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                    color: 'white'
                }}>
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.75px', marginBottom: '8px' }}>
                    Expense Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    {isLogin ? "Welcome back! Login to your account." : "Start tracking your expenses today."}
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
                        {isLogin ? 'Login' : 'Create Account'}
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{
                        marginTop: '12px',
                        padding: '16px',
                        fontSize: '1rem',
                        fontWeight: '700',
                        borderRadius: '16px'
                    }}>
                        {isLogin ? 'Login Now' : 'Join Now'}
                    </button>
                </form>

                <div className="mt-8" style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
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
