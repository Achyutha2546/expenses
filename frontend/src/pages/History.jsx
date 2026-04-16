import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
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
    Eye,
    EyeOff,
    Settings
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const History = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sources, setSources] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [category, setCategory] = useState('all');
    const { timeFormat } = useSettings();
    const [showSearch, setShowSearch] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

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

            const [transRes, sourcesRes] = await Promise.all([
                api.get(`/transactions?${params.toString()}`),
                api.get('/sources')
            ]);
            setTransactions(transRes.data);
            setSources(sourcesRes.data);
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
        } catch (err) {
            console.error('Export failed', err);
            alert('Failed to export history. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this transaction?')) {
            try {
                await api.delete(`/transactions/${id}`);
                setTransactions(transactions.filter(t => t._id !== id));
                showToast('Entry deleted successfully', 'info');
            } catch (err) {
                showToast(err.offline ? err.message : 'Failed to delete transaction', 'error');
            }
        }
    };

    const getTimeLabel = (date) => {
        const hours = new Date(date).getHours();
        if (hours >= 5 && hours < 12) return { label: 'Morning', icon: <Sun size={12} color="#f59e0b" /> };
        if (hours >= 12 && hours < 17) return { label: 'Afternoon', icon: <Sun size={12} color="#fbbf24" /> };
        if (hours >= 17 && hours < 21) return { label: 'Evening', icon: <Moon size={12} color="#8b5cf6" /> };
        return { label: 'Night', icon: <Moon size={12} color="#4c1d95" /> };
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString(undefined, { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: timeFormat === '12h'
        });
    };

    if (loading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    const displayTransactions = transactions
        .filter(t => t.purpose !== 'Initial Balance Setup' && t.purpose !== 'Transfer In');

    const incomeCategories = ['Job', 'Freelance', 'Investment', 'Other'];
    const expenseCategories = ['Food', 'Rent', 'Transport', 'Shopping', 'Entertainment', 'Health', 'Other'];

    return (
        <div className="container animate-in">
            {/* Toast Notifications */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            background: toast.type === 'success' ? 'var(--income)' : (toast.type === 'error' ? 'var(--expense)' : 'var(--primary)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}>
                             {toast.type === 'success' ? '✓' : (toast.type === 'error' ? '!' : 'i')}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{toast.message}</span>
                    </div>
                </div>
            )}
            {/* Offline Banner */}
            {!window.navigator.onLine && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid var(--expense)',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }} className="pulse-animation">
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--expense)' }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--expense)' }}>Offline Mode: View only.</span>
                </div>
            )}

            {/* Header Area */}
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            background: 'var(--glass)',
                            color: 'var(--text-primary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>History</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        style={{
                            background: showSearch ? 'var(--primary)' : 'var(--glass)',
                            color: showSearch ? 'white' : 'var(--text-primary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Search size={18} />
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            background: showFilters ? 'var(--primary)' : 'var(--glass)',
                            color: showFilters ? 'white' : 'var(--text-primary)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Filter size={18} />
                    </button>
                    <button 
                        onClick={() => fetchData(true)} 
                        disabled={isRefreshing}
                        style={{ background: 'var(--glass)', color: 'var(--text-primary)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Settings size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handleExport} 
                        disabled={exportLoading}
                        style={{ background: 'var(--primary-gradient)', color: 'white', padding: '0 12px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '700', border: 'none', boxShadow: '0 4px 12px -2px rgba(139, 92, 246, 0.3)' }}
                    >
                        {exportLoading ? <div className="loader" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div> : <Download size={16} />}
                        CSV
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            {showSearch && (
                <div className="animate-in mb-6">
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Find transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                paddingLeft: '48px',
                                background: 'var(--bg-card)',
                                borderRadius: '16px',
                                border: '1px solid var(--border)'
                            }}
                        />
                        <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
                <div className="glass-card animate-in mb-6" style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', position: 'relative' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: '1 1 140px' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>START DATE</label>
                            <input 
                                type="date" 
                                value={startDate} 
                                onChange={(e) => setStartDate(e.target.value)} 
                                style={{ width: '100%', borderRadius: '14px', padding: '12px', background: 'var(--glass)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div style={{ flex: '1 1 140px' }}>
                            <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>END DATE</label>
                            <input 
                                type="date" 
                                value={endDate} 
                                onChange={(e) => setEndDate(e.target.value)} 
                                style={{ width: '100%', borderRadius: '14px', padding: '12px', background: 'var(--glass)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>CATEGORY</label>
                        <div style={{ position: 'relative' }}>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)}
                                style={{ width: '100%', borderRadius: '14px', padding: '14px', background: 'var(--glass)', color: 'var(--text-primary)', border: '1px solid var(--border)', appearance: 'none' }}
                            >
                                <option value="all">All Categories</option>
                                {[...incomeCategories, ...expenseCategories].sort().map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            setStartDate('');
                            setEndDate('');
                            setCategory('all');
                            setFilterType('all');
                            setSearchQuery('');
                            setDebouncedSearch('');
                        }}
                        style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--expense)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', fontWeight: '700' }}
                    >
                        Reset All Filters
                    </button>
                    {isRefreshing && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                            <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                        </div>
                    )}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6" style={{ overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                {['all', 'income', 'expense', 'transfer'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            background: filterType === type ? 'var(--primary)' : 'var(--glass)',
                            color: filterType === type ? 'white' : 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            textTransform: 'capitalize'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Quick Summary Banner */}
            <div className="glass-card mb-8" style={{ padding: '20px', borderRadius: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>Transactions</p>
                    <p style={{ fontWeight: '700', fontSize: '1.25rem' }}>{displayTransactions.length}</p>
                </div>
                <div style={{ width: '1px', background: 'var(--border)', height: '24px' }}></div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '4px' }}>Monthly Avg</p>
                    <p style={{ fontWeight: '700', fontSize: '1.25rem' }}>₹{(displayTransactions.reduce((a, b) => a + b.amount, 0) / Math.max(1, displayTransactions.length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
            </div>

            {/* Transaction List */}
            <div className="flex flex-col gap-6">
                {displayTransactions.length === 0 ? (
                    <div className="glass-card animate-scale" style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', marginTop: '20px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Calendar size={40} color="var(--primary)" opacity={0.4} />
                        </div>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>No records found</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '240px', margin: '0 auto 24px', lineHeight: '1.5' }}>
                            We couldn't find any transactions. Try adjusting your search or filters.
                        </p>
                        <Link to="/add" style={{ background: 'var(--primary)', color: 'white', padding: '10px 24px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'inline-block' }}>
                            Add New Entry
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

                        return groups.map((group, gIdx) => (
                            <div key={group.date} className="animate-in" style={{ animationDelay: `${gIdx * 0.05}s` }}>
                                <div className="flex items-center gap-2 mb-3" style={{ paddingLeft: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {group.date}
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)', opacity: 0.5 }}></div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {group.items.map((t) => {
                                        const sourceName = sources.find(s => s._id.toString() === t.sourceId?.toString())?.name || 'Unknown';
                                        const toSourceName = t.type === 'transfer' ? (sources.find(s => s._id.toString() === t.toSourceId?.toString())?.name || 'Unknown') : '';

                                        return (
                                            <div key={t._id} className="glass-card" style={{
                                                padding: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'var(--bg-card)',
                                                borderRadius: '16px',
                                                border: '1px solid var(--border)',
                                                transition: 'transform 0.2s',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => navigate('/add', { state: { transaction: t } })}
                                            >
                                                 <div className="flex items-center gap-4">
                                                     <div style={{
                                                         width: '44px',
                                                         height: '44px',
                                                         borderRadius: '14px',
                                                         background: t.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : t.type === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                         display: 'flex',
                                                         alignItems: 'center',
                                                         justifyContent: 'center'
                                                     }}>
                                                         {t.type === 'income' ? <TrendingUp size={20} color="var(--income)" /> : t.type === 'expense' ? <TrendingDown size={20} color="var(--expense)" /> : <Plus size={20} color="var(--primary)" style={{ transform: 'rotate(45deg)' }} />}
                                                     </div>
                                                     <div>
                                                         <div className="flex items-center gap-2 mb-1">
                                                             <h4 style={{ fontSize: '0.95rem', fontWeight: '750', color: 'var(--text-primary)' }}>
                                                                 {t.type === 'income' ? (t.source || 'Income') : t.type === 'expense' ? (t.purpose || 'Expense') : `To ${toSourceName}`}
                                                             </h4>
                                                             {t.category && (
                                                                <span className="badge" style={{ 
                                                                    background: `var(--cat-${t.category.toLowerCase()}, var(--cat-other))`,
                                                                    color: 'white',
                                                                    opacity: 0.9,
                                                                    padding: '1px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.6rem'
                                                                }}>
                                                                    {t.category}
                                                                </span>
                                                            )}
                                                         </div>
                                                         <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                                                             <span>{formatTime(t.date)}</span>
                                                             <span style={{ opacity: 0.3 }}>•</span>
                                                             <span>{t.type === 'transfer' ? `From ${sourceName}` : sourceName}</span>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div style={{ textAlign: 'right' }}>
                                                     <p className="text-amount" style={{
                                                         color: t.type === 'income' ? 'var(--income)' : 'var(--text-primary)'
                                                     }}>
                                                         {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}₹{t.amount.toLocaleString()}
                                                     </p>
                                                     <div className="flex gap-3 justify-end mt-1" onClick={(e) => e.stopPropagation()}>
                                                         <Link to="/add" state={{ transaction: t }} style={{ color: 'var(--text-muted)' }}>
                                                             <Edit2 size={14} />
                                                         </Link>
                                                         <button onClick={() => handleDelete(t._id)} style={{ color: 'var(--text-muted)', background: 'transparent', padding: 0 }}>
                                                             <Trash2 size={14} />
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

            <div style={{ paddingBottom: '60px' }}></div>
        </div >
    );
};

export default History;
