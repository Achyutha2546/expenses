import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Landmark, 
    Calendar, 
    FileText, 
    TrendingUp, 
    TrendingDown, 
    AlertCircle,
    Info,
    CheckCircle
} from 'lucide-react';

const AddEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingTransaction = location.state?.transaction;
    const defaultType = location.state?.defaultType || 'expense';

    const getLocalTime = (date = new Date()) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState(() => {
        const base = {
            type: defaultType,
            amount: '',
            sourceId: '',
            toSourceId: '',
            date: getLocalTime(),
            purpose: '',
            source: '',
            category: 'General',
            isRecurring: false,
            frequency: 'monthly'
        };
        if (editingTransaction) {
            return {
                ...base,
                type: editingTransaction.type,
                amount: editingTransaction.amount,
                sourceId: editingTransaction.sourceId,
                toSourceId: editingTransaction.toSourceId || '',
                date: getLocalTime(new Date(editingTransaction.date)),
                purpose: editingTransaction.purpose || '',
                source: editingTransaction.source || '',
                category: editingTransaction.category || 'General',
                isRecurring: editingTransaction.isRecurring || false,
                frequency: editingTransaction.frequency || 'monthly'
            };
        }
        return base;
    });
    
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [toast, setToast] = useState(null);

    const categories = [
        { name: 'Food', emoji: '🍔' },
        { name: 'Transport', emoji: '🚗' },
        { name: 'Shopping', emoji: '🛍️' },
        { name: 'Entertainment', emoji: '🎬' },
        { name: 'Utilities', emoji: '💡' },
        { name: 'Health', emoji: '💊' },
        { name: 'Investment', emoji: '📈' },
        { name: 'General', emoji: '💸' }
    ];

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const fetchSources = async () => {
            try {
                const { data } = await api.get('/sources');
                setSources(data);

                if (!editingTransaction && data.length > 0) {
                    setFormData(prev => ({ 
                        ...prev, 
                        sourceId: data[0]._id, 
                        toSourceId: data.length > 1 ? data[1]._id : '' 
                    }));
                }
            } catch (err) {
                console.error('Error fetching sources', err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchSources();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [editingTransaction]);

    useEffect(() => {
        if (formData.type === 'transfer' && formData.sourceId && sources.length > 0) {
            if (formData.toSourceId === formData.sourceId || !formData.toSourceId) {
                const firstAvailable = sources.find(s => s._id !== formData.sourceId);
                if (firstAvailable) {
                    setFormData(prev => ({ ...prev, toSourceId: firstAvailable._id }));
                }
            }
        }
    }, [formData.sourceId, formData.type, sources]);

    const KEYWORD_MAP = {
        'Food': ['swiggy', 'zomato', 'blinkit', 'zepto', 'restaurant', 'mcdonald', 'kfc', 'starbucks', 'grocery', 'dinner', 'lunch', 'breakfast', 'coffee', 'bakery', 'cafe', 'food'],
        'Transport': ['uber', 'ola', 'rapido', 'petrol', 'fuel', 'metro', 'bus', 'train', 'flight', 'taxi', 'indianoil', 'shell', 'hpcl', 'cab'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'clothes', 'shoes', 'mall', 'shopping', 'nykaa', 'meesho', 'zara', 'h&m'],
        'Entertainment': ['netflix', 'hotstar', 'prime', 'spotify', 'movie', 'pvr', 'theatre', 'gaming', 'cinema', 'bookmyshow', 'multiplex', 'club'],
        'Utilities': ['electricity', 'water', 'gas', 'wifi', 'internet', 'recharge', 'rent', 'bill', 'mobile', 'broadband', 'jio', 'airtel', 'vi'],
        'Investment': ['stock', 'mutual fund', 'crypto', 'sip', 'gold', 'zerodha', 'groww', 'policy', 'insurance', 'upstox', 'angelone'],
        'Health': ['hospital', 'doctor', 'medicine', 'pharmacy', 'gym', 'health', 'clinic', 'apollo', 'pharmeasy', 'practo']
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if ((name === 'purpose' || name === 'source') && (!formData.category || formData.category === 'General')) {
            const lowerValue = value.toLowerCase();
            for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
                if (keywords.some(kw => lowerValue.includes(kw))) {
                    newFormData.category = category;
                    break;
                }
            }
        }

        setFormData(newFormData);
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = { 
            ...formData,
            isRecurring: formData.isRecurring,
            frequency: formData.frequency
        };
        
        if (payload.date) {
            payload.date = new Date(payload.date).toISOString();
        }

        if (payload.type !== 'transfer') {
            delete payload.toSourceId;
        }
        if (payload.type === 'income') {
            delete payload.purpose;
        } else {
            delete payload.source;
        }

        try {
            let response;
            if (editingTransaction) {
                response = await api.put(`/transactions/${editingTransaction._id}`, payload);
            } else {
                response = await api.post('/transactions', payload);
            }

            if (response.offlineSaved) {
                showToast('Saved offline — will sync automatically ☁', 'info');
            } else if (editingTransaction) {
                showToast('Transaction updated successfully!', 'success');
            } else {
                showToast('Transaction added successfully!', 'success');
            }
            
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error saving transaction', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="container flex justify-center items-center min-h-[75vh]">
                <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div className="container relative max-w-2xl">
            {/* Custom Premium Toast alerts */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-premium border text-xs font-semibold ${
                            toast.type === 'success' 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' 
                                : toast.type === 'error'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-450'
                        }`}
                    >
                        {toast.type === 'success' && <CheckCircle size={16} />}
                        {toast.type === 'error' && <AlertCircle size={16} />}
                        {toast.type === 'info' && <Info size={16} />}
                        <span>{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header toolbar */}
            <header className="flex items-center justify-between mb-8 px-1">
                <button 
                    onClick={() => navigate(-1)} 
                    className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingTransaction ? 'Edit Transaction' : (formData.type === 'transfer' ? 'Transfer Funds' : 'Record Transaction')}
                </h1>
                <div className="w-10 h-10 opacity-0" /> {/* Spacer */}
            </header>

            {/* Transaction Type Sliding Tab */}
            <div className="p-1 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex mb-8">
                {['expense', 'income', 'transfer'].map(type => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type, category: type === 'transfer' ? '' : prev.category || 'General' }))}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize transition-all duration-200 ${
                            formData.type === type 
                                ? 'bg-brand-600 text-white shadow-glow' 
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Form Fields Card */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-500 text-lg">₹</span>
                            <input
                                name="amount"
                                type="number"
                                inputMode="decimal"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-900 dark:text-white text-lg font-black placeholder-slate-700 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Transfer Specific Selector */}
                    {formData.type === 'transfer' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">From Account</label>
                                <div className="relative">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-550 text-slate-500" size={16} />
                                    <select
                                        name="sourceId"
                                        value={formData.sourceId}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none focus:border-brand-500"
                                    >
                                        {sources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">To Account</label>
                                <div className="relative">
                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-550 text-slate-500" size={16} />
                                    <select
                                        name="toSourceId"
                                        value={formData.toSourceId}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none focus:border-brand-500"
                                    >
                                        {sources.filter(s => s._id !== formData.sourceId).map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Standard Source Selector */
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Payment Method / Source</label>
                            <div className="relative">
                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-550 text-slate-500" size={16} />
                                <select
                                    name="sourceId"
                                    value={formData.sourceId}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none focus:border-brand-500"
                                >
                                    {sources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Date picker */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Date & Time</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-550 text-slate-500" size={16} />
                            <input
                                type="datetime-local"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 text-slate-250 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Description field */}
                    {formData.type !== 'transfer' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">
                                {formData.type === 'income' ? 'Income Source' : 'Purpose / Merchant'}
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-550 text-slate-500" size={16} />
                                <input
                                    name={formData.type === 'income' ? 'source' : 'purpose'}
                                    value={formData.type === 'income' ? formData.source : formData.purpose}
                                    onChange={handleChange}
                                    placeholder={formData.type === 'income' ? 'Salary, Dividend, Refund...' : 'Rent, Dinner, Swiggy, Uber...'}
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-700 text-sm font-semibold transition-colors"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Transfer Note (Optional)</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-550 text-slate-500" size={16} />
                                <input
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    placeholder="Internal Transfer, Savings Allocations..."
                                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-700 text-sm font-semibold transition-colors"
                                />
                            </div>
                        </div>
                    )}

                    {/* Category Selection Carousel/Grid for Non-Transfer items */}
                    {formData.type !== 'transfer' && (
                        <div className="space-y-3 pt-2">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">Select Category</span>
                            <div className="grid grid-cols-4 gap-2.5">
                                {categories.map(cat => {
                                    const active = formData.category === cat.name;
                                    return (
                                        <button
                                            key={cat.name}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                                            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all ${
                                                active 
                                                    ? 'bg-brand-600/10 border-brand-500/30 text-brand-400 font-bold scale-[1.03]' 
                                                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-850 hover:border-slate-200 dark:border-slate-800 text-slate-350'
                                            }`}
                                        >
                                            <span className="text-lg">{cat.emoji}</span>
                                            <span className="text-[10px] truncate max-w-full">{cat.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submission button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-base font-extrabold flex items-center justify-center gap-2 shadow-glow hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                    {loading ? 'Processing Transaction...' : (
                        <>
                            <span>{editingTransaction ? 'Update Entry' : (formData.type === 'transfer' ? 'Complete Transfer' : 'Save Transaction')}</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default AddEntry;
