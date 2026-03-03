import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Plus, Trash2, ArrowLeft, Wallet, Edit2, Save, X, CreditCard, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Sources = () => {
    const [sources, setSources] = useState([]);
    const [newName, setNewName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const navigate = useNavigate();

    const handleEditClick = (source) => {
        setEditingId(source._id);
        setEditName(source.name);
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        try {
            const { data } = await api.put(`/sources/${id}`, { name: editName });
            setSources(sources.map(s => s._id === id ? data : s));
            setEditingId(null);
            setEditName('');
        } catch (err) {
            if (err.offline) {
                alert(err.message);
                setEditingId(null);
            } else {
                setError(err.response?.data?.message || 'Error updating source');
            }
        }
    };

    const fetchSources = async () => {
        try {
            const { data } = await api.get('/sources');
            setSources(data);
        } catch (err) {
            console.error('Error fetching sources', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();
    }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setError('');
        try {
            const { data } = await api.post('/sources', {
                name: newName,
                initialBalance: Number(initialBalance) || 0
            });
            setSources([...sources, data]);
            setNewName('');
            setInitialBalance('');
        } catch (err) {
            if (err.offline) {
                alert(err.message);
                setNewName('');
                setInitialBalance('');
            } else {
                setError(err.response?.data?.message || 'Error adding source');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this source? (You can only delete sources without transactions)')) {
            try {
                await api.delete(`/sources/${id}`);
                setSources(sources.filter(s => s._id !== id));
            } catch (err) {
                if (err.offline) {
                    alert(err.message);
                } else {
                    alert(err.response?.data?.message || 'Failed to delete source');
                }
            }
        }
    };

    if (loading) return (
        <div className="container animate-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="container animate-in">
            {/* Header Area */}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/')}
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
                <h1 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Sources & Wallets</h1>
            </header>

            {/* Form Section */}
            <div className="glass-card mb-8" style={{ padding: '24px', borderRadius: '24px' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px' }}>
                        <Plus size={20} color="var(--primary)" />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Add New Account</h3>
                </div>

                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Account Name (e.g. HDFC Bank)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}>₹</div>
                        <input
                            type="number"
                            placeholder="Current Balance"
                            value={initialBalance}
                            onChange={(e) => setInitialBalance(e.target.value)}
                            style={{ paddingLeft: '32px' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '14px', borderRadius: '14px', fontWeight: '600' }}>
                        Add Source
                    </button>
                </form>
                {error && <p style={{ color: 'var(--expense)', marginTop: '12px', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>}
            </div>

            {/* List Section */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '16px', marginLeft: '4px' }}>Established Sources</h3>
            <div className="flex flex-col gap-4">
                {sources.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        <Wallet size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                        <p>No sources added yet.</p>
                    </div>
                ) : (
                    sources.map((s, index) => (
                        <div key={s._id} className="glass-card" style={{
                            padding: '20px',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            background: index % 2 === 0 ? 'var(--bg-card)' : 'rgba(21, 26, 45, 0.6)'
                        }}>
                            {editingId === s._id ? (
                                <div className="flex items-center gap-3">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        autoFocus
                                        style={{ flex: 1 }}
                                    />
                                    <button onClick={() => handleUpdate(s._id)} style={{ color: 'var(--income)', background: 'var(--glass)', padding: '10px', borderRadius: '10px' }}>
                                        <Save size={18} />
                                    </button>
                                    <button onClick={() => setEditingId(null)} style={{ color: 'var(--text-secondary)', background: 'var(--glass)', padding: '10px', borderRadius: '10px' }}>
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '14px',
                                            background: 'rgba(99, 102, 241, 0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <CreditCard size={24} color="var(--primary)" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontWeight: '600', fontSize: '1rem' }}>{s.name}</h4>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered Account</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleEditClick(s)} style={{ color: 'var(--text-muted)', background: 'transparent', padding: '8px' }}>
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(s._id)} style={{ color: 'var(--expense)', opacity: 0.8, background: 'transparent', padding: '8px' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div style={{ paddingBottom: '40px' }}></div>
        </div>
    );
};

export default Sources;
