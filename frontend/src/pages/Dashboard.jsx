import { useState, useEffect } from 'react';
import { getDashboardSummary, updateSettings } from '../api';
import { ArrowUpRight, ArrowDownRight, Wallet, Edit2 } from 'lucide-react';

const Dashboard = ({ isAdmin }) => {
    const [summary, setSummary] = useState({
        initialBalance: 0,
        totalReceived: 0,
        totalExpenses: 0,
        remainingBalance: 0,
        lifetimeBalance: 0,
        lifetimeReceived: 0,
        monthlyBreakdown: []
    });
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

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
                <>
                    <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
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

                    <div className="glass card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Fund Summary & Breakdown</h3>
                        
                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Base Initial Amount</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.25rem 0 0 0' }}>₹{summary.initialBalance}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Total Amount Added (All Months)</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--secondary)', margin: '0.25rem 0 0 0' }}>₹{summary.lifetimeReceived}</p>
                            </div>
                        </div>

                        {summary.monthlyBreakdown && summary.monthlyBreakdown.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Month</th>
                                        <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount Added</th>
                                        <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Expenses</th>
                                        <th style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Net for Month</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.monthlyBreakdown.map((row) => {
                                        // Format month from YYYY-MM to readable format
                                        const [year, m] = row.month.split('-');
                                        const date = new Date(year, m - 1);
                                        const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                                        const net = row.totalReceived - row.totalExpenses;

                                        return (
                                            <tr key={row.month} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.75rem', fontWeight: 500 }}>{monthName}</td>
                                                <td style={{ padding: '0.75rem', color: 'var(--secondary)' }}>₹{row.totalReceived}</td>
                                                <td style={{ padding: '0.75rem', color: 'var(--danger)' }}>₹{row.totalExpenses}</td>
                                                <td style={{ padding: '0.75rem', fontWeight: 600, color: net >= 0 ? 'var(--secondary)' : 'var(--danger)' }}>
                                                    {net >= 0 ? `+₹${net}` : `-₹${Math.abs(net)}`}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No data available for breakdown.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard;
