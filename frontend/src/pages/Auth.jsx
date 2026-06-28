import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Sun, Moon, Download, LogIn, UserPlus, Mail, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

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
        <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Background glowing rings */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

            {/* Top Tools Bar */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
                {showInstallBtn && (
                    <button
                        onClick={handleInstallClick}
                        className="w-10 h-10 rounded-xl bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center shadow-glow animate-pulse transition-all duration-200"
                        title="Install PWA Application"
                    >
                        <Download size={18} />
                    </button>
                )}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-all duration-200"
                    title="Toggle Theme"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>

            {/* Content Container */}
            <div className="w-full max-w-md relative z-10 flex flex-col items-center">
                {/* Brand Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow mx-auto mb-4">
                        <Wallet className="text-slate-900 dark:text-white" size={30} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-1">
                        Spendly
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {isLogin ? "Welcome back! Sign in to continue." : "Create an account to get started."}
                    </p>
                </div>

                {/* Main Auth Card Container */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-premium relative overflow-hidden"
                >
                    {/* Glowing Top Line Accent */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-indigo-500" />
                    
                    <div className="flex items-center gap-3 mb-8 justify-center">
                        {isLogin ? (
                            <LogIn size={20} className="text-brand-400" />
                        ) : (
                            <UserPlus size={20} className="text-brand-400" />
                        )}
                        <h2 className="text-lg font-bold text-slate-100">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </h2>
                    </div>

                    {/* Error Alerts */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 mb-6 text-center text-xs font-semibold text-rose-450 text-rose-400"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Google OAuth Login Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={signingIn}
                        className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 text-sm font-semibold hover:bg-white dark:bg-slate-900/35 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* Divider separator */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800/80" />
                        <span className="text-slate-550 text-slate-500 text-xs font-semibold uppercase tracking-wider">or</span>
                        <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-800/80" />
                    </div>

                    {/* Form submissions */}
                    <form onSubmit={handleEmailSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-750 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-600 text-sm transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-750 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-600 text-sm transition-all duration-200"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={signingIn} 
                            className="w-full py-4 mt-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                        >
                            {signingIn ? 'Processing Authentication...' : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    {/* Toggle between register and login */}
                    <div className="mt-8 text-center text-sm text-slate-450 text-slate-450">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => { setIsLogin(!isLogin); setError(''); }}
                            className="text-brand-400 hover:text-brand-350 font-bold transition-colors ml-1 focus:outline-none"
                        >
                            {isLogin ? 'Register' : 'Sign In'}
                        </button>
                    </div>
                </motion.div>

                {/* Footer brand values */}
                <p className="text-center mt-8 text-slate-500 text-xs font-medium tracking-wide">
                    Secure • Private • Cloud Synced
                </p>
            </div>
        </div>
    );
};

export default Auth;
