import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Save, Plus, Landmark, Calendar, FileText, ChevronDown, Settings, Target } from 'lucide-react';

const AddEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingTransaction = location.state?.transaction;

    const getLocalTime = (date = new Date()) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        sourceId: '',
        toSourceId: '',
        date: getLocalTime(),
        purpose: '',
        source: '',
        category: ''
    });
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const fetchSources = async () => {
            try {
                const { data } = await api.get('/sources');
                setSources(data);

                if (editingTransaction) {
                    setFormData({
                        type: editingTransaction.type,
                        amount: editingTransaction.amount,
                        sourceId: editingTransaction.sourceId,
                        toSourceId: editingTransaction.toSourceId || '',
                        date: getLocalTime(new Date(editingTransaction.date)),
                        purpose: editingTransaction.purpose || '',
                        source: editingTransaction.source || '',
                        category: editingTransaction.category || ''
                    });
                } else if (data.length > 0) {
                    setFormData(prev => ({ ...prev, sourceId: data[0]._id, toSourceId: data.length > 1 ? data[1]._id : '' }));
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

    // When sourceId changes, ensure toSourceId doesn't point to the same account
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

        // Auto-categorization logic
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

    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = { ...formData };
        if (payload.type !== 'transfer') {
            delete payload.toSourceId;
        }
        if (payload.type === 'income') {
            delete payload.purpose;
        } else {
            delete payload.source;
        }

        try {
            if (editingTransaction) {
                await api.put(`/transactions/${editingTransaction._id}`, payload);
                showToast('Transaction updated successfully!', 'success');
            } else {
                await api.post('/transactions', payload);
                showToast('Transaction added successfully!', 'success');
            }
            
            // Graceful redirect
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            if (err.offline) {
                showToast(err.message, 'error');
                setTimeout(() => navigate('/history'), 2000);
            } else {
                showToast(err.response?.data?.message || 'Error saving transaction', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

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
            {!isOnline && (
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
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--expense)' }}>Offline: Entry creation disabled.</span>
                </div>
            )}
            {/* Header */}
            <header className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'var(--glass)',
                            color: 'var(--text-primary)',
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>
                        {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                    </h1>
                </div>
                <Link to="/account" style={{
                    background: 'var(--glass)',
                    color: 'var(--text-primary)',
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Settings size={20} />
                </Link>
            </header>

            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '24px', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Type Selector (Integrated) */}
                <div style={{
                    background: 'var(--bg-dark)',
                    padding: '6px',
                    borderRadius: '16px',
                    display: 'flex',
                    border: '1px solid var(--border)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <button
                        type="button"
                        className="flex-1"
                        style={{
                            background: formData.type === 'income' ? 'var(--income)' : 'transparent',
                            color: formData.type === 'income' ? 'white' : 'var(--text-secondary)',
                            padding: '12px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            fontSize: '0.85rem'
                        }}
                        onClick={() => setFormData({ ...formData, type: 'income', purpose: '', toSourceId: '' })}
                    >
                        Income
                    </button>
                    <button
                        type="button"
                        className="flex-1"
                        style={{
                            background: formData.type === 'transfer' ? 'var(--primary)' : 'transparent',
                            color: formData.type === 'transfer' ? 'white' : 'var(--text-secondary)',
                            padding: '12px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            fontSize: '0.85rem'
                        }}
                        onClick={() => setFormData({ ...formData, type: 'transfer', purpose: '', source: '' })}
                    >
                        Transfer
                    </button>
                    <button
                        type="button"
                        className="flex-1"
                        style={{
                            background: formData.type === 'expense' ? 'var(--expense)' : 'transparent',
                            color: formData.type === 'expense' ? 'white' : 'var(--text-secondary)',
                            padding: '12px',
                            fontWeight: '700',
                            borderRadius: '12px',
                            fontSize: '0.85rem'
                        }}
                        onClick={() => setFormData({ ...formData, type: 'expense', source: '', toSourceId: '' })}
                    >
                        Expense
                    </button>
                </div>

                {/* Hero Amount Input */}
                <div style={{ textAlign: 'center', position: 'relative' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Amount</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-muted)', marginTop: '8px' }}>₹</span>
                        <input
                            name="amount"
                            type="number"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            placeholder="0"
                            autoFocus
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '4rem',
                                fontWeight: '900',
                                textAlign: 'left',
                                padding: '0',
                                width: 'auto',
                                minWidth: '120px',
                                maxWidth: '100%',
                                color: 'var(--text-primary)',
                                boxShadow: 'none',
                                letterSpacing: '-2px'
                            }}
                        />
                    </div>
                </div>

                {/* Input Fields Group */}
                <div className="flex flex-col gap-6">
                    {/* Account Source */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px', display: 'block', marginLeft: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {formData.type === 'transfer' ? 'Source Account' : 'Account'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}>
                                <Landmark size={20} />
                            </div>
                            <select
                                name="sourceId"
                                value={formData.sourceId}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '48px', height: '56px', fontSize: '1rem', fontWeight: '600' }}
                            >
                                {sources.length === 0 ? (
                                    <option value="">No sources found.</option>
                                ) : (
                                    sources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Destination Account (Only for Transfer) */}
                    {formData.type === 'transfer' && (
                        <div style={{ position: 'relative' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px', display: 'block', marginLeft: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Destination Account</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}>
                                    <Landmark size={20} />
                                </div>
                                <select
                                    name="toSourceId"
                                    value={formData.toSourceId}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '48px', height: '56px', fontSize: '1rem', fontWeight: '600' }}
                                >
                                    {sources.length === 0 ? (
                                        <option value="">No sources found.</option>
                                    ) : (
                                        sources
                                            .filter(s => s._id !== formData.sourceId)
                                            .map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                                    )}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Purpose / Source Text */}
                    {formData.type !== 'transfer' && (
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px', display: 'block', marginLeft: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {formData.type === 'income' ? 'Source Title' : 'What is this for?'}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}>
                                    <FileText size={20} />
                                </div>
                                <input
                                    name={formData.type === 'income' ? 'source' : 'purpose'}
                                    type="text"
                                    value={formData.type === 'income' ? formData.source : formData.purpose}
                                    onChange={handleChange}
                                    required
                                    placeholder={formData.type === 'income' ? "Employer, Gift, etc." : "Rent, Coffee, Food..."}
                                    style={{ paddingLeft: '48px', height: '56px', fontSize: '1rem', fontWeight: '600' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Category Selector */}
                    {formData.type !== 'transfer' && (
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px', display: 'block', marginLeft: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}>
                                    <Target size={20} />
                                </div>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '48px', appearance: 'none', height: '56px', fontSize: '1rem', fontWeight: '600' }}
                                >
                                    <option value="">Select Category</option>
                                    <option value="Food">Food</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Entertainment">Entertainment</option>
                                    <option value="Shopping">Shopping</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Investment">Investment</option>
                                    <option value="Health">Health</option>
                                    <option value="Other">Other</option>
                                </select>
                                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Date Selector */}
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '10px', display: 'block', marginLeft: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.8 }}>
                                <Calendar size={20} />
                            </div>
                            <input
                                name="date"
                                type="datetime-local"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '48px', height: '56px', fontSize: '1rem', fontWeight: '600' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <button
                    type="submit"
                    disabled={loading || !isOnline}
                    className="btn-primary"
                    style={{
                        padding: '18px',
                        fontSize: '1.1rem',
                        fontWeight: '800',
                        borderRadius: '20px',
                        marginTop: '10px',
                        opacity: !isOnline ? 0.6 : 1,
                        cursor: !isOnline ? 'not-allowed' : 'pointer',
                        boxShadow: '0 10px 20px -5px rgba(79, 70, 229, 0.4)'
                    }}
                >
                    {loading ? 'Processing...' : (!isOnline ? 'Network Unavailable' : (editingTransaction ? 'Update Entry' : 'Add Transaction'))}
                </button>
            </form>

            <div style={{ paddingBottom: '40px' }}></div>
        </div>
    );
};

export default AddEntry;
