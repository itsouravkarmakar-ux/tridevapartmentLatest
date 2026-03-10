import { useState, useEffect } from 'react';
import { getDashboardSummary, updateSettings } from '../api';
import { ArrowUpRight, ArrowDownRight, Wallet, Edit2 } from 'lucide-react';

const Dashboard = ({ isAdmin }) => {
    const [summary, setSummary] = useState({
        initialBalance: 0,
        totalReceived: 0,
        totalExpenses: 0,
        remainingBalance: 0,
        lifetimeBalance: 0
    });
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState('');

    // Set default month to current month
    useEffect(() => {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setMonth(currentMonth);
    }, []);

    const fetchSummary = async () => {
        try {
            setLoading(true);
            const data = await getDashboardSummary(month || undefined);
            setSummary(data);
        } catch (error) {
            console.error('Failed to fetch summary');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [month]);

    const handleEditBalance = async () => {
        const newBal = prompt('Enter new initial total balance setting:', summary.initialBalance);
        if (newBal !== null && !isNaN(newBal)) {
            try {
                await updateSettings('initialBalance', Number(newBal));
                fetchSummary();
            } catch (err) {
                alert('Failed to update initial balance');
            }
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <div className="page-header-actions">
                    <label style={{ fontWeight: 500 }}>Filter: </label>
                    <input
                        type="month"
                        className="form-control"
                        style={{ width: 'auto' }}
                        value={month}
                        min="2025-12"
                        max="2026-12"
                        onChange={(e) => setMonth(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={() => setMonth('')}>All Time</button>
                </div>
            </div>

            {isAdmin && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn" style={{ background: 'var(--border)' }} onClick={handleEditBalance}>
                        <Edit2 size={16} /> Edit Initial Start Balance (Currently ₹{summary.initialBalance})
                    </button>
                </div>
            )}

            {loading ? (
                <p>Loading summary...</p>
            ) : (
                <div className="grid grid-cols-3">
                    <div className="glass card" style={{ borderTop: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Overall Balance</h3>
                            <Wallet color="var(--primary)" />
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '1rem 0 0 0' }}>
                            ₹{month ? summary.lifetimeBalance : summary.remainingBalance}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Includes Base ₹{summary.initialBalance}
                        </p>
                    </div>

                    <div className="glass card" style={{ borderTop: '4px solid var(--secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Received {month ? 'This Month' : ''}</h3>
                            <ArrowDownRight color="var(--secondary)" />
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)', margin: '1rem 0 0 0' }}>
                            ₹{summary.totalReceived}
                        </p>
                    </div>

                    <div className="glass card" style={{ borderTop: '4px solid var(--danger)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Expenses {month ? 'This Month' : ''}</h3>
                            <ArrowUpRight color="var(--danger)" />
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)', margin: '1rem 0 0 0' }}>
                            ₹{summary.totalExpenses}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
