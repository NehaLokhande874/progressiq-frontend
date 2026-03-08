import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';

const STATUS_COLORS = {
    completed: '#10b981',
    pending:   '#f59e0b',
    submitted: '#6366f1',
    revision:  '#ef4444',
};

const LeaderDashboard = () => {
    const [stats,     setStats]     = useState({ total: 0, completed: 0, pending: 0, submitted: 0 });
    const [teamTasks, setTeamTasks] = useState([]);
    const [members,   setMembers]   = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [sRes, tRes, mRes] = await Promise.all([
                    API.get('/leader/stats'),
                    API.get('/leader/team-tasks'),
                    API.get('/leader/members'),
                ]);
                setStats(sRes.data);
                setTeamTasks(tRes.data);
                setMembers(mRes.data);
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

    const pieData = [
        { name: 'Completed', value: stats.completed },
        { name: 'Pending',   value: stats.pending   },
        { name: 'Submitted', value: stats.submitted  },
    ].filter(d => d.value > 0);

    const completionRate = stats.total
        ? Math.round((stats.completed / stats.total) * 100) : 0;

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Leader Dashboard</h1>
                        <p className="page-subtitle">Team performance overview</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/leader-tasks')}>
                        + Manage Tasks
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error"><span>⚠</span> {error}</div>
                )}

                {/* Stats */}
                <div className="stats-grid">
                    {[
                        { icon: '📋', label: 'Total Tasks',     value: stats.total,          color: 'blue'   },
                        { icon: '✅', label: 'Completed',       value: stats.completed,      color: 'green'  },
                        { icon: '⏳', label: 'Pending',         value: stats.pending,        color: 'yellow' },
                        { icon: '📤', label: 'Submitted',       value: stats.submitted,      color: 'purple' },
                        { icon: '📈', label: 'Completion Rate', value: `${completionRate}%`, color: 'cyan'   },
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

                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>

                    {/* Pie chart */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Task Status Distribution</div>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieData} cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={85}
                                    paddingAngle={3} dataKey="value"
                                >
                                    {pieData.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={Object.values(STATUS_COLORS)[i] || '#6366f1'}
                                            stroke="transparent"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8, fontSize: 12
                                }} />
                                <Legend iconType="circle" iconSize={8}
                                    formatter={v => (
                                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Member list */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Team Members</div>
                            <span className="badge badge-blue">{members.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {members.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">👥</div>
                                    <div className="empty-state-title">No members yet</div>
                                </div>
                            ) : members.map((m) => (
                                <div
                                    key={m._id}
                                    className="flex-between"
                                    style={{
                                        padding: '0.6rem 0.8rem',
                                        background: 'var(--surface-2)',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => navigate(`/member-details/${m.email}`)}
                                >
                                    <div className="flex-row">
                                        <div className="avatar avatar-sm">
                                            {(m.name || m.email).slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                {m.name || m.email}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {m.email}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>
                                        View →
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Team tasks table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">All Team Tasks</div>
                        <span className="badge badge-purple">{teamTasks.length} tasks</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Assigned To</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamTasks.length === 0 ? (
                                    <tr><td colSpan={4}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-title">No tasks yet</div>
                                        </div>
                                    </td></tr>
                                ) : teamTasks.map((t) => (
                                    <tr key={t._id}>
                                        <td style={{ fontWeight: 500 }}>{t.title}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {t.assignedTo?.name || t.assignedTo?.email || '—'}
                                        </td>
                                        <td style={{
                                            color: 'var(--text-muted)',
                                            fontFamily: 'JetBrains Mono, monospace',
                                            fontSize: '0.8rem'
                                        }}>
                                            {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <span className="badge" style={{
                                                background: `${STATUS_COLORS[t.status] || '#6366f1'}18`,
                                                color: STATUS_COLORS[t.status] || '#a5b4fc',
                                            }}>
                                                {t.status || 'pending'}
                                            </span>
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

export default LeaderDashboard;