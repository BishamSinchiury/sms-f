import React, { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/AdminLayout/PageContainer';
import { Shield, Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';
import adminApi from '@/services/axios/adminApi';
import { useToast } from '@/components/ui/Toast';

const ROLE_TYPES = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'staff', label: 'Staff' },
    { value: 'admin', label: 'Admin' },
    { value: 'owner', label: 'Owner' },
    { value: 'vendor', label: 'Vendor' },
];

export default function RolesManagement() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role_type: 'staff',
        description: ''
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const res = await adminApi.get('/sys/roles/');
            setRoles(res.data);
        } catch (error) {
            addToast({ type: 'error', message: 'Failed to load roles' });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setFormData({
            name: role.name,
            role_type: role.role_type,
            description: role.description || ''
        });
        setIsEditing(false);
    };

    const handleCreateNew = () => {
        setSelectedRole(null);
        setFormData({ name: '', role_type: 'staff', description: '' });
        setIsEditing(true);
    };

    const handleDelete = async (roleId) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await adminApi.delete(`/sys/roles/${roleId}/`);
            addToast({ type: 'success', message: 'Role deleted successfully' });
            setRoles(prev => prev.filter(r => r.id !== roleId));
            if (selectedRole?.id === roleId) {
                setSelectedRole(null);
                setIsEditing(false);
            }
        } catch (error) {
            addToast({ type: 'error', message: error.response?.data?.detail || 'Failed to delete role' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (selectedRole) {
                // Update
                const res = await adminApi.put(`/sys/roles/${selectedRole.id}/`, formData);
                addToast({ type: 'success', message: 'Role updated successfully' });
                setRoles(prev => prev.map(r => r.id === selectedRole.id ? res.data : r));
                setSelectedRole(res.data);
                setIsEditing(false);
            } else {
                // Create
                const res = await adminApi.post('/sys/roles/', formData);
                addToast({ type: 'success', message: 'Role created successfully' });
                setRoles(prev => [...prev, res.data].sort((a,b) => a.name.localeCompare(b.name)));
                setSelectedRole(res.data);
                setIsEditing(false);
            }
        } catch (error) {
            const data = error.response?.data;
            let msg = 'Failed to save role';
            if (data?.name) msg = data.name[0];
            else if (data?.role_type) msg = data.role_type[0];
            else if (data?.detail) msg = data.detail;
            addToast({ type: 'error', message: typeof msg === 'string' ? msg : JSON.stringify(msg) });
        } finally {
            setSaving(false);
        }
    };

    const filteredRoles = roles.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <PageContainer breadcrumbs={[{ label: 'Roles Management', path: '/admin/roles' }]}>
            <div style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                
                {/* Left Column: List */}
                <div style={{ 
                    flex: '0 0 350px', 
                    background: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Shield size={20} color="var(--color-primary)" />
                                Roles
                            </h2>
                            <button 
                                onClick={handleCreateNew}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'var(--color-primary)', color: '#fff',
                                    border: 'none', padding: '6px 12px', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                                }}
                            >
                                <Plus size={16} /> New Role
                            </button>
                        </div>
                        
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '8px 10px 8px 32px',
                                    border: '1px solid #cbd5e1', borderRadius: '6px',
                                    outline: 'none', fontSize: '0.9rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading roles...</div>
                        ) : filteredRoles.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No roles found.</div>
                        ) : (
                            filteredRoles.map(role => (
                                <div 
                                    key={role.id}
                                    onClick={() => handleSelectRole(role)}
                                    style={{
                                        padding: '1rem 1.25rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        cursor: 'pointer',
                                        background: selectedRole?.id === role.id ? '#f8fafc' : '#fff',
                                        borderLeft: selectedRole?.id === role.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{role.name}</span>
                                        {role.is_system_role && (
                                            <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>SYSTEM</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', textTransform: 'capitalize' }}>
                                        Type: {role.role_type}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Detail / Edit Form */}
                <div style={{ 
                    flex: 1, 
                    background: '#fff', 
                    borderRadius: '12px', 
                    border: '1px solid var(--color-border)',
                    overflowY: 'auto',
                    padding: '2rem'
                }}>
                    {(!selectedRole && !isEditing) ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <Shield size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <h3 style={{ margin: 0, color: '#64748b', fontWeight: 500 }}>Select a role to view details</h3>
                            <p style={{ margin: '8px 0 0', fontSize: '0.9rem' }}>Or create a new role to get started.</p>
                        </div>
                    ) : (
                        <div style={{ maxWidth: '600px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>
                                        {isEditing ? (selectedRole ? 'Edit Role' : 'Create New Role') : selectedRole.name}
                                    </h2>
                                    {selectedRole?.is_system_role && !isEditing && (
                                        <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.75rem', background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                            System roles cannot be renamed, changed in type, or deleted.
                                        </span>
                                    )}
                                </div>
                                
                                {!isEditing && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => setIsEditing(true)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                background: '#fff', color: '#334155', border: '1px solid #cbd5e1', 
                                                padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                                            }}
                                        >
                                            <Edit2 size={16} /> Edit
                                        </button>
                                        {!selectedRole?.is_system_role && (
                                            <button 
                                                onClick={() => handleDelete(selectedRole.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', 
                                                    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
                                                }}
                                            >
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <form onSubmit={handleSubmit}>
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Role Name *</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            disabled={selectedRole?.is_system_role}
                                            placeholder="e.g. Senior Teacher"
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                                        />
                                    </div>
                                    
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Registration Type *</label>
                                        <select 
                                            required
                                            value={formData.role_type}
                                            onChange={e => setFormData({...formData, role_type: e.target.value})}
                                            disabled={selectedRole?.is_system_role}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', background: '#fff' }}
                                        >
                                            {ROLE_TYPES.map(rt => (
                                                <option key={rt.value} value={rt.value}>{rt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Description</label>
                                        <textarea 
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            placeholder="Brief description of this role's responsibilities..."
                                            rows={4}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                if (!selectedRole) {
                                                    setIsEditing(false);
                                                } else {
                                                    handleSelectRole(selectedRole);
                                                }
                                            }}
                                            style={{ padding: '10px 16px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            disabled={saving}
                                            style={{ padding: '10px 24px', border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                                        >
                                            {saving ? 'Saving...' : 'Save Role'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registration Type</h4>
                                        <p style={{ margin: 0, fontSize: '1rem', color: '#1e293b', textTransform: 'capitalize', fontWeight: 500 }}>{selectedRole.role_type}</p>
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</h4>
                                        <p style={{ margin: 0, fontSize: '1rem', color: '#334155', lineHeight: 1.5 }}>{selectedRole.description || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>No description provided.</span>}</p>
                                    </div>
                                    <div style={{ marginBottom: '2rem' }}>
                                        <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created At</h4>
                                        <p style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>{new Date(selectedRole.created_at).toLocaleString()}</p>
                                    </div>

                                    <div style={{ marginTop: '4rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                                        <h4 style={{ margin: '0 0 8px', color: '#475569' }}>Permissions & Feature Flags</h4>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Granular permissions management functionality will be available in the next release.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
