import { useState, useEffect } from 'react';
import { getOwners, addPayment, setOwnerPremium, seedOwners, getSettings, updateSettings, updateOwner } from '../api';
import { ShieldAlert, CheckCircle2, Settings } from 'lucide-react';

const Owners = ({ isAdmin }) => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalPremium, setGlobalPremium] = useState(600); // Default to reflect backend
    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

    const fetchOwners = async () => {
        if (!month) return;
        try {
            setLoading(true);
            let data = await getOwners(month);

            // Fetch global premium setting
            try {
                const preSetting = await getSettings('defaultPremium');
                if (preSetting && preSetting.value) setGlobalPremium(preSetting.value);
            } catch (e) { } // Ignore if not set

            // Auto seed if empty
            if (data.length === 0) {
                await seedOwners();
                data = await getOwners(month);
            }
            setOwners(data);
        } catch (error) {
            console.error('Failed to fetch owners', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOwners();
    }, [month]);

    const handleSetPremium = async (id) => {
        const val = prompt('Set explicit expected premium for this flat for ' + month + ' (Overrides Global Default):');
        if (val !== null && !isNaN(val)) {
            try {
                await setOwnerPremium({ owner: id, month, expectedAmount: Number(val) });
                fetchOwners();
            } catch (err) {
                alert('Failed to set premium');
            }
        }
    };

    const handleSetGlobalPremium = async () => {
        const val = prompt('Set the Standard Global Monthly Premium for all flats:', globalPremium);
        if (val !== null && !isNaN(val)) {
            try {
                await updateSettings('defaultPremium', Number(val));
                fetchOwners(); // Refresh to apply new global premium
            } catch (err) {
                alert('Failed to update global premium');
            }
        }
    };

    const handleAddPayment = async (id) => {
        const amount = prompt('Enter payment received from flat for ' + month);
        if (amount !== null && !isNaN(amount)) {
            try {
                await addPayment({ owner: id, amount: Number(amount), month, paymentMethod: 'Cash' });
                fetchOwners();
            } catch (err) {
                alert('Failed to add payment');
            }
        }
    };

    const handleEditOwner = async (id, currentName, currentPhone) => {
        const newName = prompt('Enter Owner Name (or NA):', currentName);
        if (newName === null) return;
        const newPhone = prompt('Enter Phone Number:', currentPhone || '');
        if (newPhone === null) return;

        try {
            await updateOwner(id, { ownerName: newName, phone: newPhone });
            fetchOwners();
        } catch (err) {
            alert('Failed to update owner details');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2>Flat Tracking & Dues</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Showing data strictly constrained by month selection.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                {isAdmin && (
                    <button className="btn" style={{ background: 'var(--border)' }} onClick={handleSetGlobalPremium}>
                        <Settings size={16} /> Global Standard Premium: ₹{globalPremium}/mo
                    </button>
                )}
                {!isAdmin && (
                    <span style={{ padding: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <Settings size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                        Global Premium: ₹{globalPremium}/mo
                    </span>
                )}
            </div>

            {loading ? (
                <p>Loading tracking data...</p>
            ) : (
                <div className="grid grid-cols-3">
                    {owners.map(owner => (
                        <div key={owner._id} className="glass card" style={{
                            display: 'flex', flexDirection: 'column', gap: '1rem',
                            borderTop: owner.isDefaulter ? '4px solid var(--danger)' : owner.isPaid ? '4px solid var(--secondary)' : '4px solid var(--primary)'
                        }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ background: 'var(--text-primary)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {owner.flatNumber}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Flat {owner.flatNumber}: {owner.ownerName}</h3>
                                            {isAdmin && <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.4)' }} onClick={() => handleEditOwner(owner._id, owner.ownerName, owner.phone)}>Edit Details</button>}
                                        </div>
                                        {owner.phone && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>📞 {owner.phone}</div>}
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {owner.isDefaulter && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ShieldAlert size={12} /> DEFAULTER</span>}
                                            {owner.isPaid && <span style={{ color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle2 size={12} /> PAID</span>}
                                            {!owner.isDefaulter && !owner.isPaid && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Awaiting Payment</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem' }}>
                                        Expected: <strong>₹{owner.expectedPremium || 0}</strong>
                                        {!owner.isExplicitPremium && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>(Default)</span>}
                                    </span>
                                    {isAdmin && <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleSetPremium(owner._id)}>Override</button>}
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem' }}>Paid this month: <strong>₹{owner.paidAmount || 0}</strong></span>
                                    {isAdmin && <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAddPayment(owner._id)}>Pay</button>}
                                </div>

                                {owner.currentDueForMonth > 0 && (
                                    <div style={{ textAlign: 'right', color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 700 }}>
                                        Shortfall: ₹{owner.currentDueForMonth}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Owners;
