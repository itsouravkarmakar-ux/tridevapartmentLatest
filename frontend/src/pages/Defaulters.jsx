import { useState, useEffect } from 'react';
import { getOwners } from '../api';
import { UserX } from 'lucide-react';

const Defaulters = () => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    const fetchOwners = async () => {
        if (!month) return;
        try {
            setLoading(true);
            const data = await getOwners(month);
            // Only care about defaulters
            setOwners(data.filter(o => o.isDefaulter));
        } catch (error) {
            console.error('Failed to fetch defaulters', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, [month]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Defaulter List</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Showing flats that haven't fully paid their premium for the month.</p>
                </div>
                <div className="page-header-actions">
                    <label style={{ fontWeight: 500 }}>Select Month: </label>
                    <input
                        type="month"
                        className="form-control"
                        style={{ width: 'auto' }}
                        value={month}
                        min="2025-12"
                        max="2026-12"
                        onChange={(e) => setMonth(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={fetchOwners}>Refresh</button>
                </div>
            </div>

            {loading ? (
                <p>Loading tracking data...</p>
            ) : owners.length === 0 ? (
                <div className="glass card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <h3 style={{ color: 'var(--secondary)' }}>All Clear! 🚀</h3>
                    <p>There are no defaulters found for this month.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2">
                    {owners.map(owner => (
                        <div key={owner._id} className="glass card" style={{
                            display: 'flex', gap: '1rem',
                            borderLeft: '4px solid var(--danger)'
                        }}>
                            <div style={{ background: 'var(--danger)', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.25rem' }}>
                                {owner.flatNumber}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0 }}>Flat {owner.flatNumber}</h3>
                                    <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <UserX size={14} /> DEFAULTER
                                    </span>
                                </div>
                                <div style={{ marginTop: '1rem', background: 'rgba(255,100,100,0.1)', padding: '0.75rem', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem' }}>Expected:</span>
                                        <strong>₹{owner.expectedPremium}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.875rem' }}>Paid:</span>
                                        <strong>₹{owner.paidAmount}</strong>
                                    </div>
                                    <hr style={{ border: 'none', borderTop: '1px dashed var(--danger)', margin: '0.5rem 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>Shortfall:</span>
                                        <strong style={{ fontSize: '1.25rem' }}>₹{owner.currentDueForMonth}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Defaulters;
