import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
         BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
                 || 'https://progressiq-backend.onrender.com';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#22d3ee'];
const ROLE_COLOR = {
    admin:  '#f59e0b',
    leader: '#6366f1',
    mentor: '#10b981',
    member: '#22d3ee',
};

// ── TeamScoreCard component (outside main component to allow useState in map) ──
const TeamScoreCard = ({ teamName, team, tasks }) => {
    const [expanded, setExpanded] = useState(false);

    const teamMembers = team.members.filter(u => u.role === 'member');
    if (teamMembers.length === 0) return null;

    const teamScoreData = teamMembers.map(u => ({
        name:  u.username?.split(' ')[0] || u.email,
        score: u.autoScore  || 0,
        total: u.totalMarks || 100,
    }));

    const avgScore = Math.round(
        teamMembers.reduce((s, u) => s + (u.autoScore || 0), 0) / teamMembers.length
    );
    const avgTotal = Math.round(
        teamMembers.reduce((s, u) => s + (u.totalMarks || 100), 0) / teamMembers.length
    );
    const avgPct = avgTotal ? Math.round((avgScore / avgTotal) * 100) : 0;

    return (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
            {/* Team header */}
            <div className="flex-between" style={{ marginBottom: expanded ? '1.2rem' : 0 }}>
                <div>
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: '0.75rem', flexWrap: 'wrap'
                    }}>
                        <div className="card-title">👥 {teamName}</div>
                        <span className="badge badge-purple">📁 {team.projectName}</span>
                        <span className="badge badge-blue">{teamMembers.length} member(s)</span>
                        <span className="badge badge-green">🔒 Auto Score</span>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: '0.75rem', marginTop: '0.6rem'
                    }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Team Avg:
                        </span>
                        <div style={{ width: 140 }}>
                            <div className="progress-bar" style={{ height: 6 }}>
                                <div className="progress-fill" style={{ width: `${avgPct}%` }} />
                            </div>
                        </div>
                        <span style={{
                            fontSize: '0.85rem', fontWeight: 700,
                            color: avgPct >= 70 ? '#34d399'
                                 : avgPct >= 40 ? '#fbbf24' : '#f87171'
                        }}>
                            {avgScore}/{avgTotal} · {avgPct}%
                        </span>
                    </div>
                </div>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setExpanded(prev => !prev)}
                    style={{ minWidth: 140 }}
                >
                    {expanded ? '▲ Hide Details' : '📊 View Details'}
                </button>
            </div>

            {/* Expanded section */}
            {expanded && (
                <>
                    <div style={{
                        background: 'rgba(99,102,241,0.06)', borderRadius: 10,
                        padding: '0.75rem 1rem', marginBottom: '1.2rem',
                        fontSize: '0.8rem', color: 'var(--text-muted)',
                        borderLeft: '3px solid var(--primary)',
                    }}>
                        <strong style={{ color: 'var(--primary-light)' }}>
                            🔒 Score Formula:{' '}
                        </strong>
                        Completion (40%) + On-Time (30%) + Difficulty (20%) + Feedback (10%)
                    </div>

                    {/* Bar chart */}
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={teamScoreData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8, fontSize: 12
                                }}
                                formatter={(value, name, props) =>
                                    [`${value}/${props.payload.total}`, 'Score']}
                            />
                            <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Members score table */}
                    <div className="table-wrap" style={{ marginTop: '1.2rem' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Score</th>
                                    <th>Out of</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamMembers.map(u => {
                                    const pct = u.totalMarks
                                        ? Math.round(((u.autoScore || 0) / u.totalMarks) * 100) : 0;
                                    return (
                                        <tr key={u._id}>
                                            <td>
                                                <div className="flex-row">
                                                    <div className="avatar avatar-sm">
                                                        {(u.username || u.email).slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                                                            {u.username}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{
                                                fontWeight: 700,
                                                color: 'var(--primary-light)',
                                                fontSize: '1rem'
                                            }}>
                                                {u.autoScore || 0}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)' }}>
                                                {u.totalMarks || 100}
                                            </td>
                                            <td>
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.6rem'
                                                }}>
                                                    <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                                                        <div className="progress-fill"
                                                            style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span style={{
                                                        fontSize: '0.8rem', fontWeight: 600,
                                                        minWidth: 36,
                                                        color: pct >= 70 ? '#34d399'
                                                             : pct >= 40 ? '#fbbf24' : '#f87171'
                                                    }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

// ── Main AdminDashboard component ──
const AdminDashboard = () => {
    const [users,        setUsers]        = useState([]);
    const [tasks,        setTasks]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [notification, setNotification] = useState('');
    const [activeTab,    setActiveTab]    = useState('overview');
    const [modal,        setModal]        = useState(null);
    const [teamForm,     setTeamForm]     = useState({
        email: '', teamName: '', projectName: '', totalMarks: 100
    });
    const [teamMsg,  setTeamMsg]  = useState('');
    const socketRef  = useRef(null);
    const location   = useLocation();

    // ✅ Read tab from URL query param (for sidebar links)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) setActiveTab(tab);
    }, [location.search]);

    useEffect(() => {
        socketRef.current = io(BACKEND_URL, { withCredentials: true });
        const email = localStorage.getItem('email');
        if (email) socketRef.current.emit('join', email);

        socketRef.current.on('score-updated', ({ email, autoScore, totalMarks }) => {
            setNotification(`📊 Score updated for ${email}: ${autoScore}/${totalMarks}`);
            setTimeout(() => setNotification(''), 5000);
            fetchAll();
        });
        socketRef.current.on('work-submitted', () => {
            setNotification('📤 A member submitted work!');
            setTimeout(() => setNotification(''), 4000);
            fetchAll();
        });
        socketRef.current.on('team-updated', () => fetchAll());

        return () => socketRef.current?.disconnect();
    }, []);

    const fetchAll = async () => {
        try {
            const [uRes, tRes] = await Promise.all([
                API.get('/auth/admin/users'),
                API.get('/tasks/all'),
            ]);
            setUsers(uRes.data);
            setTasks(tRes.data);
        } catch { setError('Failed to load dashboard data.'); }
        finally  { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const assignTeam = async (e) => {
        e.preventDefault();
        setTeamMsg('');
        try {
            await API.put('/auth/admin/assign-team', teamForm);
            setTeamMsg('✅ Team assigned successfully!');
            setTeamForm({ email: '', teamName: '', projectName: '', totalMarks: 100 });
            fetchAll();
        } catch (err) {
            setTeamMsg('❌ ' + (err.response?.data?.message || 'Failed'));
        }
    };

    const deleteUser = async (email) => {
        if (!confirm(`Delete user ${email}?`)) return;
        try {
            await API.delete(`/auth/admin/delete-user/${email}`);
            fetchAll();
        } catch { setError('Delete failed.'); }
    };

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</span>
        </div>
    );

    // ── Computed values ──
    const totalUsers     = users.length;
    const totalTasks     = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks   = tasks.filter(t => ['Pending','Active'].includes(t.status)).length;
    const submittedTasks = tasks.filter(t => t.status === 'Submitted').length;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const roleCount = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1; return acc;
    }, {});
    const pieData   = Object.entries(roleCount).map(([name, value]) => ({ name, value }));
    const statusPie = [
        { name: 'Completed', value: completedTasks },
        { name: 'Pending',   value: pendingTasks   },
        { name: 'Submitted', value: submittedTasks  },
    ].filter(d => d.value > 0);

    const teams = users.reduce((acc, u) => {
        const key = u.teamName || 'Unassigned';
        if (!acc[key]) acc[key] = { teamName: key, projectName: u.projectName || '—', members: [] };
        acc[key].members.push(u);
        return acc;
    }, {});

    const tabStyle = (t) => ({
        padding: '0.5rem 1.2rem', borderRadius: 8, border: 'none',
        cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
        background: activeTab === t ? 'var(--primary)' : 'var(--surface-2)',
        color:      activeTab === t ? '#fff' : 'var(--text-muted)',
        transition: 'all 0.2s',
    });

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                <div className="page-header">
                    <div>
                        <h1 className="page-title">Admin Dashboard</h1>
                        <p className="page-subtitle">
                            System-wide overview ·{' '}
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric',
                                month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                    <span className="badge badge-green">● Live</span>
                </div>

                {notification && <div className="alert alert-info">{notification}</div>}
                {error        && <div className="alert alert-error"><span>⚠</span> {error}</div>}

                {/* Tabs */}
                <div className="flex-row" style={{ gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    {['overview','teams','scores','users'].map(t => (
                        <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
                            {t === 'overview' ? '📊 Overview'
                           : t === 'teams'    ? '👥 Teams'
                           : t === 'scores'   ? '🏆 Scores'
                           :                    '👤 Users'}
                        </button>
                    ))}
                </div>

                {/* ✅ MODAL POPUP */}
                {modal && (
                    <div onClick={() => setModal(null)} style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 100,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div onClick={e => e.stopPropagation()} style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border-bright)',
                            borderRadius: 16, padding: '1.5rem',
                            minWidth: 360, maxWidth: 520,
                            maxHeight: '80vh', overflowY: 'auto',
                            boxShadow: 'var(--shadow-lg)',
                        }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: '1.2rem',
                                borderBottom: '1px solid var(--border)',
                                paddingBottom: '0.75rem',
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                                    {modal.icon} {modal.title}
                                </h3>
                                <button onClick={() => setModal(null)} style={{
                                    background: 'var(--surface-3)', border: 'none',
                                    color: 'var(--text-muted)', borderRadius: 6,
                                    width: 28, height: 28, cursor: 'pointer',
                                    fontSize: '0.9rem', display: 'grid', placeItems: 'center'
                                }}>✕</button>
                            </div>

                            {modal.items.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">{modal.icon}</div>
                                    <div className="empty-state-title">No data found</div>
                                </div>
                            ) : modal.items.map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.65rem 0.9rem',
                                    background: i % 2 === 0 ? 'var(--surface-2)' : 'transparent',
                                    borderRadius: 8, marginBottom: '0.3rem',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                            {item.name}
                                        </div>
                                        {item.sub && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {item.sub}
                                            </div>
                                        )}
                                    </div>
                                    {item.badge && (
                                        <span className="badge" style={{
                                            background: item.badgeBg || 'var(--primary-dim)',
                                            color: item.badgeColor  || 'var(--primary-light)',
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                    <>
                        {/* ✅ Clickable stat cards */}
                        <div className="stats-grid">
                            {[
                                {
                                    icon: '👥', label: 'Total Users', value: totalUsers, color: 'purple',
                                    onClick: () => setModal({
                                        icon: '👥', title: 'All Users',
                                        items: users.map(u => ({
                                            name: u.username || u.email,
                                            sub:  u.email,
                                            badge: u.role,
                                            badgeBg:    `${ROLE_COLOR[u.role] || '#6366f1'}18`,
                                            badgeColor:  ROLE_COLOR[u.role]   || '#a5b4fc',
                                        }))
                                    })
                                },
                                {
                                    icon: '📋', label: 'Total Tasks', value: totalTasks, color: 'blue',
                                    onClick: () => setModal({
                                        icon: '📋', title: 'All Tasks',
                                        items: tasks.map(t => ({
                                            name: t.title,
                                            sub:  `Assigned to: ${t.assignedTo || '—'}`,
                                            badge: t.status || 'Pending',
                                            badgeBg:   t.status === 'Completed' ? 'rgba(16,185,129,0.12)'
                                                     : t.status === 'Submitted' ? 'rgba(99,102,241,0.12)'
                                                     : 'rgba(245,158,11,0.12)',
                                            badgeColor: t.status === 'Completed' ? '#34d399'
                                                      : t.status === 'Submitted' ? '#a5b4fc'
                                                      : '#fbbf24',
                                        }))
                                    })
                                },
                                {
                                    icon: '✅', label: 'Completed', value: completedTasks, color: 'green',
                                    onClick: () => setModal({
                                        icon: '✅', title: 'Completed Tasks',
                                        items: tasks.filter(t => t.status === 'Completed').map(t => ({
                                            name: t.title,
                                            sub:  `Assigned to: ${t.assignedTo || '—'}`,
                                            badge: '✅ Completed',
                                            badgeBg: 'rgba(16,185,129,0.12)', badgeColor: '#34d399',
                                        }))
                                    })
                                },
                                {
                                    icon: '⏳', label: 'Pending', value: pendingTasks, color: 'yellow',
                                    onClick: () => setModal({
                                        icon: '⏳', title: 'Pending Tasks',
                                        items: tasks.filter(t => ['Pending','Active'].includes(t.status)).map(t => ({
                                            name: t.title,
                                            sub:  `Assigned to: ${t.assignedTo || '—'}`,
                                            badge: t.status || 'Pending',
                                            badgeBg: 'rgba(245,158,11,0.12)', badgeColor: '#fbbf24',
                                        }))
                                    })
                                },
                                {
                                    icon: '📤', label: 'Submitted', value: submittedTasks, color: 'cyan',
                                    onClick: () => setModal({
                                        icon: '📤', title: 'Submitted Tasks',
                                        items: tasks.filter(t => t.status === 'Submitted').map(t => ({
                                            name: t.title,
                                            sub:  `Assigned to: ${t.assignedTo || '—'}`,
                                            badge: '📤 Submitted',
                                            badgeBg: 'rgba(99,102,241,0.12)', badgeColor: '#a5b4fc',
                                        }))
                                    })
                                },
                                {
                                    icon: '📈', label: 'Completion Rate', value: `${completionRate}%`, color: 'green',
                                    onClick: () => setModal({
                                        icon: '📈', title: 'Completion Rate by Member',
                                        items: users.filter(u => u.role === 'member').map(u => {
                                            const mt   = tasks.filter(t => t.assignedTo === u.email);
                                            const done = mt.filter(t => t.status === 'Completed').length;
                                            const rate = mt.length ? Math.round((done / mt.length) * 100) : 0;
                                            return {
                                                name: u.username || u.email,
                                                sub:  `${done}/${mt.length} tasks completed`,
                                                badge: `${rate}%`,
                                                badgeBg:    rate >= 70 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                                                badgeColor: rate >= 70 ? '#34d399' : '#fbbf24',
                                            };
                                        })
                                    })
                                },
                            ].map(s => (
                                <div
                                    className="stat-card" key={s.label}
                                    onClick={s.onClick}
                                    style={{ cursor: 'pointer' }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                        e.currentTarget.style.boxShadow   = 'var(--glow)';
                                        e.currentTarget.style.transform   = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow   = 'none';
                                        e.currentTarget.style.transform   = 'translateY(0)';
                                    }}
                                >
                                    <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                                    <div>
                                        <div className="stat-value">{s.value}</div>
                                        <div className="stat-label">{s.label}</div>
                                    </div>
                                    <div style={{
                                        marginLeft: 'auto', fontSize: '0.62rem',
                                        color: 'var(--text-faint)', alignSelf: 'flex-end'
                                    }}>click ↗</div>
                                </div>
                            ))}
                        </div>

                        {/* Charts */}
                        <div className="grid-2" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="card">
                                <div className="card-header">
                                    <div>
                                        <div className="card-title">Users by Role</div>
                                        <div className="card-subtitle">{totalUsers} total users</div>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={85}
                                            paddingAngle={3} dataKey="value">
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
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
                                        <Pie data={statusPie} cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={85}
                                            paddingAngle={3} dataKey="value">
                                            {statusPie.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
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
                            </div>
                        </div>
                    </>
                )}

                {/* ── TEAMS ── */}
                {activeTab === 'teams' && (
                    <>
                        {/* Assign form */}
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header">
                                <div>
                                    <div className="card-title">Assign Team & Project</div>
                                    <div className="card-subtitle">
                                        Set team name, project and total marks for any user
                                    </div>
                                </div>
                            </div>
                            {teamMsg && (
                                <div className={`alert ${teamMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                                    {teamMsg}
                                </div>
                            )}
                            <form onSubmit={assignTeam}>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                                    gap: '1rem', marginBottom: '1rem'
                                }}>
                                    <div className="form-group">
                                        <label className="form-label">User</label>
                                        <select className="form-select"
                                            value={teamForm.email}
                                            onChange={e => setTeamForm(p => ({ ...p, email: e.target.value }))}
                                            required>
                                            <option value="">Select user…</option>
                                            {users.map(u => (
                                                <option key={u._id} value={u.email}>
                                                    {u.username} ({u.role})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Team Name</label>
                                        <input className="form-input" placeholder="e.g. Team Alpha"
                                            value={teamForm.teamName}
                                            onChange={e => setTeamForm(p => ({ ...p, teamName: e.target.value }))}
                                            required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Project Name</label>
                                        <input className="form-input" placeholder="e.g. ProgressIQ"
                                            value={teamForm.projectName}
                                            onChange={e => setTeamForm(p => ({ ...p, projectName: e.target.value }))}
                                            required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Total Marks</label>
                                        <input className="form-input" type="number" min="10" max="1000"
                                            value={teamForm.totalMarks}
                                            onChange={e => setTeamForm(p => ({ ...p, totalMarks: +e.target.value }))} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    Assign Team
                                </button>
                            </form>
                        </div>

                        {/* ✅ Team cards — leader/mentor at top, members in table */}
                        {Object.entries(teams).map(([teamName, team]) => {
                            const leaders = team.members.filter(u => u.role === 'leader');
                            const mentors = team.members.filter(u => u.role === 'mentor');
                            const members = team.members.filter(u => u.role === 'member');

                            return (
                                <div className="card" key={teamName} style={{ marginBottom: '1.2rem' }}>
                                    <div className="card-header">
                                        <div>
                                            <div className="card-title">👥 {teamName}</div>
                                            <div className="card-subtitle">
                                                Project:{' '}
                                                <strong style={{ color: 'var(--primary-light)' }}>
                                                    {team.projectName}
                                                </strong>
                                                {' · '}{team.members.length} member(s)
                                            </div>
                                        </div>
                                        <span className="badge badge-blue">{team.members.length}</span>
                                    </div>

                                    {/* ✅ Leader & Mentor info cards */}
                                    {(leaders.length > 0 || mentors.length > 0) && (
                                        <div className="flex-row" style={{
                                            marginBottom: '1rem', flexWrap: 'wrap', gap: '0.6rem'
                                        }}>
                                            {[...leaders, ...mentors].map(u => (
                                                <div key={u._id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    background: u.role === 'leader'
                                                        ? 'rgba(99,102,241,0.08)' : 'rgba(16,185,129,0.08)',
                                                    border: `1px solid ${u.role === 'leader'
                                                        ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}`,
                                                    borderRadius: 8, padding: '0.4rem 0.8rem',
                                                }}>
                                                    <div className="avatar avatar-sm">
                                                        {(u.username || u.email).slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                                            {u.username}
                                                        </div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                    <span className="badge" style={{
                                                        background: `${ROLE_COLOR[u.role]}18`,
                                                        color: ROLE_COLOR[u.role],
                                                    }}>{u.role}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ✅ Members only table with score */}
                                    {members.length > 0 ? (
                                        <div className="table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Member</th>
                                                        <th>Email</th>
                                                        <th>Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {members.map(u => {
                                                        const pct = u.totalMarks
                                                            ? Math.round(((u.autoScore || 0) / u.totalMarks) * 100) : 0;
                                                        return (
                                                            <tr key={u._id}>
                                                                <td>
                                                                    <div className="flex-row">
                                                                        <div className="avatar avatar-sm">
                                                                            {(u.username || u.email).slice(0, 2).toUpperCase()}
                                                                        </div>
                                                                        <span style={{ fontWeight: 500 }}>
                                                                            {u.username}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                                                                <td>
                                                                    <div style={{
                                                                        display: 'flex', alignItems: 'center', gap: '0.6rem'
                                                                    }}>
                                                                        <div className="progress-bar" style={{ width: 80, height: 5 }}>
                                                                            <div className="progress-fill" style={{ width: `${pct}%` }} />
                                                                        </div>
                                                                        <span style={{
                                                                            fontWeight: 700,
                                                                            color: 'var(--primary-light)',
                                                                            fontSize: '0.85rem'
                                                                        }}>
                                                                            {u.autoScore || 0}/{u.totalMarks || 100}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={{
                                            fontSize: '0.8rem', color: 'var(--text-muted)',
                                            padding: '0.5rem 0', textAlign: 'center'
                                        }}>
                                            No members assigned yet
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

                {/* ── SCORES ── */}
                {activeTab === 'scores' && (
                    <>
                        {Object.entries(teams).map(([teamName, team]) => (
                            <TeamScoreCard
                                key={teamName}
                                teamName={teamName}
                                team={team}
                                tasks={tasks}
                            />
                        ))}
                        {Object.values(teams).every(
                            t => t.members.filter(u => u.role === 'member').length === 0
                        ) && (
                            <div className="card">
                                <div className="empty-state">
                                    <div className="empty-state-icon">🏆</div>
                                    <div className="empty-state-title">No member scores yet</div>
                                    <div className="empty-state-body">
                                        Assign members to teams to see scores here
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ── USERS ── */}
                {activeTab === 'users' && (
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">All Users</div>
                                <div className="card-subtitle">Manage all organization members</div>
                            </div>
                            <span className="badge badge-blue">{totalUsers} total</span>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>User</th><th>Email</th><th>Role</th>
                                        <th>Team</th><th>Project</th><th>Joined</th><th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan={7}>
                                            <div className="empty-state">
                                                <div className="empty-state-icon">👥</div>
                                                <div className="empty-state-title">No users found</div>
                                            </div>
                                        </td></tr>
                                    ) : users.map(u => (
                                        <tr key={u._id}>
                                            <td>
                                                <div className="flex-row">
                                                    <div className="avatar avatar-sm">
                                                        {(u.username || u.email).slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 500 }}>{u.username || '—'}</span>
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: `${ROLE_COLOR[u.role] || '#6366f1'}18`,
                                                    color: ROLE_COLOR[u.role] || '#a5b4fc',
                                                }}>{u.role}</span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)' }}>{u.teamName    || '—'}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>{u.projectName || '—'}</td>
                                            <td style={{
                                                color: 'var(--text-muted)',
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: '0.8rem'
                                            }}>
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => deleteUser(u.email)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default AdminDashboard;