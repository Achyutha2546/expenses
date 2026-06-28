import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
    Wallet, 
    Shield, 
    Zap, 
    BarChart3, 
    ArrowRight, 
    Smartphone, 
    Globe, 
    PieChart,
    CheckCircle2
} from 'lucide-react';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/auth');
    };

    // Framer motion variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#070a13] text-slate-100 selection:bg-brand-500 selection:text-white relative overflow-hidden">
            {/* Background decorative glowing orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 bg-[#070a13]/80 backdrop-blur-md border-b border-slate-900">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow">
                            <Wallet className="text-slate-900 dark:text-white" size={22} />
                        </div>
                        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            Spendly
                        </span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/auth')} 
                            className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors"
                        >
                            Sign In
                        </button>
                        <button 
                            onClick={() => navigate('/auth')} 
                            className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            Join Now
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="max-w-4xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div 
                        variants={fadeInUp}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-8"
                    >
                        <Zap size={14} /> New: Internal Transfers & Offline Sync
                    </motion.div>

                    {/* Headline */}
                    <motion.h1 
                        variants={fadeInUp}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-8 text-slate-900 dark:text-white"
                    >
                        Master Your Money <br/>
                        <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
                            Without Stress.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p 
                        variants={fadeInUp}
                        className="text-lg md:text-xl text-slate-450 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
                    >
                        Track every rupee, set smart budgets, and see your wealth grow with our premium expense tracker. Designed for speed, security, and offline support.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div 
                        variants={fadeInUp}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                    >
                        <button 
                            onClick={handleGetStarted} 
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center justify-center gap-2 shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            Get Started Now <ArrowRight size={18} />
                        </button>
                        <button 
                            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-350 hover:text-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 font-semibold transition-all duration-200"
                        >
                            Browse Features
                        </button>
                    </motion.div>
                </motion.div>

                {/* Dashboard Preview Mockup */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                    className="max-w-5xl mx-auto p-2 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 shadow-premium relative overflow-hidden backdrop-blur-sm"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-500" />
                    
                    <div className="bg-[#0b0f19] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 min-h-[400px]">
                        {/* Fake Sidebar */}
                        <div className="hidden md:flex flex-col gap-4 w-48 border-r border-slate-900 pr-6">
                            <div className="w-24 h-6 rounded-lg bg-slate-200 dark:bg-slate-800/80 animate-pulse" />
                            <div className="space-y-3 mt-4">
                                <div className="w-full h-9 rounded-xl bg-brand-500/10 border border-brand-500/20" />
                                <div className="w-full h-9 rounded-xl bg-slate-200 dark:bg-slate-800/40" />
                                <div className="w-full h-9 rounded-xl bg-slate-200 dark:bg-slate-800/40" />
                            </div>
                        </div>
                        
                        {/* Fake Dashboard Body */}
                        <div className="flex-1 space-y-6">
                            {/* Header row */}
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800/80" />
                                    <div className="w-32 h-6 rounded-lg bg-slate-100 dark:bg-slate-850" />
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850" />
                            </div>

                            {/* Balance Card row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="col-span-2 p-5 rounded-2xl bg-gradient-to-br from-brand-600/90 to-indigo-600/90 text-left relative overflow-hidden">
                                    <div className="absolute right-[-10px] top-[-10px] w-24 h-24 rounded-full bg-white/5" />
                                    <span className="text-[11px] font-bold text-brand-200 uppercase tracking-widest">Total Balance</span>
                                    <h4 className="text-2xl md:text-3xl font-extrabold mt-1 text-slate-900 dark:text-white">₹1,45,280</h4>
                                    <div className="mt-6 flex justify-between items-center text-xs text-brand-200">
                                        <span>•••• 5512</span>
                                        <span>VISA</span>
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between text-left">
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Monthly Budget</span>
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs font-bold mb-1">
                                            <span>Spent 68%</span>
                                            <span className="text-slate-350">₹50,000</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className="w-[68%] h-full bg-brand-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent activities */}
                            <div className="space-y-3 text-left">
                                <div className="w-28 h-5 rounded bg-slate-200 dark:bg-slate-800/80" />
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/40 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-450 flex items-center justify-center">
                                            <Zap size={16} />
                                        </div>
                                        <span className="text-sm font-semibold">Salary Income</span>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-450">+₹95,000</span>
                                </div>
                                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/40 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-450 flex items-center justify-center">
                                            <PieChart size={16} />
                                        </div>
                                        <span className="text-sm font-semibold">Starbucks Coffee</span>
                                    </div>
                                    <span className="text-sm font-bold text-rose-450">-₹420</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-slate-900">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                        Everything You Need
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Powerful financial tools to simplify your cash flows and budgets in a gorgeous interface.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: Shield, title: 'Safe & Secure', desc: 'Enterprise-grade local storage encryption and optional biometric PIN locks.' },
                        { icon: Smartphone, title: 'Offline First PWA', desc: 'Installs as an app. Access, edit and append entries offline, sync instantly.' },
                        { icon: BarChart3, title: 'Deep Analytics', desc: 'Visually break down your cash flow by categories, sources, and months.' },
                        { icon: Globe, title: 'Multi-Account', desc: 'Manage your cash, card and bank account ledger balances in one workspace.' }
                    ].map((feat, i) => (
                        <div 
                            key={i} 
                            className="p-8 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 hover:border-slate-200 dark:border-slate-800 hover:bg-white dark:bg-slate-900/60 transition-all duration-300 group shadow-premium"
                        >
                            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-white transition-all duration-200">
                                <feat.icon size={22} />
                            </div>
                            <h3 className="text-lg font-bold mb-3 text-slate-100">{feat.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-7xl mx-auto px-6 py-12">
                <div className="relative rounded-[32px] bg-gradient-to-tr from-slate-900 to-brand-950 p-10 md:p-20 text-center border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-premium">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-600/10 blur-[100px] pointer-events-none" />
                    
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
                            Ready to take control?
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg mb-10 leading-relaxed">
                            Join thousands of users who have transformed their spending habits and goals with Spendly.
                        </p>
                        <button 
                            onClick={handleGetStarted} 
                            className="px-10 py-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold inline-flex items-center gap-2 shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            Create Free Account <ArrowRight size={18} />
                        </button>
                        <div className="mt-8 flex flex-wrap gap-6 justify-center text-xs text-slate-600 dark:text-slate-400">
                            <span className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={14} /> No hidden fees</span>
                            <span className="flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={14} /> Privacy first storage</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow">
                        <Wallet className="text-slate-900 dark:text-white" size={18} />
                    </div>
                    <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                        Spendly
                    </span>
                </div>
                <p className="text-xs text-slate-500">
                    © 2026 Spendly. Built with passion for premium finance. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default Landing;
