import React, { useState, useEffect } from 'react';
import { groupService } from '../../services/api';
import { cascadeService } from '../../services/cascadeService';
import { Plus, Edit, Trash2, Save, X, Loader2, Search, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupsCRUD = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '' });
    const [editName, setEditName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const { data } = await groupService.getAll();
            setGroups(data);
        } catch {
            toast.error('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Group name is required');
        setSubmitting(true);
        try {
            await groupService.create({ name: formData.name });
            toast.success('Group created successfully');
            setFormData({ name: '' });
            fetchGroups();
        } catch {
            toast.error('Error creating group');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return toast.error('Group name cannot be empty');
        setSubmitting(true);
        try {
            await groupService.update(id, { name: editName });
            toast.success('Group updated');
            setEditingId(null);
            fetchGroups();
        } catch {
            toast.error('Error updating group');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        const group = groups.find(g => g.id === id);
        if (!window.confirm(`CRITICAL: Deleting group "${group?.name}" will delete ALL teams, players, and matches associated with this group. This action is permanent and cannot be undone. Proceed?`)) return;

        // Optimistic UI Update
        const originalGroups = [...groups];
        setGroups(prev => prev.filter(g => g.id !== id));

        try {
            await cascadeService.deleteGroup(id); // Changed from deletePlayer to deleteGroup
            toast.success('Group and associated schedule purged'); // Changed message
            fetchGroups(); // Background sync
        } catch (e) {
            console.error(e);
            toast.error('Error deleting group');
            setGroups(originalGroups); // Rollback
        }
    };

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={40} /></div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '0.4rem' }}>Tournament Groups</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Categorize teams into competitive groups.</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '0.65rem 1rem 0.65rem 2.8rem', borderRadius: 'var(--radius)', border: '1px solid #ddd', width: '280px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
                {/* Create Section */}
                <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Plus size={20} className="text-secondary" /> Add New Group
                    </h4>
                    <form onSubmit={handleCreate}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Group Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Group A, Phase 1, etc."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '0.8rem' }}>
                            {submitting ? <Loader2 size={20} className="spinner" /> : <Plus size={20} />} Create Group
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={18} color="var(--primary)" />
                        <h4 style={{ margin: 0, color: 'var(--primary)' }}>Existing Groups</h4>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f3f4f6', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '1rem 1.5rem' }}>GROUP NAME</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGroups.length > 0 ? filteredGroups.map(group => (
                                    <tr key={group.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }} className="group-row">
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            {editingId === group.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    autoFocus
                                                    style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '2px solid var(--accent)', width: '100%', maxWidth: '200px', fontWeight: 'bold' }}
                                                />
                                            ) : (
                                                <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '1.1rem' }}>{group.name}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            {editingId === group.id ? (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                    <button onClick={() => handleUpdate(group.id)} className="btn-icon success"><Save size={20} /></button>
                                                    <button onClick={() => setEditingId(null)} className="btn-icon danger"><X size={20} /></button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                                    <button onClick={() => { setEditingId(group.id); setEditName(group.name); }} className="btn-icon primary"><Edit size={20} /></button>
                                                    <button onClick={() => handleDelete(group.id)} className="btn-icon danger"><Trash2 size={20} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No groups found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style>
                {`
                .group-row:hover {
                    background-color: #fcfcfc;
                }
                .btn-icon {
                    background: #f9fafb;
                    border: 1px solid #eee;
                    padding: 0.5rem;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon:hover {
                    background: #f3f4f6;
                    transform: translateY(-2px);
                }
                .btn-icon.success:hover { color: #10B981; border-color: #10B981; background: #ecfdf5; }
                .btn-icon.primary:hover { color: var(--primary); border-color: var(--primary); background: rgba(6, 78, 59, 0.05); }
                .btn-icon.danger:hover { color: #EF4444; border-color: #EF4444; background: #fef2f2; }
                `}
            </style>
        </div>
    );
};

export default GroupsCRUD;
