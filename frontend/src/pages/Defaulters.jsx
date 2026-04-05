import { useState, useEffect } from 'react';
import { getOwners, getAdjustmentBill } from '../api';
import { UserX, X, Eye, Download } from 'lucide-react';

const Defaulters = () => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    const [viewAttachmentModal, setViewAttachmentModal] = useState({ isOpen: false, billUrl: null, notes: '', loading: false });

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
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                                        <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <UserX size={14} /> DEFAULTER
                                        </span>
                                    </div>
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

export default Defaulters;
