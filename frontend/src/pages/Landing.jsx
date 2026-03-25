import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
    Wallet, 
    Shield, 
    Zap, 
    BarChart3, 
    ArrowRight, 
    Smartphone, 
    Globe, 
    PieChart,
    CheckCircle2
} from 'lucide-react';

const Landing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleGetStarted = () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/auth');
        }
    };

    return (
        <div className="landing-page" style={{ 
            minHeight: '100vh', 
            background: 'var(--bg-dark)',
            overflowX: 'hidden'
        }}>
            {/* Navigation */}
            <nav style={{ 
                padding: '24px 20px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                maxWidth: '1200px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '12px', 
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        <Wallet color="white" size={24} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', tracking: '-0.5px' }}>Expense.io</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {!user ? (
                        <>
                            <Link to="/auth" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>Login</Link>
                            <button onClick={() => navigate('/auth')} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                            Dashboard
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{ 
                padding: '80px 20px 60px', 
                maxWidth: '1200px', 
                margin: '0 auto',
                textAlign: 'center',
                position: 'relative'
            }}>
                {/* Background Blobs */}
                <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'var(--primary)', filter: 'blur(150px)', opacity: '0.15', zIndex: -1 }}></div>

                <div className="animate-in">
                    <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 16px', 
                        borderRadius: '20px', 
                        background: 'rgba(139, 92, 246, 0.1)', 
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        color: 'var(--primary)',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        marginBottom: '24px'
                    }}>
                        <Zap size={16} /> New: Internal Transfers & Offline Sync
                    </div>
                    <h1 style={{ 
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
                        fontWeight: '800', 
                        lineHeight: '1.1', 
                        marginBottom: '24px',
                        letterSpacing: '-1px'
                    }}>
                        Master Your Money <br/> 
                        <span style={{ 
                            background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', 
                            WebkitBackgroundClip: 'text', 
                            WebkitTextFillColor: 'transparent' 
                        }}>Without Stress.</span>
                    </h1>
                    <p style={{ 
                        fontSize: '1.2rem', 
                        color: 'var(--text-secondary)', 
                        maxWidth: '600px', 
                        margin: '0 auto 40px',
                        lineHeight: '1.6'
                    }}>
                        Track every rupee, set smart budgets, and see your wealth grow with our premium expense tracker. Designed for speed and security.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={handleGetStarted} className="btn-primary" style={{ padding: '18px 36px', fontSize: '1.1rem' }}>
                            Get Started Now <ArrowRight size={20} />
                        </button>
                        <button style={{ 
                            background: 'var(--glass)', 
                            border: '1px solid var(--border)', 
                            color: 'var(--text-primary)',
                            padding: '18px 36px',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                             Browse Features
                        </button>
                    </div>
                </div>

                {/* Dashboard Preview Mockup */}
                <div className="animate-in" style={{ 
                    marginTop: '80px', 
                    padding: '10px', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '32px',
                    border: '1px solid var(--border)',
                    maxWidth: '900px',
                    margin: '80px auto 0',
                    boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ 
                        background: 'var(--bg-dark)', 
                        borderRadius: '24px', 
                        height: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '20px',
                        border: '1px solid var(--border)'
                    }}>
                        <BarChart3 size={64} style={{ opacity: 0.2, color: 'var(--primary)' }} />
                        <div style={{ color: 'var(--text-muted)' }}>Interactive Financial Insights</div>
                        {/* Fake UI Elements */}
                        <div className="flex gap-4" style={{ width: '80%' }}>
                            <div style={{ height: '100px', flex: 1, background: 'var(--glass)', borderRadius: '16px' }}></div>
                            <div style={{ height: '100px', flex: 1, background: 'var(--glass)', borderRadius: '16px' }}></div>
                            <div style={{ height: '100px', flex: 1, background: 'var(--primary)', opacity: 0.1, borderRadius: '16px', border: '1px solid var(--primary)' }}></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ 
                padding: '100px 20px', 
                maxWidth: '1200px', 
                margin: '0 auto' 
            }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Everything You Need</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Powerful tools to simplify your financial life.</p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                    gap: '24px' 
                }}>
                    {[
                        { icon: Shield, title: 'Safe & Secure', desc: 'Enterprise-grade encryption and app-level PIN lock to keep your data private.' },
                        { icon: Smartphone, title: 'Offline First', desc: 'Use it anywhere. Your data syncs automatically as soon as you are back online.' },
                        { icon: PieChart, title: 'Deep Insights', desc: 'Visualize your spending habits with beautiful charts and monthly breakdowns.' },
                        { icon: Globe, title: 'Multi-Account', desc: 'Manage cash, bank accounts, and investments in one unified dashboard.' }
                    ].map((feat, i) => (
                        <div key={i} className="glass-card" style={{ padding: '32px' }}>
                            <div style={{ 
                                width: '50px', 
                                height: '50px', 
                                borderRadius: '14px', 
                                background: 'rgba(139, 92, 246, 0.1)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                marginBottom: '24px',
                                color: 'var(--primary)'
                            }}>
                                <feat.icon size={26} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>{feat.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ 
                padding: '100px 20px', 
                background: 'linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.05))',
            }}>
                <div style={{ 
                    maxWidth: '800px', 
                    margin: '0 auto', 
                    textAlign: 'center',
                    background: 'var(--card-gradient)',
                    padding: '80px 40px',
                    borderRadius: '40px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-premium)'
                }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '24px' }}>Ready to take control?</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px' }}>
                        Join thousands of users who have transformed their spending habits with Expense.io.
                    </p>
                    <button onClick={handleGetStarted} className="btn-primary" style={{ padding: '18px 48px', fontSize: '1.2rem', margin: '0 auto' }}>
                        Create Free Account
                    </button>
                    <div style={{ marginTop: '32px', display: 'flex', gap: '24px', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="var(--income)" /> No hidden fees</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={16} color="var(--income)" /> Privacy first</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ 
                padding: '60px 20px 40px', 
                textAlign: 'center', 
                borderTop: '1px solid var(--border)',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wallet color="white" size={18} />
                    </div>
                    <span style={{ fontWeight: '700' }}>Expense.io</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    © 2026 Expense.io. Built with passion for better finance.
                </p>
            </footer>
        </div>
    );
};

export default Landing;
