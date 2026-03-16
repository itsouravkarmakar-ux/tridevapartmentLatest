import { useState, useEffect, useRef } from 'react';
import { getExpenses, addExpense, updateExpense, getExpenseBills } from '../api';
import { Plus, Download, Edit2, Check, X } from 'lucide-react';

const Expenses = ({ isAdmin }) => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState('');

    // Form state
    const [category, setCategory] = useState('Others');
    const [amount, setAmount] = useState('');
    const [expenseMonth, setExpenseMonth] = useState('');
    const [description, setDescription] = useState('');
    const [billFiles, setBillFiles] = useState([]);
    const [expenseDate, setExpenseDate] = useState('');

    const [editingExpenseId, setEditingExpenseId] = useState(null);
    const [editForm, setEditForm] = useState({ category: '', amount: '', month: '', description: '', expenseDate: '' });
    const [editBillFiles, setEditBillFiles] = useState([]);

    const handleEditClick = (exp) => {
        setEditingExpenseId(exp._id);
        setEditForm({
            category: exp.category,
            amount: exp.amount,
            month: exp.month,
            description: exp.description || '',
            expenseDate: exp.expenseDate ? new Date(exp.expenseDate).toISOString().split('T')[0] : ''
        });
        setEditBillFiles([]);
    };

    const handleDownloadBills = async (expId, category, date) => {
        try {
            const data = await getExpenseBills(expId);
            const bills = data.bills || [];
            if (bills.length === 0) {
                alert('No bills attached to this expense.');
                return;
            }

            // Loop through bills and trigger download for each
            bills.forEach((billUrl, index) => {
                const link = document.createElement('a');
                link.href = billUrl.startsWith('data:') ? billUrl : `http://localhost:5000${billUrl}`;
                const safeDate = date ? new Date(date).toLocaleDateString().replace(/\//g, '-') : 'date';
                link.download = `bill-${category}-${safeDate}-part${index + 1}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        } catch (error) {
            console.error('Error downloading bills:', error);
            alert('Failed to download bill images');
        }
    };

    const handleSaveEdit = async (expId) => {
        try {
            const formData = new FormData();
            formData.append('category', editForm.category);
            formData.append('amount', editForm.amount);
            formData.append('month', editForm.month);
            formData.append('description', editForm.description);
            formData.append('expenseDate', editForm.expenseDate);
            if (editBillFiles && editBillFiles.length > 0) {
                Array.from(editBillFiles).forEach(file => {
                    formData.append('billImages', file);
                });
            }
            await updateExpense(expId, formData);
            setEditingExpenseId(null);
            fetchExpenses();
        } catch (error) {
            alert('Failed to update expense');
        }
    };

    const fileInputRef = useRef();

    useEffect(() => {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setMonth(currentMonth);
        setExpenseMonth(currentMonth);
        setExpenseDate(today.toISOString().split('T')[0]);
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await getExpenses(month || undefined);
            setExpenses(data);
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (month !== '') fetchExpenses();
    }, [month]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || !expenseMonth) return;

        const formData = new FormData();
        formData.append('category', category);
        formData.append('amount', amount);
        formData.append('month', expenseMonth);
        formData.append('description', description);
        formData.append('expenseDate', expenseDate);
        if (billFiles && billFiles.length > 0) {
            Array.from(billFiles).forEach(file => {
                formData.append('billImages', file);
            });
        }

        try {
            await addExpense(formData);
            // Reset form
            setAmount('');
            setDescription('');
            setBillFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = '';

            // Refresh list
            fetchExpenses();
            alert('Expense added successfully!');
        } catch (error) {
            alert('Failed to add expense');
        }
    };

    return (
        <div>
            <div className="page-header">
                <h2>Expenses & Bills</h2>
                <div className="page-header-actions">
                    <label style={{ fontWeight: 500 }}>Filter: </label>
                    <input
                        type="month"
                        className="form-control"
                        style={{ width: 'auto' }}
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3" style={{ gridTemplateColumns: isAdmin ? 'minmax(300px, 1fr) 2fr' : '1fr' }}>
                {/* Add Expense Form */}
                {isAdmin && (
                    <div className="glass card" style={{ height: 'fit-content' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Add New Expense</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category</label>
                                <select className="form-control" value={category} onChange={e => setCategory(e.target.value)}>
                                    <option value="Lift Maintenance">Lift Maintenance</option>
                                    <option value="Swipper Cost">Swipper Cost</option>
                                    <option value="Electricity">Electricity</option>
                                    <option value="Water">Water</option>
                                    <option value="Repairs">Repairs</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input type="number" required className="form-control" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Month</label>
                                <input type="month" required className="form-control" value={expenseMonth} onChange={e => setExpenseMonth(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Date of Expense</label>
                                <input type="date" required className="form-control" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea className="form-control" rows="2" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                            </div>
                            <div className="form-group">
                                <label>Upload Bills</label>
                                <input type="file" multiple className="form-control" ref={fileInputRef} onChange={e => setBillFiles(e.target.files)} accept="image/*,.pdf" />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                                <Plus size={20} /> Add Expense
                            </button>
                        </form>
                    </div>
                )}

                {/* Expenses List */}
                <div className="glass card">
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Expense History</h3>
                    {loading ? <p>Loading...</p> : expenses.length === 0 ? <p>No expenses logged for this month.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {expenses.map(exp => (
                                <div key={exp._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', borderLeft: '4px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                    {editingExpenseId === exp._id ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <select className="form-control" style={{ padding: '0.25rem', width: 'auto' }} value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                                                    <option value="Lift Maintenance">Lift Maintenance</option>
                                                    <option value="Swipper Cost">Swipper Cost</option>
                                                    <option value="Electricity">Electricity</option>
                                                    <option value="Water">Water</option>
                                                    <option value="Repairs">Repairs</option>
                                                    <option value="Others">Others</option>
                                                </select>
                                                <input type="number" placeholder="Amount" className="form-control" style={{ padding: '0.25rem', width: 'min-content' }} value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} />
                                                <input type="month" className="form-control" style={{ padding: '0.25rem', width: 'auto' }} value={editForm.month} onChange={e => setEditForm({...editForm, month: e.target.value})} />
                                                <input type="date" className="form-control" style={{ padding: '0.25rem', width: 'auto' }} value={editForm.expenseDate} onChange={e => setEditForm({...editForm, expenseDate: e.target.value})} />
                                            </div>
                                            <textarea placeholder="Description" className="form-control" rows="1" style={{ padding: '0.25rem' }} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <label style={{ fontSize: '0.875rem' }}>Update Bills:</label>
                                                <input type="file" multiple className="form-control" style={{ padding: '0.25rem', width: 'auto' }} onChange={e => setEditBillFiles(e.target.files)} accept="image/*,.pdf" />
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setEditingExpenseId(null)} className="btn" style={{ padding: '0.25rem 0.5rem' }}><X size={14} /> Cancel</button>
                                                <button onClick={() => handleSaveEdit(exp._id)} className="btn btn-primary" style={{ padding: '0.25rem 0.5rem' }}><Check size={14} /> Save Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{exp.category}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                        {new Date(exp.expenseDate).toLocaleDateString()} &middot; {exp.month}
                                                    </p>
                                                    {isAdmin && (
                                                        <button title="Edit Date" onClick={() => handleEditClick(exp)} className="btn" style={{ padding: '0.2rem', border: 'none', background: 'transparent' }}>
                                                            <Edit2 size={14} color="gray" />
                                                        </button>
                                                    )}
                                                </div>
                                                {exp.description && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontStyle: 'italic' }}>{exp.description}</p>}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>₹{exp.amount}</span>
                                                {exp.billCount > 0 && (
                                                    <button onClick={() => handleDownloadBills(exp._id, exp.category, exp.expenseDate)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'white', border: '1px solid var(--border)' }}>
                                                        <Download size={14} /> View/Download Bills ({exp.billCount})
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expenses;
