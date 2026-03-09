import { useState, useEffect, useRef } from 'react';
import { getExpenses, addExpense } from '../api';
import { Plus, Download } from 'lucide-react';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState('');

    // Form state
    const [category, setCategory] = useState('Others');
    const [amount, setAmount] = useState('');
    const [expenseMonth, setExpenseMonth] = useState('');
    const [description, setDescription] = useState('');
    const [billFile, setBillFile] = useState(null);

    const fileInputRef = useRef();

    useEffect(() => {
        const today = new Date();
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setMonth(currentMonth);
        setExpenseMonth(currentMonth);
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
        if (billFile) {
            formData.append('billImage', billFile);
        }

        try {
            await addExpense(formData);
            // Reset form
            setAmount('');
            setDescription('');
            setBillFile(null);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Expenses & Bills</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
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

            <div className="grid grid-cols-3" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr' }}>
                {/* Add Expense Form */}
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
                            <label>Description (Optional)</label>
                            <textarea className="form-control" rows="2" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                        </div>
                        <div className="form-group">
                            <label>Upload Bill</label>
                            <input type="file" className="form-control" ref={fileInputRef} onChange={e => setBillFile(e.target.files[0])} accept="image/*,.pdf" />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                            <Plus size={20} /> Add Expense
                        </button>
                    </form>
                </div>

                {/* Expenses List */}
                <div className="glass card">
                    <h3 style={{ margin: '0 0 1.5rem 0' }}>Expense History</h3>
                    {loading ? <p>Loading...</p> : expenses.length === 0 ? <p>No expenses logged for this month.</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {expenses.map(exp => (
                                <div key={exp._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', borderLeft: '4px solid var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{exp.category}</h4>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            {new Date(exp.expenseDate).toLocaleDateString()} &middot; {exp.month}
                                        </p>
                                        {exp.description && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontStyle: 'italic' }}>{exp.description}</p>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>₹{exp.amount}</span>
                                        {exp.billUrl && (
                                            <a href={`http://localhost:5000${exp.billUrl}`} target="_blank" rel="noreferrer" className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'white', border: '1px solid var(--border)' }}>
                                                <Download size={14} /> View Bill
                                            </a>
                                        )}
                                    </div>
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
