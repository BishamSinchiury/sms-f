import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/layout/AdminLayout/PageContainer';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import adminApi from '@/services/axios/adminApi';

// ── Detail Panel ──────────────────────────────────────────────────────────────
function UserDetailPanel({ user, onClose }) {
    if (!user) return null;

    const statusColor = user.status === 'waiting_approval' ? '#22c55e' : '#94a3b8';
    const statusLabel = user.status === 'waiting_approval' ? 'Ready for Review' : 'Profile Pending';

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 1000,
                }}
            />

            {/* Slide-in panel */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: '400px', maxWidth: '90vw',
                background: 'var(--surface, #fff)',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
                zIndex: 1001,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 1.5rem 1rem',
                    borderBottom: '1px solid var(--color-border, #e2e8f0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-700)' }}>
                            User Profile
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                            Registration details
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '1.5rem', color: 'var(--color-text-secondary)',
                            lineHeight: 1, padding: '0.25rem',
                        }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    {/* Avatar */}
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '1.75rem', fontWeight: 700,
                        marginBottom: '1.25rem',
                    }}>
                        {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </div>

                    {/* Status badge */}
                    <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: statusColor,
                        color: '#fff',
                        marginBottom: '1.5rem',
                    }}>
                        {statusLabel}
                    </span>

                    {/* Fields */}
                    {[
                        { label: 'Full Name',    value: `${user.first_name || ''} ${user.last_name || ''}`.trim() || '—' },
                        { label: 'Email',        value: user.email        || '—' },
                        { label: 'Phone Number', value: user.phone_number || '—' },
                        { label: 'Requested Role', value: user.role_name  || '—' },
                        { label: 'Registered At', value: user.created_at
                            ? new Date(user.created_at).toLocaleString()
                            : '—' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ marginBottom: '1.25rem' }}>
                            <p style={{ margin: '0 0 2px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {label}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--navy-700, #1a202c)', fontWeight: 500 }}>
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

// ── Main UserApprovals component ──────────────────────────────────────────────
export default function UserApprovals() {
    const [users, setUsers]               = useState([]);
    const [loading, setLoading]           = useState(true);
    // FIX 11 (BUG 15): Per-row loading state using a Set, not a single value.
    // This allows multiple independent approve/reject actions concurrently.
    const [actionLoading, setActionLoading] = useState(new Set());
    const [selectedUser, setSelectedUser] = useState(null);
    const { addToast } = useToast();

    useEffect(() => { fetchPendingUsers(); }, []);

    async function fetchPendingUsers() {
        try {
            const res = await adminApi.get('/sys/users/pending/');
            setUsers(res.data);
        } catch {
            addToast({ type: 'error', message: 'Failed to load pending users.' });
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id) {
        setActionLoading(prev => new Set(prev).add(id));
        try {
            await adminApi.post(`/sys/users/${id}/approve/`);
            addToast({ type: 'success', message: 'User approved.' });
            setUsers(prev => prev.filter(u => u.id !== id));
            if (selectedUser?.id === id) setSelectedUser(null);
        } catch {
            addToast({ type: 'error', message: 'Failed to approve user.' });
        } finally {
            setActionLoading(prev => { const next = new Set(prev); next.delete(id); return next; });
        }
    }

    async function handleReject(id) {
        const reason = prompt('Optional rejection reason:');
        if (reason === null) return;
        setActionLoading(prev => new Set(prev).add(id));
        try {
            await adminApi.post(`/sys/users/${id}/reject/`, { reason });
            addToast({ type: 'success', message: 'User rejected.' });
            setUsers(prev => prev.filter(u => u.id !== id));
            if (selectedUser?.id === id) setSelectedUser(null);
        } catch {
            addToast({ type: 'error', message: 'Failed to reject user.' });
        } finally {
            setActionLoading(prev => { const next = new Set(prev); next.delete(id); return next; });
        }
    }

    return (
        <>
            <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />

            <PageContainer>
                <div style={{ padding: 'var(--space-4)', background: 'var(--white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <h2 style={{ marginBottom: 'var(--space-1)', color: 'var(--navy-700)' }}>User Approvals</h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                        Review pending registration requests from teachers and students.
                    </p>

                    {loading ? (
                        <div>Loading...</div>
                    ) : users.length === 0 ? (
                        <div style={{ padding: 'var(--space-6)', border: '2px dashed var(--navy-100)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--navy-400)' }}>
                            No pending users.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <th style={{ padding: '1rem' }}>Name</th>
                                    <th style={{ padding: '1rem' }}>Email</th>
                                    <th style={{ padding: '1rem' }}>Requested Role</th>
                                    <th style={{ padding: '1rem' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr
                                        key={u.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            background: selectedUser?.id === u.id ? 'var(--navy-50, #f8fafc)' : 'transparent',
                                        }}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => setSelectedUser(u)}
                                                style={{
                                                    background: 'none', border: 'none', padding: 0,
                                                    cursor: 'pointer', textAlign: 'left',
                                                    color: 'var(--primary)', textDecoration: 'underline',
                                                    fontSize: 'inherit', fontWeight: 500,
                                                }}
                                            >
                                                {u.first_name} {u.last_name}
                                            </button>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{u.email}</td>
                                        <td style={{ padding: '1rem' }}>{u.role_name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem', borderRadius: '9999px',
                                                fontSize: '0.875rem',
                                                backgroundColor: u.status === 'waiting_approval' ? '#22c55e' : 'var(--navy-300)',
                                                color: '#fff'
                                            }}>
                                                {u.status === 'waiting_approval' ? 'Ready for Review' : 'Profile Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedUser(u)}
                                                style={{ color: 'var(--navy-500)' }}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleReject(u.id)}
                                                loading={actionLoading.has(u.id)}
                                                disabled={actionLoading.has(u.id)}
                                                style={{ color: 'var(--error)' }}
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleApprove(u.id)}
                                                loading={actionLoading.has(u.id)}
                                                disabled={actionLoading.has(u.id)}
                                                title={u.status === 'pending' ? 'User has not completed profile' : ''}
                                            >
                                                Approve
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </PageContainer>
        </>
    );
}
