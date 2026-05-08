import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
    Target, 
    Plus, 
    ChevronRight, 
    TrendingUp, 
    Calendar, 
    Trash2, 
    CheckCircle2, 
    X,
    ArrowLeft,
    Clock,
    PlusCircle
} from 'lucide-react';

const Goals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    // Form states
    const [newGoal, setNewGoal] = useState({
        name: '',
        targetAmount: '',
        deadline: '',
        icon: '🎯',
        color: '#6366f1'
    });
    const [contribution, setContribution] = useState({ amount: '', note: '' });

    const fetchGoals = async () => {
        try {
            const { data } = await api.get('/goals');
            setGoals(data);
        } catch (err) {
            console.error('Error fetching goals', err);
            showToast('Failed to load goals', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGoals();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        try {
            await api.post('/goals', newGoal);
            showToast('Goal created successfully!');
            setShowAddModal(false);
            setNewGoal({ name: '', targetAmount: '', deadline: '', icon: '🎯', color: '#6366f1' });
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error creating goal', 'error');
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/goals/${selectedGoal._id}/contribute`, contribution);
            showToast('Contribution added!');
            setShowContributeModal(false);
            setContribution({ amount: '', note: '' });
            fetchGoals();
        } catch (err) {
            showToast(err.response?.data?.message || 'Error adding contribution', 'error');
        }
    };

    const handleDeleteGoal = async (id) => {
        if (!window.confirm('Delete this goal?')) return;
        try {
            await api.delete(`/goals/${id}`);
            showToast('Goal deleted');
            fetchGoals();
        } catch (err) {
            showToast('Error deleting goal', 'error');
        }
    };

    if (loading) return (
        <div className="container animate-in flex items-center justify-center min-h-[80vh]">
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="container animate-in pb-24">
            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="glass-btn w-11 h-11 flex items-center justify-center rounded-xl"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight">Savings Goals</h1>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30"
                >
                    <Plus size={20} />
                </button>
            </header>

            {/* Goals List */}
            {goals.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-[32px]">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target size={32} className="text-indigo-500" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">No goals set</h3>
                    <p className="text-sm text-gray-500 mb-6">Start saving for what matters most to you.</p>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary px-8 py-3 rounded-xl font-bold"
                    >
                        Create Your First Goal
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {goals.map((goal) => (
                        <div key={goal._id} className="glass-card p-6 rounded-[28px] relative overflow-hidden group">
                            {/* Background progress indicator */}
                            <div 
                                className="absolute bottom-0 left-0 h-1 transition-all duration-1000"
                                style={{ width: `${goal.progress}%`, background: goal.color }}
                            />

                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
                                        style={{ background: `${goal.color}15`, color: goal.color }}
                                    >
                                        {goal.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{goal.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                            <Calendar size={12} />
                                            {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteGoal(goal._id)}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <span className="text-2xl font-black">₹{goal.savedAmount.toLocaleString()}</span>
                                    <span className="text-gray-400 text-sm font-bold"> / ₹{goal.targetAmount.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-black" style={{ color: goal.color }}>{goal.progress.toFixed(0)}%</span>
                                </div>
                            </div>

                            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${goal.progress}%`, background: goal.color }}
                                />
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                    <Clock size={14} />
                                    {goal.isCompleted ? 'Goal Reached! 🎉' : `${goal.daysRemaining} days left`}
                                </div>
                                {!goal.isCompleted && (
                                    <button 
                                        onClick={() => {
                                            setSelectedGoal(goal);
                                            setShowContributeModal(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm shadow-sm"
                                    >
                                        <PlusCircle size={16} />
                                        Add Funds
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Goal Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card p-8 rounded-[32px] w-full max-w-md animate-scale">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">New Saving Goal</h2>
                            <button onClick={() => setShowAddModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddGoal} className="grid gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Goal Name</label>
                                <input 
                                    type="text" 
                                    value={newGoal.name}
                                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                                    placeholder="New Car, Vacation, etc."
                                    required
                                    className="w-full p-4 rounded-xl border-gray-200"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Target (₹)</label>
                                    <input 
                                        type="number" 
                                        value={newGoal.targetAmount}
                                        onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                                        placeholder="50000"
                                        required
                                        className="w-full p-4 rounded-xl border-gray-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Deadline</label>
                                    <input 
                                        type="date" 
                                        value={newGoal.deadline}
                                        onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                                        required
                                        className="w-full p-4 rounded-xl border-gray-200"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Icon</label>
                                    <select 
                                        className="w-full p-4 rounded-xl"
                                        value={newGoal.icon}
                                        onChange={(e) => setNewGoal({...newGoal, icon: e.target.value})}
                                    >
                                        <option value="🎯">🎯 Goal</option>
                                        <option value="🚗">🚗 Car</option>
                                        <option value="🏠">🏠 Home</option>
                                        <option value="✈️">✈️ Travel</option>
                                        <option value="🎓">🎓 Education</option>
                                        <option value="💻">💻 Tech</option>
                                        <option value="💍">💍 Wedding</option>
                                        <option value="🎁">🎁 Gift</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Color</label>
                                    <input 
                                        type="color" 
                                        className="w-full h-[58px] p-2 rounded-xl"
                                        value={newGoal.color}
                                        onChange={(e) => setNewGoal({...newGoal, color: e.target.value})}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary p-4 rounded-xl font-bold mt-2 shadow-lg shadow-indigo-500/30">
                                Create Goal
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Contribute Modal */}
            {showContributeModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card p-8 rounded-[32px] w-full max-w-sm animate-scale">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Add to {selectedGoal?.name}</h2>
                            <button onClick={() => setShowContributeModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleContribute} className="grid gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Amount (₹)</label>
                                <input 
                                    type="number" 
                                    value={contribution.amount}
                                    onChange={(e) => setContribution({...contribution, amount: e.target.value})}
                                    placeholder="1000"
                                    autoFocus
                                    required
                                    className="w-full p-4 rounded-xl border-gray-200 text-2xl font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Note (Optional)</label>
                                <input 
                                    type="text" 
                                    value={contribution.note}
                                    onChange={(e) => setContribution({...contribution, note: e.target.value})}
                                    placeholder="Monthly saving..."
                                    className="w-full p-4 rounded-xl border-gray-200"
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="p-4 rounded-xl font-bold text-white shadow-lg"
                                style={{ background: selectedGoal?.color }}
                            >
                                Add Contribution
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;
