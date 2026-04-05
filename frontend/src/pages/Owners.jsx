import { useState, useEffect, useRef } from 'react';
import { getOwners, addPayment, setOwnerPremium, seedOwners, getSettings, updateSettings, updateOwner, adjustPremium, getAdjustmentBill } from '../api';
import { ShieldAlert, CheckCircle2, Settings, X, Upload, Eye, Download } from 'lucide-react';

const Owners = ({ isAdmin }) => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [globalPremium, setGlobalPremium] = useState(600); // Default to reflect backend
    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    const [adjustModal, setAdjustModal] = useState({ isOpen: false, ownerId: null, file: null, notes: '' });
    const [viewAttachmentModal, setViewAttachmentModal] = useState({ isOpen: false, billUrl: null, notes: '', loading: false });
    const fileInputRef = useRef(null);

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

    const handleAdjustPremium = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('owner', adjustModal.ownerId);
        formData.append('month', month);
        if (adjustModal.notes) formData.append('notes', adjustModal.notes);
        if (adjustModal.file) formData.append('bill', adjustModal.file);

        try {
            await adjustPremium(formData);
            setAdjustModal({ isOpen: false, ownerId: null, file: null, notes: '' });
            fetchOwners();
        } catch (err) {
            console.error('Adjust premium frontend error:', err);
            alert('Failed to adjust premium: ' + (err.response?.data?.message || err.message));
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

    const handleDownload = () => {
        const billUrl = viewAttachmentModal.billUrl;
        console.log('Attempting download for billUrl:', billUrl ? billUrl.substring(0, 100) + '...' : 'null');
        
        if (!billUrl) {
            alert('No attachment found to download.');
            return;
        }

        try {
            const link = document.createElement('a');
            // If it starts with / it's a backend path, otherwise assume it's data URI or full URL
            link.href = billUrl.startsWith('/') ? `http://localhost:5000${billUrl}` : billUrl;
            
            // Try to set a clean filename
            const fileName = `Adjustment_Bill_${month.replace(/-/g, '_')}`;
            link.download = fileName;
            
            console.log('Triggering download with href length:', link.href.length, 'and fileName:', fileName);
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Download execution failed:', err);
            alert('Download failed. You can try right-clicking the image and choosing "Save as".');
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Flat Tracking & Dues</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Showing data strictly constrained by month selection.</p>
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

            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                {isAdmin ? (
                    <button className="btn" style={{ background: 'var(--text-primary)', color: 'white', borderRadius: '20px', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-md)', border: 'none' }} onClick={handleSetGlobalPremium}>
                        <Settings size={16} /> Global Standard Premium: ₹{globalPremium}/mo
                    </button>
                ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--text-primary)', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '20px', fontSize: '0.875rem', fontWeight: 600, boxShadow: 'var(--shadow-md)' }}>
                        <Settings size={16} /> Global Premium: ₹{globalPremium}/mo
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
                                            {owner.hasAdjustment && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        ADJUSTED
                                                    </span>
                                                    <button 
                                                        onClick={async () => {
                                                            setViewAttachmentModal({ isOpen: true, billUrl: null, notes: owner.adjustmentNotes, loading: true });
                                                            try {
                                                                const data = await getAdjustmentBill(owner._id, month);
                                                                setViewAttachmentModal(prev => ({ ...prev, billUrl: data.adjustmentBill, loading: false }));
                                                            } catch (err) {
                                                                console.error('Failed to fetch adjustment bill', err);
                                                                setViewAttachmentModal(prev => ({ ...prev, loading: false }));
                                                                alert('Failed to load attachment.');
                                                            }
                                                        }}
                                                        className="btn"
                                                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', background: 'rgba(var(--primary-rgb,-1), 0.1)', color: 'var(--primary)', border: '1px solid currentColor', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                                        title="View Details"
                                                    >
                                                        <Eye size={12} /> View
                                                    </button>
                                                </div>
                                            )}
                                            {!owner.isDefaulter && !owner.isPaid && !owner.hasAdjustment && <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Awaiting Payment</span>}
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
                                    {isAdmin && (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--border)' }} onClick={() => setAdjustModal({ isOpen: true, ownerId: owner._id, file: null, notes: '' })}>Adjust</button>
                                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAddPayment(owner._id)}>Pay</button>
                                        </div>
                                    )}
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

            {adjustModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass card" style={{ width: '500px', maxWidth: '100%', position: 'relative', borderTop: '4px solid var(--primary)' }}>
                        <button onClick={() => setAdjustModal({ ...adjustModal, isOpen: false })} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                            <X size={20} />
                        </button>
                        
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
                                <Upload size={24} />
                            </div>
                            <h2 style={{ margin: 0 }}>Adjust Premium</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Upload a bill to waive the expected premium for {month}.</p>
                        </div>

                        <form onSubmit={handleAdjustPremium}>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea className="form-control" rows="2" value={adjustModal.notes} onChange={(e) => setAdjustModal({ ...adjustModal, notes: e.target.value })}></textarea>
                            </div>

                            <div className="form-group">
                                <label>Upload Bill (PDF/Image)</label>
                                <div style={{ border: '2px dashed var(--border)', padding: '2rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.5)' }} onClick={() => fileInputRef.current.click()}>
                                    <Upload size={24} style={{ margin: '0 auto 1rem auto', color: 'var(--text-secondary)' }} />
                                    {adjustModal.file ? <p style={{ margin: 0, fontWeight: 500, color: 'var(--primary)' }}>{adjustModal.file.name}</p> : <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Click to select a file</p>}
                                </div>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,.pdf" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setAdjustModal({ ...adjustModal, file: e.target.files[0] });
                                    }
                                }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" onClick={() => setAdjustModal({ ...adjustModal, isOpen: false })}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Adjustment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {viewAttachmentModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass card" style={{ width: '800px', maxWidth: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <button onClick={() => setViewAttachmentModal({ isOpen: false, billUrl: null, notes: '' })} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', zIndex: 10 }}>
                            <X size={20} />
                        </button>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: 0 }}>
                            <h2 style={{ margin: 0 }}>Adjustment Details</h2>
                            {viewAttachmentModal.billUrl && (
                                <button 
                                    onClick={handleDownload}
                                    className="btn btn-primary" 
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.4rem 0.75rem' }}
                                >
                                    <Download size={16} /> Download Bill
                                </button>
                            )}
                        </div>
                        
                        {viewAttachmentModal.notes && (
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                <strong>Notes:</strong> {viewAttachmentModal.notes}
                            </div>
                        )}

                        <div style={{ flex: 1, overflow: 'auto', background: '#e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                            {viewAttachmentModal.loading ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem auto' }}></div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Loading attachment...</p>
                                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                </div>
                            ) : viewAttachmentModal.billUrl ? (
                                viewAttachmentModal.billUrl.startsWith('data:application/pdf') ? (
                                    <embed src={viewAttachmentModal.billUrl} type="application/pdf" width="100%" height="500px" />
                                ) : (
                                    <img src={viewAttachmentModal.billUrl} alt="Adjustment Bill" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                )
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>No attachment provided.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Owners;
