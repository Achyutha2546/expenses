import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Save, Plus, Landmark, Calendar, FileText, ChevronDown } from 'lucide-react';

const AddEntry = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingTransaction = location.state?.transaction;

    const [formData, setFormData] = useState({
        type: 'expense',
        amount: '',
        sourceId: '',
        toSourceId: '',
        date: new Date().toISOString().split('T')[0],
        purpose: '',
        source: '',
        category: ''
    });
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
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
                        date: new Date(editingTransaction.date).toISOString().split('T')[0],
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
    }, [editingTransaction]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingTransaction) {
                await api.put(`/transactions/${editingTransaction._id}`, formData);
            } else {
                await api.post('/transactions', formData);
            }
            navigate('/history');
        } catch (err) {
            if (err.offline) {
                alert(err.message);
                navigate('/history');
            } else {
                alert(err.response?.data?.message || 'Error saving transaction');
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
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
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
                <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                    {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
                </h1>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Type Selector (Segmented Control) */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '6px',
                    borderRadius: '16px',
                    display: 'flex',
                    border: '1px solid var(--border)'
                }}>
                    <button
                        type="button"
                        className="flex-1"
                        style={{
                            background: formData.type === 'income' ? 'var(--income)' : 'transparent',
                            color: formData.type === 'income' ? 'white' : 'var(--text-secondary)',
                            padding: '12px',
                            fontWeight: '600',
                            borderRadius: '12px',
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
                            fontWeight: '600',
                            borderRadius: '12px',
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
                            fontWeight: '600',
                            borderRadius: '12px',
                        }}
                        onClick={() => setFormData({ ...formData, type: 'expense', source: '', toSourceId: '' })}
                    >
                        Expense
                    </button>
                </div>

                {/* Amount Section */}
                <div className="glass-card" style={{ textAlign: 'center', padding: '32px 24px', position: 'relative' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>Enter Amount</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-secondary)' }}>₹</span>
                        <input
                            name="amount"
                            type="number"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            placeholder="0"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '3rem',
                                fontWeight: '800',
                                textAlign: 'left',
                                padding: '0',
                                width: 'auto',
                                minWidth: '100px',
                                maxWidth: '100%',
                                color: 'var(--text-primary)',
                                boxShadow: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Input Fields Group */}
                <div className="flex flex-col gap-4">
                    {/* Account Source */}
                    <div style={{ position: 'relative' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>
                            {formData.type === 'transfer' ? 'From Account' : 'Account'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
                                <Landmark size={20} />
                            </div>
                            <select
                                name="sourceId"
                                value={formData.sourceId}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '48px' }}
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
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>To Account</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
                                    <Landmark size={20} />
                                </div>
                                <select
                                    name="toSourceId"
                                    value={formData.toSourceId}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '48px' }}
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
                            <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>
                                {formData.type === 'income' ? 'From' : 'What for?'}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
                                    <FileText size={20} />
                                </div>
                                <input
                                    name={formData.type === 'income' ? 'source' : 'purpose'}
                                    type="text"
                                    value={formData.type === 'income' ? formData.source : formData.purpose}
                                    onChange={handleChange}
                                    required
                                    placeholder={formData.type === 'income' ? "Employer, Gift, etc." : "Rent, Coffee, Food..."}
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Date Selector */}
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Date</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>
                                <Calendar size={20} />
                            </div>
                            <input
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                style={{ paddingLeft: '48px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{
                        marginTop: '12px',
                        padding: '18px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        borderRadius: '18px'
                    }}
                >
                    {loading ? 'Processing...' : (editingTransaction ? 'Update Entry' : 'Create Transaction')}
                </button>
            </form>

            <div style={{ paddingBottom: '40px' }}></div>
        </div>
    );
};

export default AddEntry;
