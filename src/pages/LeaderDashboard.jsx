import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
         BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
                 || 'https://progressiq-backend.onrender.com';

const STATUS_COLORS = {
    Completed: '#10b981', Pending: '#f59e0b',
    Active: '#f59e0b', Submitted: '#6366f1', Revision: '#ef4444',
};

const LeaderDashboard = () => {
    const [stats,        setStats]        = useState({ total: 0, completed: 0, pending: 0, submitted: 0 });
    const [teamTasks,    setTeamTasks]    = useState([]);
    const [members,      setMembers]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [notification, setNotification] = useState('');
    const navigate  = useNavigate();
    const socketRef = useRef(null);

    const email       = localStorage.getItem('email')       || '';
    const teamName    = localStorage.getItem('teamName')    || '';
    const projectName = localStorage.getItem('projectName') || '';

    useEffect(() => {
        socketRef.current = io(BACKEND_URL, { withCredentials: true });
        if (email)    socketRef.current.emit('join', email);
        if (teamName) socketRef.current.emit('join-team', teamName);

        socketRef.current.on('work-submitted', ({ memberEmail }) => {
            setNotification(`📤 ${memberEmail} submitted work!`);
            setTimeout(() => setNotification(''), 5000);
            fetchAll();
        });
        socketRef.current.on('score-updated', () => fetchAll());
        socketRef.current.on('team-updated',  () => fetchAll());

        return () => socketRef.current?.disconnect();
    }, []);

    const fetchAll = async () => {
        try {
            const [sRes, tRes, mRes] = await Promise.all([
                API.get(`/tasks/leader/stats?email=${email}`),
                API.get(`/tasks/leader/team-tasks?email=${email}`),
                API.get(`/tasks/leader/members?email=${email}`),
            ]);
            setStats(sRes.data);
            setTeamTasks(tRes.data);
            setMembers(mRes.data);
        } catch { setError('Failed to load dashboard data.'); }
        finally  { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    if (loading) return (
        <div className="loading-screen"><div className="spinner" /></div>
    );

    const pieData = [
        { name: 'Completed', value: stats.completed },
        { name: 'Pending',   value: stats.pending   },
        { name: 'Submitted', value: stats.submitted  },
    ].filter(d => d.value > 0);

    const completionRate = stats.total
        ? Math.round((stats.completed / stats.total) * 100) : 0;

    const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444'];

    const scoreData = members.map(m => ({
        name:  m.username?.split(' ')[0] || m.email,
        score: m.autoScore  || 0,
        total: m.totalMarks || 100,
    }));

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                <div className="page-header">
                    <div>
                        <h1 className="page-title">Leader Dashboard</h1>
                        <p className="page-subtitle">Team performance overview</p>
                        {(teamName || projectName) && (
                            <div className="flex-row" style={{ marginTop: '0.4rem', gap: '0.6rem' }}>
                                {teamName    && <span className="badge badge-blue">👥 {teamName}</span>}
                                {projectName && <span className="badge badge-purple">📁 {projectName}</span>}
                            </div>
                        )}
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/leader-tasks')}>
                        + Manage Tasks
                    </button>
                </div>

                {notification && <div className="alert alert-info">{notification}</div>}
                {error        && <div className="alert alert-error"><span>⚠</span> {error}</div>}

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

                {/* Charts */}
                <div className="grid-2" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Task Status Distribution</div>
                        </div>
                        {pieData.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-title">No task data yet</div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={85}
                                        paddingAngle={3} dataKey="value">
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i] || '#6366f1'} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{
                                        background: 'var(--surface-2)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 8, fontSize: 12
                                    }} />
                                    <Legend iconType="circle" iconSize={8}
                                        formatter={v => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Member Scores</div>
                            <span className="badge badge-green">🔒 Auto</span>
                        </div>
                        {scoreData.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-title">No scores yet</div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={scoreData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--surface-2)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 8, fontSize: 12
                                        }}
                                        formatter={(v, n, p) => [`${v}/${p.payload.total}`, 'Score']}
                                    />
                                    <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Members list */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <div className="card-title">Team Members</div>
                        <span className="badge badge-blue">{members.length}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {members.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">👥</div>
                                <div className="empty-state-title">No members yet</div>
                                <div className="empty-state-body">
                                    Ask admin to assign members to your team
                                </div>
                            </div>
                        ) : members.map(m => {
                            const pct = m.totalMarks
                                ? Math.round(((m.autoScore || 0) / m.totalMarks) * 100) : 0;
                            return (
                                <div key={m._id} className="flex-between" style={{
                                    padding: '0.75rem 1rem',
                                    background: 'var(--surface-2)',
                                    borderRadius: 10, cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                }} onClick={() => navigate(`/member-details/${m.email}`)}>
                                    <div className="flex-row">
                                        <div className="avatar avatar-sm">
                                            {(m.username || m.email).slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                {m.username || m.email}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {m.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontSize: '0.8rem', fontWeight: 700,
                                                color: 'var(--primary-light)'
                                            }}>
                                                {m.autoScore || 0}/{m.totalMarks || 100}
                                            </div>
                                            <div style={{ width: 80 }}>
                                                <div className="progress-bar" style={{ height: 4 }}>
                                                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)' }}>
                                            View →
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tasks table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">All Team Tasks</div>
                        <span className="badge badge-purple">{teamTasks.length} tasks</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Task</th><th>Assigned To</th><th>Weightage</th>
                                    <th>Deadline</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamTasks.length === 0 ? (
                                    <tr><td colSpan={5}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-title">No tasks yet</div>
                                        </div>
                                    </td></tr>
                                ) : teamTasks.map(t => (
                                    <tr key={t._id}>
                                        <td style={{ fontWeight: 500 }}>{t.title}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>{t.assignedTo}</td>
                                        <td>
                                            <span style={{
                                                background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
                                                padding: '2px 8px', borderRadius: 6,
                                                fontSize: '0.78rem', fontWeight: 700
                                            }}>{t.weightage || 5}/10</span>
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
                                            }}>{t.status || 'Pending'}</span>
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