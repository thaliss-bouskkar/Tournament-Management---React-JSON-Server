import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
    Save,
    User,
    Mail,
    Lock,
    Loader2,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Link as LinkIcon,
    RefreshCw,
    Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminProfile = () => {
    const { user, updateProfile } = useAuth();
    const { settings, updateLogo, refreshSettings } = useSettings();
    const fileInputRef = useRef(null);
    const profilePicInputRef = useRef(null);

    // ===== Profile State =====
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: ''
    });
    const [profileImage, setProfileImage] = useState(user?.image || '');
    const [submitting, setSubmitting] = useState(false);

    // ===== Logo State =====
    const [logoUrl, setLogoUrl] = useState(settings?.logoUrl || '');
    const [updatingLogo, setUpdatingLogo] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // ===== Load user updates from JSON/mock =====
    useEffect(() => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            password: ''
        });
        setProfileImage(user?.image || '');
        setLogoUrl(settings?.logoUrl || '');
    }, [user, settings]);

    // ===== Handlers =====
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const updateData = { 
            name: formData.name, 
            email: formData.email,
            image: profileImage // Base64
        };
        if (formData.password) updateData.password = formData.password;

        try {
            const result = await updateProfile(updateData); // update JSON/mock
            if (result.success) {
                toast.success('Profile updated successfully');
                setFormData({ ...formData, password: '' });
            } else {
                toast.error(result.message || 'Failed to update profile');
            }
        } catch {
            toast.error('An error occurred');
        }
        setSubmitting(false);
    };

    const handleLogoUpdate = async (e) => {
        e.preventDefault();
        if (!logoUrl) return toast.error('Logo source is required');
        setUpdatingLogo(true);
        try {
            const success = await updateLogo(logoUrl); // Base64 if uploaded local
            if (success) toast.success('Tournament logo updated');
            else toast.error('Failed to update logo');
        } catch {
            toast.error('An error occurred');
        }
        setUpdatingLogo(false);
    };

    const handleFileUpload = (e, setImage) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) return toast.error('File too large (max 2MB)');

        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result); // Base64 string
            toast.success('Image loaded. Click Save to apply.');
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteAccount = async () => {
    try {
        setSubmitting(true);
        const result = await updateProfile({ deleteSelf: true }); // updateProfile خصو يدعم حذف
        if (result.success) {
            toast.success('Account deleted successfully');
            // إعادة توجيه أو مسح context
            window.location.href = '/login'; 
        } else {
            toast.error(result.message || 'Failed to delete account');
        }
    } catch {
        toast.error('An error occurred while deleting account');
    } finally {
        setSubmitting(false);
    }
};
const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

            {/* ===== Profile Section ===== */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={24} /> Admin Profile
                </h3>

                {/* Profile Image */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <img
                        src={profileImage || '/admin.png'}
                        alt="Profile"
                        style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '0.5rem', border: '2px solid #ddd' }}
                    />
                    <div>
                        <input type="file" ref={profilePicInputRef} style={{ display: 'none' }} onChange={e => handleFileUpload(e, setProfileImage)} accept="image/*" />
                        <button type="button" className="btn-secondary" onClick={() => profilePicInputRef.current.click()} style={{ padding: '0.5rem 1rem' }}>
                            <Upload size={16} /> Change Image
                        </button>
                    </div>
                </div>

                <form onSubmit={handleProfileSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>New Password (leave blank to keep current)</label>
                        <div style={{ position: 'relative' }}>
                        <Lock 
                            size={18} 
                            style={{ 
                                position: 'absolute', 
                                left: '10px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#888' 
                            }} 
                        />

                        <input
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem 2.5rem 0.75rem 2.5rem', 
                                borderRadius: '8px', 
                                border: '1px solid #ddd' 
                            }}
                        />

                        {/* Eye Icon */}
                        <div
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                color: '#888'
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </div>
                    </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                        {submitting ? <Loader2 size={18} className="spinner" /> : <Save size={18} />} Update Profile
                    </button>
                    {/* ===== Delete Account Button ===== */}
                    <br/>
                <div style={{ textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={() => setShowConfirm(true)}
                        disabled={submitting}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            color: '#fff',
                            background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
                    >
                        {submitting ? <Loader2 size={18} className="spinner" /> : 'Delete My Account'}
                    </button>
                </div>
                {/* ===== Confirmation Modal ===== */}
                    {showConfirm && (
                        <div
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 9999,
                            }}
                        >
                            <div
                                style={{
                                    background: '#ffffff',
                                    padding: '2rem',
                                    borderRadius: '18px',
                                    width: '90%',
                                    maxWidth: '420px',
                                    textAlign: 'center',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                                    animation: 'fadeIn 0.25s ease-in-out',
                                }}
                            >
                                <h3 style={{ 
                                    fontSize: '1.3rem', 
                                    fontWeight: '700', 
                                    marginBottom: '1rem',
                                    color: '#DC2626'
                                }}>
                                    Confirm Account Deletion
                                </h3>

                                <p style={{ 
                                    marginBottom: '2rem', 
                                    color: '#6B7280', 
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5'
                                }}>
                                    Are you sure you want to delete your account?  
                                    This action cannot be undone.
                                </p>

                                <div style={{ 
                                    display: 'flex', 
                                    gap: '1rem', 
                                    justifyContent: 'center' 
                                }}>
                                    
                                    {/* Cancel Button */}
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        style={{
                                            padding: '0.6rem 1.5rem',
                                            borderRadius: '12px',
                                            border: '1px solid #E5E7EB',
                                            background: '#F9FAFB',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: '0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#F9FAFB'}
                                    >
                                        Cancel
                                    </button>

                                    {/* Confirm Delete Button */}
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={submitting}
                                        style={{
                                            padding: '0.6rem 1.5rem',
                                            borderRadius: '12px',
                                            border: 'none',
                                            background: 'linear-gradient(90deg,#EF4444,#DC2626)',
                                            color: '#fff',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: '0.2s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {submitting ? "Deleting..." : "Yes, Delete"}
                                    </button>

                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* ===== Logo Section ===== */}
            <div className="card">
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ImageIcon size={24} /> Tournament Branding
                </h3>

                <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '2px dashed #ddd' }}>
                    <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '1rem' }}>Current Logo Preview</p>
                    <img
                        src={logoUrl || '/logo.png'}
                        alt="Logo Preview"
                        style={{ maxHeight: '120px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                </div>

                <form onSubmit={handleLogoUpdate}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Logo Source</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <LinkIcon size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                <input
                                        type="text"
                                        value={logoUrl?.startsWith('data:image') ? '' : logoUrl}
                                        onChange={e => setLogoUrl(e.target.value)}
                                        placeholder={logoUrl?.startsWith('data:image') ? 'Uploaded Local File' : 'https://example.com/logo.png'}
                                        style={{ width: '100%', padding: '0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' }}
                                />
                            </div>
                            <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, setLogoUrl)} accept="image/*" style={{ display: 'none' }} />
                            <button type="button" onClick={() => fileInputRef.current.click()} className="btn-secondary" title="Upload from computer" style={{ padding: '0.75rem' }}>
                                <Upload size={18} />
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: '#888' }}>URL or local file (JPG, PNG, SVG). Max 2MB.</p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={() => { refreshSettings(); setLogoUrl(settings?.logoUrl || ''); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
                            <RefreshCw size={18} /> Reset
                        </button>
                        <button type="submit" className="btn-primary" disabled={updatingLogo} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 2, justifyContent: 'center' }}>
                            {updatingLogo ? <Loader2 size={18} className="spinner" /> : <Save size={18} />} Save Branding
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminProfile;