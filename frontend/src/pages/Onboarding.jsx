import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { Wallet, Plus, Trash2, Landmark, ArrowRight, Rocket } from 'lucide-react';

const Onboarding = () => {
    const [sources, setSources] = useState([{ name: 'Cash', balance: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAddRow = () => {
        setSources([...sources, { name: '', balance: '' }]);
    };

    const handleRemoveRow = (index) => {
        setSources(sources.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newSources = [...sources];
        newSources[index][field] = value;
        setSources(newSources);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const validSources = sources.filter(s => s.name.trim() !== '');
        if (validSources.length === 0) {
            setError('Please add at least one account');
            setLoading(false);
            return;
        }

        try {
            await api.post('/sources/onboarding', {
                sources: validSources.map(s => ({
                    name: s.name,
                    balance: Number(s.balance) || 0
                }))
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to complete setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden">
            {/* Background glowing rings */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/10 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none" />

            {/* Onboarding Intro */}
            <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/15 text-brand-400 flex items-center justify-center mx-auto mb-4 border border-brand-500/20 shadow-glow">
                    <Rocket size={32} />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                    Setup your wallet
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Tell us about your current accounts and balances to initialize your Spendly ledger.
                </p>
            </div>

            {/* Form Card Container */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-xl p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-xl shadow-premium relative overflow-hidden"
            >
                {/* Top edge glow */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-500 to-indigo-500" />

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                        <AnimatePresence initial={false}>
                            {sources.map((source, index) => (
                                <motion.div 
                                    key={index}
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 relative group"
                                >
                                    <div className="flex items-center gap-2 mb-3 text-brand-400 font-bold text-xs uppercase tracking-wider">
                                        <Landmark size={14} />
                                        <span>Account {index + 1}</span>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <div className="flex-1 w-full">
                                            <input
                                                type="text"
                                                placeholder="Bank name, Cash, etc."
                                                value={source.name}
                                                onChange={(e) => handleChange(index, 'name', e.target.value)}
                                                required
                                                className="w-full px-0 py-2.5 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-600 text-sm font-semibold transition-colors duration-250"
                                            />
                                        </div>
                                        
                                        <div className="w-full sm:w-36 flex items-center gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    placeholder="Balance ₹"
                                                    value={source.balance}
                                                    onChange={(e) => handleChange(index, 'balance', e.target.value)}
                                                    required
                                                    className="w-full px-0 py-2.5 bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-brand-500 outline-none text-slate-250 text-slate-800 dark:text-slate-200 placeholder-slate-600 text-sm font-bold transition-colors duration-250"
                                                />
                                            </div>
                                            
                                            {sources.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRow(index)}
                                                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                                    title="Remove Account"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/20 hover:bg-white dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all duration-200 hover:scale-[1.01]"
                    >
                        <Plus size={18} /> Add Another Account
                    </button>

                    <AnimatePresence>
                        {error && (
                            <motion.p 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-rose-450 text-rose-450 text-xs font-semibold text-center mt-2"
                            >
                                {error}
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-base flex items-center justify-center gap-3 shadow-glow hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200"
                    >
                        {loading ? 'Finalizing Setup...' : <>Complete Setup <ArrowRight size={20} /></>}
                    </button>
                </form>
            </motion.div>

            <p className="text-center mt-8 text-slate-500 text-xs font-medium tracking-wide">
                Step 2 of 2: Capital Ledger Initialization
            </p>
        </div>
    );
};

export default Onboarding;
