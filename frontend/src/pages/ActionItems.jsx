import { useState, useEffect } from 'react';
import { getActionItems, addActionItem, updateActionItem } from '../api';
import { Plus, CheckCircle2, Circle, Edit2 } from 'lucide-react';

const ActionItems = ({ isAdmin }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const fetchItems = async () => {
        try {
            setLoading(true);
            const data = await getActionItems();
            setItems(data);
        } catch (error) {
            console.error('Failed to fetch action items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            await addActionItem(newTaskTitle);
            setNewTaskTitle('');
            fetchItems();
        } catch (error) {
            alert('Failed to add action item');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
            await updateActionItem(id, { status: newStatus });
            fetchItems();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleEditTitle = async (id, currentTitle) => {
        const newTitle = prompt('Edit Task Description:', currentTitle);
        if (newTitle !== null && newTitle.trim() !== '') {
            try {
                await updateActionItem(id, { title: newTitle });
                fetchItems();
            } catch (error) {
                alert('Failed to edit task');
            }
        }
    };

    const pendingItems = items.filter(i => i.status === 'Pending');
    const completedItems = items.filter(i => i.status === 'Completed');

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Action Items</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Track pending and completed society tasks.</p>
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gridTemplateColumns: isAdmin ? 'minmax(300px, 1fr) 2fr' : '1fr' }}>
                {isAdmin && (
                    <div className="glass card" style={{ height: 'fit-content' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0' }}>Add New Task</h3>
                        <form onSubmit={handleAddTask}>
                            <div className="form-group">
                                <label>Task Description</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    required
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="Enter action item details..."
                                ></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <Plus size={20} /> Add Task
                            </button>
                        </form>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass card">
                        <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Circle size={20} /> Pending Tasks ({pendingItems.length})
                        </h3>

                        {loading ? <p>Loading tasks...</p> : pendingItems.length === 0 ? <p>All caught up! No pending action items.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {pendingItems.map(item => (
                                    <div key={item._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.5, flex: 1 }}>{item.title}</p>

                                        {isAdmin && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn" style={{ padding: '0.5rem', background: 'white' }} onClick={() => handleEditTitle(item._id, item.title)} title="Edit Task">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: 'var(--secondary)' }} onClick={() => handleToggleStatus(item._id, item.status)}>
                                                    Mark Completed
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass card">
                        <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle2 size={20} /> Completed Logs ({completedItems.length})
                        </h3>

                        {loading ? <p>Loading...</p> : completedItems.length === 0 ? <p>No completed tasks logged yet.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {completedItems.map(item => (
                                    <div key={item._id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '8px', borderLeft: '4px solid var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', opacity: 0.8 }}>
                                        <div>
                                            <p style={{ margin: 0, lineHeight: 1.5, textDecoration: 'line-through', color: 'var(--text-secondary)' }}>{item.title}</p>
                                        </div>
                                        {isAdmin && (
                                            <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'white' }} onClick={() => handleToggleStatus(item._id, item.status)}>
                                                Undo
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActionItems;
