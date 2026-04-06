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
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [catRes, monthRes] = await Promise.all([
                    api.get('/analytics/category-summary'),
                    api.get('/analytics/monthly-summary')
                ]);
                setCategoryData(catRes.data);
                setMonthlyData(monthRes.data);
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
                    '#8b5cf6', // Violet
                    '#3b82f6', // Blue
                    '#10b981', // Emerald
                    '#f43f5e', // Rose
                    '#f59e0b', // Amber
                    '#06b6d4', // Cyan
                    '#6366f1', // Indigo
                ],
                borderWidth: 0,
                hoverOffset: 20
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
