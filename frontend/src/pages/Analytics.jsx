import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import api from '../utils/api';
import { ArrowLeft, PieChart, BarChart3, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

const Analytics = () => {
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [catRes, monthRes, insightRes] = await Promise.all([
                    api.get('/category-summary'),
                    api.get('/monthly-summary'),
                    api.get('/analytics/insights')
                ]);
                setCategoryData(catRes.data);
                setMonthlyData(monthRes.data);
                setInsights(insightRes.data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    // Prepare Pie Chart Data
    const pieData = {
        labels: categoryData.map(c => c.category.charAt(0).toUpperCase() + c.category.slice(1)),
        datasets: [
            {
                data: categoryData.map(c => c.totalAmount),
                backgroundColor: [
                    '#7c3aed', // Primary Violet
                    '#2563eb', // Blue
                    '#059669', // Emerald
                    '#e11d48', // Rose
                    '#d97706', // Amber
                    '#0891b2', // Cyan
                    '#4f46e5', // Indigo
                ],
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 2,
                hoverOffset: 25
            },
        ],
    };

    // Prepare Bar Chart Data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const barData = {
        labels: monthlyData.map(m => `${monthNames[m.month - 1]} ${m.year}`),
        datasets: [
            {
                label: 'Income',
                data: monthlyData.map(m => m.totalIncome),
                backgroundColor: '#10b981', // Emerald
                borderRadius: 8,
            },
            {
                label: 'Expenses',
                data: monthlyData.map(m => m.totalExpense),
                backgroundColor: '#f43f5e', // Rose
                borderRadius: 8,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12, weight: '500' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                padding: 12,
                bodyFont: { size: 14 },
                titleFont: { size: 14, weight: 'bold' },
                displayColors: true,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
            }
        },
        maintainAspectRatio: false
    };

    const barOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
            }
        }
    };

    if (loading) return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="loader"></div>
        </div>
    );

    return (
        <div className="container animate-in" style={{ paddingBottom: '100px' }}>
            <header className="flex items-center gap-4 mb-8">
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
                <h1 style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>Financial Analytics</h1>
            </header>

            {/* Spending Insights Card */}
            {insights && (
                <section className="mb-10 animate-in" style={{ animationDelay: '0.1s' }}>
                    <div className="glass-card" style={{ 
                        padding: '24px', 
                        borderRadius: '28px', 
                        background: insights.trend === 'up' 
                            ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%)' 
                            : insights.trend === 'down'
                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
                                : 'var(--glass)',
                        border: insights.trend === 'up' 
                            ? '1px solid rgba(244, 63, 94, 0.2)' 
                            : insights.trend === 'down'
                                ? '1px solid rgba(16, 185, 129, 0.2)'
                                : '1px solid var(--border)'
                    }}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    {insights.trend === 'up' ? <TrendingUp size={18} color="#f43f5e" /> : insights.trend === 'down' ? <TrendingDown size={18} color="#10b981" /> : <TrendingUp size={18} color="var(--primary)" />}
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: insights.trend === 'up' ? '#f43f5e' : insights.trend === 'down' ? '#10b981' : 'var(--text-secondary)' }}>
                                        Monthly Insight
                                    </span>
                                </div>
                                <p style={{ fontSize: '1.1rem', fontWeight: '600', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                                    {insights.message}
                                </p>
                                {insights.topCategory && insights.topCategory !== 'General' && (
                                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                                Top Category: <span style={{ color: 'var(--text-primary)' }}>{insights.topCategory}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{
                                background: 'var(--bg-card)',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                textAlign: 'center',
                                minWidth: '80px'
                            }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: '700', color: '#666', textTransform: 'uppercase' }}>Change</p>
                                <p style={{ fontSize: '1.2rem', fontWeight: '800', color: insights.trend === 'up' ? '#f43f5e' : insights.trend === 'down' ? '#10b981' : '#333' }}>
                                    {insights.changePercent > 0 ? '+' : ''}{insights.changePercent.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Category Breakdown */}
            <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '10px', borderRadius: '12px' }}>
                        <PieChart size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Spending by Category</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on your total expenses</p>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '30px', borderRadius: '32px', minHeight: '380px' }}>
                    {categoryData.length > 0 ? (
                        <div style={{ height: '320px' }}>
                            <Pie data={pieData} options={chartOptions} />
                        </div>
                    ) : (
                        <div style={{ height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <PieChart size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>No expense data found</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Monthly Trend */}
            <section className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '12px' }}>
                        <BarChart3 size={24} color="#10b981" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Monthly Trend</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Income vs Expenses (Last 6 Months)</p>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '30px', borderRadius: '32px', minHeight: '380px' }}>
                    {monthlyData.length > 0 ? (
                        <div style={{ height: '320px' }}>
                            <Bar data={barData} options={barOptions} />
                        </div>
                    ) : (
                        <div style={{ height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <Calendar size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>Not enough data for trends</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card" style={{ padding: '20px', borderRadius: '24px', background: 'var(--glass)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp size={16} color="#10b981" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Best Month</span>
                    </div>
                    <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                        {monthlyData.length > 0 
                            ? monthNames[monthlyData.sort((a,b) => b.totalIncome - a.totalIncome)[0].month - 1]
                            : 'N/A'}
                    </p>
                </div>
                <div className="glass-card" style={{ padding: '20px', borderRadius: '24px', background: 'var(--glass)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingDown size={16} color="#f43f5e" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Top Category</span>
                    </div>
                    <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                        {categoryData.length > 0 
                            ? categoryData[0].category.charAt(0).toUpperCase() + categoryData[0].category.slice(1)
                            : 'N/A'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
