import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Wallet, Plus, Trash2, CheckCircle, Rocket, Landmark, ArrowRight } from 'lucide-react';

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
        <div className="container animate-in" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px'
        }}>
            {/* Onboarding Intro */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Rocket size={32} color="var(--primary)" />
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                    Setup your wallet
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '300px', margin: '0 auto' }}>
                    Tell us about your current accounts and balances to get started.
                </p>
            </div>

            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
                padding: '32px',
                borderRadius: '32px',
                background: 'rgba(21, 26, 45, 0.6)',
                backdropFilter: 'blur(30px)'
            }}>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6">
                        {sources.map((source, index) => (
                            <div key={index} className="flex flex-col gap-1 p-4" style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '20px',
                                border: '1px solid var(--border)',
                                position: 'relative'
                            }}>
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--primary)' }}>
                                    <Landmark size={14} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Account {index + 1}
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text"
                                            placeholder="Bank, Cash, etc."
                                            value={source.name}
                                            onChange={(e) => handleChange(index, 'name', e.target.value)}
                                            required
                                            style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--border)', borderRadius: 0, padding: '12px 0' }}
                                        />
                                    </div>
                                    <div style={{ width: '120px' }}>
                                        <input
                                            type="number"
                                            placeholder="Balance ₹"
                                            value={source.balance}
                                            onChange={(e) => handleChange(index, 'balance', e.target.value)}
                                            style={{ background: 'transparent', border: 'none', borderBottom: '2px solid var(--border)', borderRadius: 0, padding: '12px 0', fontWeight: '700' }}
                                        />
                                    </div>
                                    {sources.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRow(index)}
                                            style={{ background: 'transparent', color: 'var(--expense)', padding: '0 8px' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={handleAddRow}
                        className="mt-6 flex items-center justify-center gap-2 w-full"
                        style={{
                            background: 'var(--glass)',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            padding: '14px',
                            borderRadius: '14px',
                            fontSize: '0.9rem'
                        }}
                    >
                        <Plus size={18} /> Add Another Account
                    </button>

                    {error && <p style={{ color: 'var(--expense)', marginTop: '20px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '500' }}>{error}</p>}

                    <button
                        type="submit"
                        className="btn-primary mt-8 w-full flex items-center justify-center gap-3"
                        disabled={loading}
                        style={{ padding: '18px', borderRadius: '18px', fontSize: '1.1rem', fontWeight: '800' }}
                    >
                        {loading ? 'Finalizing...' : <>Complete Setup <ArrowRight size={20} /></>}
                    </button>
                </form>
            </div>

            <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Step 2 of 2: Managing your wealth
            </p>
        </div>
    );
};

export default Onboarding;
