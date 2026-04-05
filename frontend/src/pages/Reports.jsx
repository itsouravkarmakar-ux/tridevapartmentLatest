import { useState, useEffect } from 'react';
import { getReportData, getDefaulterReport } from '../api';
import { Calendar, Download, FileText, ChevronDown, ChevronUp, Printer, CheckCircle2, XCircle, AlertCircle, ShieldCheck, Info, Maximize, Minimize, FileDown } from 'lucide-react';


const Reports = () => {
    const [dateRange, setDateRange] = useState({
        startDate: '2025-12-01',
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [defaulterData, setDefaulterData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedFlat, setExpandedFlat] = useState(null);
    const [expandedMonth, setExpandedMonth] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);


    const fetchReport = async () => {
        setLoading(true);
        try {
            const [data, defData] = await Promise.all([
                getReportData(dateRange.startDate, dateRange.endDate),
                getDefaulterReport(dateRange.startDate, dateRange.endDate)
            ]);
            setReportData(data);
            setDefaulterData(defData);
        } catch (error) {
            console.error('Error fetching report:', error);
            const msg = error.response?.data?.message || error.message || 'Unknown error';
            alert('Failed to fetch report data: ' + msg);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchReport();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        if (!isFullscreen) {
            document.body.classList.add('hide-sidebar-all');
        } else {
            document.body.classList.remove('hide-sidebar-all');
        }
    };

    const exportToDetailedPdf = () => {
        setIsExporting(true);
        setTimeout(() => {
            window.print();
            setIsExporting(false);
        }, 500);
    };

    return (
        <div className={`reports-page ${isFullscreen ? 'fullscreen-mode' : ''} ${isExporting ? 'export-mode' : ''}`} style={{ padding: isFullscreen ? '2rem 4rem' : '2rem', maxWidth: isFullscreen ? '100%' : '1200px', margin: '0 auto', transition: 'all 0.3s' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Reports & Analytics</h1>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button onClick={toggleFullscreen} className="btn" style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid #e5e7eb' }}>
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                    </button>
                    <button onClick={exportToDetailedPdf} className="btn" style={{ background: 'var(--secondary)', color: 'white' }}>
                        <FileDown size={18} /> Export Detailed PDF
                    </button>
                    <button onClick={handlePrint} className="btn" style={{ background: 'var(--primary)', color: 'white' }}>
                        <Printer size={18} /> Print Summarized
                    </button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="print-only" style={{ marginBottom: '2rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
                <h1 style={{ margin: 0 }}>Society Maintenance Report</h1>
                <p style={{ margin: '0.5rem 0 0 0', fontWeight: 600 }}>Period: {dateRange.startDate} to {dateRange.endDate}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Generated on: {new Date().toLocaleString()}</p>
            </div>

            {/* Filter Section */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Start Date</label>
                        <input 
                            type="date" 
                            className="input" 
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>End Date</label>
                        <input 
                            type="date" 
                            className="input" 
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                            style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                    </div>
                    <button onClick={fetchReport} disabled={loading} className="btn" style={{ height: '42px', padding: '0 1.5rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', fontWeight: 600 }}>
                        {loading ? 'Generating...' : 'Update Report'}
                    </button>
                </div>
            </div>

            {defaulterData && (
                <section style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '8px' }}>
                            <ShieldCheck size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Payment History (Paid vs Defaulters)</h2>
                    </div>
                    <div className="card report-table-container" style={{ overflow: 'auto', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <table className="printable-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <tr>
                                    <th className="sticky-col" style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151', position: 'sticky', left: 0, background: '#f9fafb', zIndex: 10 }}>Flat</th>
                                    <th className="sticky-col owner-col" style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151', position: 'sticky', left: '75px', background: '#f9fafb', zIndex: 10, borderRight: '2px solid #e5e7eb' }}>Owner</th>
                                    {defaulterData.months.map(m => (
                                        <th key={m} style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '0.85rem', minWidth: '100px' }}>
                                            {new Date(m + '-01').toLocaleDateString('default', { month: 'short', year: '2-digit' })}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {defaulterData.data.map((row) => (
                                    <tr key={row._id} style={{ borderBottom: '1px solid #f3f4f6' }} className="hover-row">
                                        <td className="sticky-col" style={{ padding: '1rem', fontWeight: 700, position: 'sticky', left: 0, background: 'white', zIndex: 5 }}>{row.flatNumber}</td>
                                        <td className="sticky-col owner-col" style={{ padding: '1rem', position: 'sticky', left: '75px', background: 'white', zIndex: 5, borderRight: '2px solid #e5e7eb', fontSize: '0.9rem' }}>{row.ownerName}</td>
                                        {defaulterData.months.map(m => {
                                            const status = row.monthlyStatus[m];
                                            if (!status) return <td key={m} style={{ padding: '1rem', textAlign: 'center' }}>-</td>;
                                            
                                            return (
                                                <td key={m} style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div className="status-cell">
                                                        {status.status === 'Paid' ? (
                                                            <div className="status-paid" style={{ color: '#059669' }}>
                                                                <CheckCircle2 size={24} className="no-print" style={{ margin: '0 auto' }} />
                                                                <span className="print-only" style={{ fontWeight: 700, fontSize: '0.75rem' }}>PAID</span>
                                                            </div>
                                                        ) : status.status === 'Defaulter' ? (
                                                            <div className="status-due" style={{ color: '#dc2626' }}>
                                                                <XCircle size={24} className="no-print" style={{ margin: '0 auto' }} />
                                                                <div className="no-print" style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '2px' }}>₹{status.shortfall}</div>
                                                                <span className="print-only" style={{ fontWeight: 700, fontSize: '0.75rem' }}>DUE: ₹{status.shortfall}</span>
                                                            </div>
                                                        ) : status.status === 'Partial' ? (
                                                            <div className="status-partial" style={{ color: '#d97706' }}>
                                                                <AlertCircle size={24} className="no-print" style={{ margin: '0 auto' }} />
                                                                <div className="no-print" style={{ fontSize: '0.7rem', fontWeight: 700, marginTop: '2px' }}>₹{status.shortfall}</div>
                                                                <span className="print-only" style={{ fontWeight: 700, fontSize: '0.75rem' }}>PARTIAL: ₹{status.shortfall}</span>
                                                            </div>
                                                        ) : status.status === 'Adjusted' ? (
                                                            <div className="status-adj" style={{ color: '#2563eb' }}>
                                                                <Info size={24} className="no-print" style={{ margin: '0 auto' }} />
                                                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>ADJ</div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>-</span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {reportData && (

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                    {/* Flat-wise Payments */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', borderRadius: '8px' }}>
                                <FileText size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Flat-wise Payment Details</h2>
                        </div>
                        <div className="card" style={{ overflow: 'hidden', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Flat</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Owner</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Total Paid</th>
                                        <th style={{ padding: '1rem', width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.payments.map((p) => (
                                        <div key={p._id} style={{ display: 'contents' }}>
                                            <tr 
                                                onClick={() => setExpandedFlat(expandedFlat === p._id ? null : p._id)}
                                                style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.2s' }}
                                                className="hover-row"
                                            >
                                                <td style={{ padding: '1rem', fontWeight: 700 }}>{p.flatNumber}</td>
                                                <td style={{ padding: '1rem' }}>{p.ownerName}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.totalPaid.toLocaleString()}</div>
                                                    {p.adjustmentCount > 0 && (
                                                        <div style={{ fontSize: '0.7rem', color: '#92400e', background: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.2rem', fontWeight: 600 }}>
                                                            {p.adjustmentCount} {p.adjustmentCount === 1 ? 'month' : 'months'} adjusted
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    {expandedFlat === p._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </td>
                                            </tr>
                                            {(expandedFlat === p._id || isExporting) && (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '0 1rem 1rem 1rem', background: '#f8fafc' }}>
                                                        <div style={{ padding: '1rem', border: '1px dashed #cbd5e1', borderRadius: '8px' }} className="details-container">
                                                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Transactions</div>
                                                            {p.transactions.map((t, idx) => (
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < p.transactions.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.month} - {t.method}</span>
                                                                            {t.isAdjustment && (
                                                                                <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>ADJUSTED</span>
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(t.date).toLocaleDateString()}</span>
                                                                        {t.notes && <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Note: {t.notes}</span>}
                                                                    </div>
                                                                    <span style={{ fontWeight: 600 }}>₹{t.amount}</span>
                                                                </div>
                                                            ))}
                                                            {p.transactions.length === 0 && <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>No details available</div>}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </div>
                                    ))}
                                    {reportData.payments.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No payments found in this range.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Month-wise Expenses */}
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>
                                <Calendar size={20} />
                            </div>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Month-wise Expenses</h2>
                        </div>
                        <div className="card" style={{ overflow: 'hidden', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Month</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, color: '#374151' }}>Total Expense</th>
                                        <th style={{ padding: '1rem', width: '50px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.expenses.map((e) => (
                                        <div key={e._id} style={{ display: 'contents' }}>
                                            <tr 
                                                onClick={() => setExpandedMonth(expandedMonth === e._id ? null : e._id)}
                                                style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                                className="hover-row"
                                            >
                                                <td style={{ padding: '1rem', fontWeight: 700 }}>{e._id}</td>
                                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                                                    ₹{e.totalExpense.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    {expandedMonth === e._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </td>
                                            </tr>
                                            {(expandedMonth === e._id || isExporting) && (
                                                <tr>
                                                    <td colSpan="3" style={{ padding: '0 1rem 1rem 1rem', background: '#fef2f2' }}>
                                                        <div style={{ padding: '1rem', border: '1px dashed #fca5a5', borderRadius: '8px' }} className="details-container">
                                                            {e.categories.map((cat, idx) => (
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: idx < e.categories.length - 1 ? '1px solid #fee2e2' : 'none' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{cat.category}</span>
                                                                        <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{new Date(cat.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <span style={{ fontWeight: 600 }}>₹{cat.amount}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </div>
                                    ))}
                                    {reportData.expenses.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No expenses found in this range.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
            <style>{`
                .hover-row:hover { background: #f9fafb; }
                .status-cell { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 45px; }
                .print-only { display: none; }
                
                .fullscreen-mode {
                    position: relative;
                    z-index: 1000;
                    background: var(--background) !important;
                    min-height: 100vh;
                }

                @media print {
                    @page { size: landscape; margin: 1cm; }
                    body { background: white !important; color: black !important; }
                    .sidebar, .nav-links, .nav-actions, .input, button, .no-print, .filter-section { display: none !important; }
                    .reports-page { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
                    .main-content { margin: 0 !important; padding: 0 !important; overflow: visible !important; }
                    .card { box-shadow: none !important; border: 1px solid #eee !important; margin-bottom: 1.5rem !important; page-break-inside: avoid; }
                    
                    /* Table Print Optimizations */
                    .report-table-container { overflow: visible !important; width: 100% !important; }
                    .printable-table { width: 100% !important; border-collapse: collapse !important; table-layout: auto !important; }
                    .printable-table th, .printable-table td { 
                        border: 1px solid #e5e7eb !important; 
                        padding: 0.4rem !important; 
                        font-size: 0.7rem !important;
                        position: static !important;
                        background: transparent !important;
                    }
                    .sticky-col { position: static !important; border-right: 1px solid #e5e7eb !important; }
                    .owner-col { min-width: 100px !important; }
                    
                    /* Status Display for Print */
                    .print-only { display: block !important; }
                    .status-paid { color: #065f46 !important; }
                    .status-due { color: #991b1b !important; }
                    .status-partial { color: #92400e !important; }
                    
                    /* Details for Export */
                    .details-container { 
                        display: block !important; 
                        border: 1px solid #e5e7eb !important; 
                        background: white !important;
                        page-break-inside: auto !important;
                    }

                    /* Force Headers to repeat */
                    thead { display: table-header-group; }
                    tr { page-break-inside: avoid; }
                    
                    h1 { font-size: 1.4rem !important; margin-bottom: 0.5rem !important; text-align: center; }
                    h2 { font-size: 1.1rem !important; margin-top: 1.2rem !important; border-bottom: 1px solid #333; padding-bottom: 0.3rem; }
                }

                .footer-version {
                    margin-top: 3rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                    color: #94a3b8;
                    font-size: 0.75rem;
                    text-align: center;
                }
            `}</style>
            
            <div className="footer-version no-print">
                Logic: Month-wise (v1.2) • Reflected by Target Month • Latest Sync: 2026-04-05 11:42
            </div>
        </div>
    );
};

export default Reports;
