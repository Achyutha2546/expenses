import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Save, Plus, Landmark, Calendar, FileText, ChevronDown, Settings, Target, TrendingUp, TrendingDown } from 'lucide-react';

const AddEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingTransaction = location.state?.transaction;

    const getLocalTime = (date = new Date()) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const [formData, setFormData] = useState(() => {
        const base = {
            type: 'expense',
            amount: '',
            sourceId: '',
            toSourceId: '',
            date: getLocalTime(),
            purpose: '',
            source: '',
            category: '',
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
                category: editingTransaction.category || '',
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

        const payload = { 
            ...formData,
            isRecurring: formData.isRecurring,
            frequency: formData.frequency
        };
        
        // Ensure date is sent as UTC ISO string to prevent timezone shifts
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

            // Check if this was saved offline
            if (response.offlineSaved) {
                showToast('Saved offline — will sync automatically ☁️', 'info');
            } else if (editingTransaction) {
                showToast('Transaction updated successfully!', 'success');
            } else {
                showToast('Transaction added successfully!', 'success');
            }
            
            // Graceful redirect
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (err) {
            showToast(err.response?.data?.message || 'Error saving transaction', 'error');
        } finally {
            setLoading(false);
        }
    };

    const [showNumpad, setShowNumpad] = useState(true);

    const handleNumpadClick = (val) => {
        if (val === 'back') {
            setFormData(prev => ({ ...prev, amount: prev.amount.slice(0, -1) }));
        } else {
            setFormData(prev => ({ ...prev, amount: prev.amount + val }));
        }
    };

    const users = [
        { name: '@Richie', img: 'https://i.pravatar.cc/100?u=1' },
        { name: '@Daisio09', img: 'https://i.pravatar.cc/100?u=2' },
        { name: '@Cassio33', img: 'https://i.pravatar.cc/100?u=3' },
        { name: '@Jimi', img: 'https://i.pravatar.cc/100?u=4' },
        { name: '@Leo', img: 'https://i.pravatar.cc/100?u=5' }
    ];

    if (initialLoading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="container animate-in" style={{ paddingBottom: '20px' }}>
            {/* Richie Style Header */}
            <header className="flex items-center justify-between mb-8 px-2">
                <button onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'black' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {formData.type === 'transfer' ? 'Transfer money' : 'Add transaction'}
                </h1>
                <button style={{ background: 'transparent', color: 'black' }}>
                    <Settings size={22} />
                </button>
            </header>

            {/* Richie Style Type Selector */}
            <div style={{
                background: '#f1f5f9',
                padding: '6px',
                borderRadius: '20px',
                display: 'flex',
                gap: '4px',
                marginBottom: '32px'
            }}>
                {['expense', 'income', 'transfer'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: '16px',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            textTransform: 'capitalize',
                            background: formData.type === type ? 'white' : 'transparent',
                            color: formData.type === type ? 'black' : '#94a3b8',
                            boxShadow: formData.type === type ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* User Selection Carousel (Only for Transfer) */}
            {formData.type === 'transfer' && (
                <div className="flex gap-4 overflow-x-auto pb-8 mb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                    {users.map((u, i) => (
                        <div key={i} className="flex flex-col items-center gap-2" style={{ minWidth: '70px' }}>
                            <div style={{ 
                                width: '64px', 
                                height: '64px', 
                                borderRadius: '24px', 
                                overflow: 'hidden',
                                border: u.name === '@Daisio09' ? '3px solid #ddd6fe' : 'none',
                                padding: u.name === '@Daisio09' ? '4px' : '0'
                            }}>
                                <img src={u.img} style={{ width: '100%', height: '100%', borderRadius: '20px', objectFit: 'cover' }} alt={u.name} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: u.name === '@Daisio09' ? 'black' : '#94a3b8' }}>{u.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Essential Fields for Non-Transfer */}
            {formData.type !== 'transfer' && (
                <div className="flex flex-col gap-4 mb-8">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <select
                            name="sourceId"
                            value={formData.sourceId}
                            onChange={handleChange}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '16px', padding: '14px', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                            {sources.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: '16px', padding: '14px', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                            <option value="">Category</option>
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Health">Health</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <input
                        name={formData.type === 'income' ? 'source' : 'purpose'}
                        value={formData.type === 'income' ? formData.source : formData.purpose}
                        onChange={handleChange}
                        placeholder={formData.type === 'income' ? 'Source (e.g. Salary)' : 'Purpose (e.g. Dinner)'}
                        style={{ background: '#f1f5f9', border: 'none', borderRadius: '16px', padding: '14px', fontSize: '0.85rem', fontWeight: '600' }}
                    />
                </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '800', letterSpacing: '-1.5px' }}>
                    ₹{formData.amount || '0.00'}
                </h2>
            </div>

            {/* Custom Numpad */}
            <div style={{ 
                background: '#f1f5f9', 
                borderRadius: '40px', 
                padding: '32px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginBottom: '20px'
            }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'back'].map((num, i) => (
                    <button
                        key={i}
                        onClick={() => handleNumpadClick(num)}
                        style={{ 
                            height: '60px', 
                            fontSize: '1.5rem', 
                            fontWeight: '700', 
                            background: 'transparent', 
                            color: 'black' 
                        }}
                    >
                        {num === 'back' ? '⌫' : num}
                    </button>
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ 
                    width: '100%', 
                    height: '64px', 
                    borderRadius: '24px', 
                    background: 'black', 
                    color: 'white', 
                    fontSize: '1rem', 
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                }}
            >
                {loading ? 'Processing...' : (
                    <>
                        {formData.type === 'transfer' ? 'Send money' : 'Save Transaction'}
                        <TrendingUp size={20} style={{ transform: 'rotate(45deg)' }} />
                    </>
                )}
            </button>
        </div>
    );
};

export default AddEntry;
