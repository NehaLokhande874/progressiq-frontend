import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#22d3ee'];

const AdminDashboard = () => {
    const [users,   setUsers]   = useState([]);
    const [tasks,   setTasks]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [uRes, tRes] = await Promise.all([
                    API.get('/admin/users'),
                    API.get('/admin/tasks'),
                ]);
                setUsers(uRes.data);
                setTasks(tRes.data);
            } catch (err) {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</span>
        </div>
    );

    // ── Computed stats ──
    const totalUsers     = users.length;
    const totalTasks     = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks   = tasks.filter(t => t.status === 'pending').length;
    const submittedTasks = tasks.filter(t => t.status === 'submitted').length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const roleCount = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
    }, {});
    const pieData = Object.entries(roleCount).map(([name, value]) => ({ name, value }));

    const statusPie = [
        { name: 'Completed', value: completedTasks },
        { name: 'Pending',   value: pendingTasks   },
        { name: 'Submitted', value: submittedTasks  },
    ].filter(d => d.value > 0);

    const ROLE_COLOR = {
        admin:  '#f59e0b',
        leader: '#6366f1',
        mentor: '#10b981',
        member: '#22d3ee',
    };

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Admin Dashboard</h1>
                        <p className="page-subtitle">
                            System-wide overview ·{' '}
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric',
                                month: 'long',  day: 'numeric'
                            })}
                        </p>
                    </div>
                    <span className="badge badge-green">● Live</span>
                </div>

                {error && (
                    <div className="alert alert-error"><span>⚠</span> {error}</div>
                )}

                {/* Stat cards */}
                <div className="stats-grid">
                    {[
                        { icon: '👥', label: 'Total Users',     value: totalUsers,          color: 'purple' },
                        { icon: '📋', label: 'Total Tasks',     value: totalTasks,          color: 'blue'   },
                        { icon: '✅', label: 'Completed',       value: completedTasks,      color: 'green'  },
                        { icon: '⏳', label: 'Pending',         value: pendingTasks,        color: 'yellow' },
                        { icon: '📤', label: 'Submitted',       value: submittedTasks,      color: 'cyan'   },
                        { icon: '📈', label: 'Completion Rate', value: `${completionRate}%`, color: 'green' },
                    ].map(s => (
                        <div className="stat-card" key={s.label}>
                            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                            <div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Users by Role</div>
                                <div className="card-subtitle">{totalUsers} total users</div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData} cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85}
                                    paddingAngle={3} dataKey="value"
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8, fontSize: 12
                                }} />
                                <Legend iconType="circle" iconSize={8}
                                    formatter={(v) => (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">Task Status</div>
                                <div className="card-subtitle">{totalTasks} total tasks</div>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={statusPie} cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85}
                                    paddingAngle={3} dataKey="value"
                                >
                                    {statusPie.map((entry, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8, fontSize: 12
                                }} />
                                <Legend iconType="circle" iconSize={8}
                                    formatter={(v) => (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Users table */}
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">All Users</div>
                            <div className="card-subtitle">Manage and view all organization members</div>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan={4}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">👥</div>
                                            <div className="empty-state-title">No users found</div>
                                        </div>
                                    </td></tr>
                                ) : users.map((u) => (
                                    <tr key={u._id}>
                                        <td>
                                            <div className="flex-row">
                                                <div className="avatar avatar-sm">
                                                    {(u.name || u.email).slice(0, 2).toUpperCase()}
                                                </div>
                                                <span style={{ fontWeight: 500 }}>{u.name || '—'}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                                        <td>
                                            <span className="badge" style={{
                                                background: `${ROLE_COLOR[u.role]}18`,
                                                color: ROLE_COLOR[u.role],
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{
                                            color: 'var(--text-muted)',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            fontSize: '0.8rem'
                                        }}>
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default AdminDashboard;