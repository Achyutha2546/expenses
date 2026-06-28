import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Trash2,
    Plus,
    Edit2,
    Search,
    Filter,
    ArrowLeft,
    Calendar,
    Wallet,
    Sun,
    Moon,
    Download,
    RefreshCw,
    X,
    CheckCircle,
    AlertCircle,
    Info,
    Repeat
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const History = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sources, setSources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense', 'transfer'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [category, setCategory] = useState('all');
    const { timeFormat } = useSettings();
    const [showSearch, setShowSearch] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('history'); // 'history', 'recurring'
    const [recurringTemplates, setRecurringTemplates] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchData = async (quiet = false) => {
        try {
            if (!quiet) setLoading(true);
            else setIsRefreshing(true);

            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterType !== 'all') params.append('type', filterType);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (category !== 'all') params.append('category', category);

            const [transRes, sourcesRes, recurringRes] = await Promise.all([
                api.get(`/transactions?${params.toString()}`),
                api.get('/sources'),
                api.get('/recurring')
            ]);
            setTransactions(transRes.data);
            setSources(sourcesRes.data);
            setRecurringTemplates(recurringRes.data);
        } catch (err) {
            console.error('Error fetching history data', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData(transactions.length > 0);
    }, [debouncedSearch, filterType, startDate, endDate, category]);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleExport = async () => {
        try {
            setExportLoading(true);
            const response = await api.get('/transactions/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `History_Export_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('Exported CSV successfully!', 'success');
        } catch (err) {
            console.error('Export failed', err);
            showToast('Failed to export history. Please try again.', 'error');
        } finally {
            setExportLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this transaction entry?')) {
            try {
                await api.delete(`/transactions/${id}`);
                setTransactions(transactions.filter(t => t._id !== id));
                showToast('Entry deleted successfully', 'success');
            } catch (err) {
                showToast(err.offline ? err.message : 'Failed to delete transaction', 'error');
            }
        }
    };

    const handleDeleteRecurring = async (id) => {
        if (window.confirm('Stop this recurring template? Future entries will not be generated.')) {
            try {
                await api.delete(`/recurring/${id}`);
                setRecurringTemplates(recurringTemplates.filter(t => t._id !== id));
                showToast('Automation stopped', 'success');
            } catch (err) {
                showToast('Failed to stop automation', 'error');
            }
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString(undefined, { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: timeFormat === '12h'
        });
    };

    if (loading) {
        return (
            <div className="container flex justify-center items-center min-h-[75vh]">
                <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const displayTransactions = transactions
        .filter(t => t.purpose !== 'Initial Balance Setup' && t.purpose !== 'Transfer In');

    const incomeCategories = ['Job', 'Freelance', 'Investment', 'Other'];
    const expenseCategories = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'];

    return (
        <div className="container relative pb-12 select-none">
            {/* Custom toast warnings */}
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

            {/* Offline Alert */}
            {!window.navigator.onLine && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs font-bold text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Offline Mode — Editing is disabled.</span>
                </div>
            )}

            {/* Top Navigation Headers */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Ledger Logs</h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowSearch(!showSearch); if(showFilters) setShowFilters(false); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            showSearch 
                                ? 'bg-brand-600 text-white shadow-glow' 
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                        }`}
                        title="Search ledger"
                    >
                        <Search size={18} />
                    </button>
                    <button
                        onClick={() => { setShowFilters(!showFilters); if(showSearch) setShowSearch(false); }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            showFilters 
                                ? 'bg-brand-600 text-white shadow-glow' 
                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                        }`}
                        title="Filters options"
                    >
                        <Filter size={18} />
                    </button>
                    <button 
                        onClick={() => fetchData(true)} 
                        disabled={isRefreshing}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 flex items-center justify-center transition-colors disabled:opacity-50"
                        title="Sync ledger"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handleExport} 
                        disabled={exportLoading}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-glow hover:scale-105 active:scale-95 transition-all"
                    >
                        {exportLoading ? (
                            <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                        ) : (
                            <Download size={14} />
                        )}
                        <span>Export CSV</span>
                    </button>
                </div>
            </header>

            {/* Custom Sliding Tab Headers */}
            <div className="p-1 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex mb-6">
                <button 
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                        activeTab === 'history' 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow-premium' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                    }`}
                >
                    Log History
                </button>
                <button 
                    onClick={() => setActiveTab('recurring')}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                        activeTab === 'recurring' 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow-premium' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                    }`}
                >
                    Recurring Plans
                </button>
            </div>

            {/* Search Input Accordion */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-6"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-550 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search merchant, description, category..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none text-slate-250 text-slate-800 dark:text-slate-200 text-sm font-semibold transition-colors"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter Drawer Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium relative mb-6"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    className="w-full rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none focus:border-brand-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    className="w-full rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none focus:border-brand-500"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-1 mb-6">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Filter by Category</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-250 text-slate-800 dark:text-slate-200 text-sm font-semibold outline-none focus:border-brand-500"
                            >
                                <option value="all">All Categories</option>
                                {[...incomeCategories, ...expenseCategories].sort().map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        
                        <button 
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setCategory('all');
                                setFilterType('all');
                                setSearchQuery('');
                                setDebouncedSearch('');
                                showToast('All filter states reset', 'info');
                            }}
                            className="w-full py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500/15 font-extrabold text-xs transition-colors"
                        >
                            Reset Filters
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
                {['all', 'income', 'expense', 'transfer'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-full text-xs font-bold capitalize border transition-all ${
                            filterType === type 
                                ? 'bg-brand-600 border-brand-500 text-white shadow-glow' 
                                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
                        }`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Summary Banner */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Volume</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{displayTransactions.length}</span>
                </div>
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-premium text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Monthly Avg</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                        ₹{(displayTransactions.reduce((a, b) => a + b.amount, 0) / Math.max(1, displayTransactions.length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                </div>
            </div>

            {/* Recurring Section */}
            {activeTab === 'recurring' && (
                <div className="space-y-4">
                    {recurringTemplates.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
                            <Repeat size={32} className="text-slate-650 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No active automations</p>
                            <p className="text-xs text-slate-500 mt-1">Check "Repeat" on any new transaction to enable recurring logs.</p>
                        </div>
                    ) : (
                        recurringTemplates.map((template) => (
                            <div key={template._id} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-premium hover:border-slate-300 dark:border-slate-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        template.type === 'income' ? 'bg-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 text-rose-450'
                                    }`}>
                                        <Repeat size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{template.description || template.category}</h4>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                                            <span>₹{template.amount.toLocaleString()}</span>
                                            <span>•</span>
                                            <span>{template.frequency}</span>
                                            <span>•</span>
                                            <span className="text-brand-400">{template.source}</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteRecurring(template._id)}
                                    className="p-2 rounded-lg text-slate-450 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
                                    title="Cancel template automation"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* History logs section */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    {displayTransactions.length === 0 ? (
                        <div className="p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-premium">
                            <Calendar size={40} className="text-slate-600 mx-auto mb-4" />
                            <h4 className="text-sm font-bold text-slate-350">No transactions matched query</h4>
                            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 mb-6">
                                We couldn't find any transaction matches. Try clearing active filter parameters.
                            </p>
                            <Link 
                                to="/add" 
                                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-glow inline-block"
                            >
                                Record Entry
                            </Link>
                        </div>
                    ) : (
                        (() => {
                            const sorted = [...displayTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
                            const groups = [];
                            let lastDate = "";

                            sorted.forEach(t => {
                                const d = new Date(t.date);
                                const dateStr = d.toLocaleDateString(undefined, { 
                                    weekday: 'short', 
                                    day: 'numeric', 
                                    month: 'short', 
                                    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
                                });

                                if (dateStr !== lastDate) {
                                    lastDate = dateStr;
                                    groups.push({ date: dateStr, items: [t] });
                                } else {
                                    groups[groups.length - 1].items.push(t);
                                }
                            });

                            return groups.map((group) => (
                                <div key={group.date} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {group.date}
                                        </span>
                                        <div className="flex-1 h-[1px] bg-white dark:bg-slate-900" />
                                    </div>
                                    
                                    <div className="space-y-2.5">
                                        {group.items.map((t) => {
                                            const sourceName = sources.find(s => s._id.toString() === t.sourceId?.toString())?.name || 'Deposit';
                                            const toSourceName = t.type === 'transfer' ? (sources.find(s => s._id.toString() === t.toSourceId?.toString())?.name || 'Deposit') : '';

                                            return (
                                                <div 
                                                    key={t._id} 
                                                    onClick={() => navigate('/add', { state: { transaction: t } })}
                                                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-premium hover:border-slate-300 dark:border-slate-700 transition-colors cursor-pointer group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                            t.type === 'income' 
                                                                ? 'bg-emerald-500/10 text-emerald-450' 
                                                                : t.type === 'expense' 
                                                                    ? 'bg-rose-500/10 text-rose-450' 
                                                                    : 'bg-blue-500/10 text-blue-450'
                                                        }`}>
                                                            {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                                                                    {t.type === 'income' ? (t.source || 'Income') : t.type === 'expense' ? (t.purpose || 'Expense') : `Transfer to ${toSourceName}`}
                                                                </h4>
                                                                {t.category && t.category !== 'General' && (
                                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 text-[8px] font-extrabold uppercase">
                                                                        {t.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] text-slate-550 text-slate-500 font-bold">
                                                                <span>{formatTime(t.date)}</span>
                                                                <span>•</span>
                                                                <span>{t.type === 'transfer' ? `From ${sourceName}` : sourceName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="text-right flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                        <span className={`text-sm font-black ${
                                                            t.type === 'income' ? 'text-emerald-450' : 'text-slate-800 dark:text-slate-200'
                                                        }`}>
                                                            {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                                                        </span>
                                                        <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                            <button 
                                                                onClick={() => navigate('/add', { state: { transaction: t } })} 
                                                                className="text-slate-500 hover:text-brand-400 transition-colors p-0.5"
                                                                title="Edit ledger log"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(t._id)} 
                                                                className="text-slate-500 hover:text-rose-450 transition-colors p-0.5"
                                                                title="Delete ledger log"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
