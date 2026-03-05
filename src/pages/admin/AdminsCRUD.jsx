import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { Plus, Loader2, Shield, Mail, User, Image, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminsCRUD = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', image: null ,role: 'admin'});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const { data } = await adminService.getAll();
            setAdmins(data);
        } catch {
            toast.error('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.password) {
            return toast.error('All fields are required');
        }
        setSubmitting(true);
        try {
            await adminService.create(formData);
            toast.success('Admin added successfully');
            setFormData({ name: '', email: '', password: '', image: null });
            fetchAdmins();
        } catch {
            toast.error('Error adding admin');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}><Loader2 className="spinner" size={40} color="var(--primary)" /></div>;

    return (
        <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <Shield size={28} color="var(--primary)" />
                <h2 style={{ color: 'var(--primary)', margin: 0 }}>Administrator Management</h2>
            </div>

            {/* Create Admin Form */}
            <div style={{ backgroundColor: '#f9fafb', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2.5rem' }}>
                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={18} /> Add New Administrator</h4>
                <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: 'var(--radius)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                placeholder="admin@example.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: 'var(--radius)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600' }}>Profile Image</label>
                        <div style={{ position: 'relative' }}>
                            <Image size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => setFormData({ ...formData, image: reader.result });
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.2rem', borderRadius: 'var(--radius)' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600' }}>Role</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius)' }}
                        >
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '600' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem 2.5rem 0.6rem 0.6rem', borderRadius: 'var(--radius)', border: '1px solid #ddd' }}
                            />
                            <div
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#777' }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '0.6rem 1.5rem' }}>
                        {submitting ? <Loader2 size={18} className="spinner" /> : 'Add Admin'}
                    </button>
                </form>
            </div>

            {/* Admins Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f3f4f6' }}>
                            <th style={{ padding: '1rem' }}>Administrator</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--primary)' }}>{admin.name}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{admin.email}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{admin.role}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminsCRUD;