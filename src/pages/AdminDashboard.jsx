import React, { useEffect, useState, useRef } from 'react';
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

const AdminDashboard = () => {
    const [users,        setUsers]        = useState([]);
    const [tasks,        setTasks]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [notification, setNotification] = useState('');
    const [activeTab,    setActiveTab]    = useState('overview');
    const [teamForm,     setTeamForm]     = useState({ email: '', teamName: '', projectName: '', totalMarks: 100 });
    const [teamMsg,      setTeamMsg]      = useState('');
    const socketRef = useRef(null);

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

    const scoreData = users
        .filter(u => u.role === 'member')
        .map(u => ({
            name:  u.username?.split(' ')[0] || u.email,
            score: u.autoScore  || 0,
            total: u.totalMarks || 100,
        }));

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
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <>
                        <div className="stats-grid">
                            {[
                                { icon: '👥', label: 'Total Users',     value: totalUsers,           color: 'purple' },
                                { icon: '📋', label: 'Total Tasks',     value: totalTasks,           color: 'blue'   },
                                { icon: '✅', label: 'Completed',       value: completedTasks,       color: 'green'  },
                                { icon: '⏳', label: 'Pending',         value: pendingTasks,         color: 'yellow' },
                                { icon: '📤', label: 'Submitted',       value: submittedTasks,       color: 'cyan'   },
                                { icon: '📈', label: 'Completion Rate', value: `${completionRate}%`, color: 'green'  },
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
                                            innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                            {pieData.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
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
                                            innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                            {statusPie.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                                        <Legend iconType="circle" iconSize={8}
                                            formatter={v => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* TEAMS */}
                {activeTab === 'teams' && (
                    <>
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header">
                                <div>
                                    <div className="card-title">Assign Team & Project</div>
                                    <div className="card-subtitle">Set team name, project and total marks</div>
                                </div>
                            </div>
                            {teamMsg && (
                                <div className={`alert ${teamMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                                    {teamMsg}
                                </div>
                            )}
                            <form onSubmit={assignTeam}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
                                <button type="submit" className="btn btn-primary">Assign Team</button>
                            </form>
                        </div>

                        {Object.entries(teams).map(([teamName, team]) => (
                            <div className="card" key={teamName} style={{ marginBottom: '1.2rem' }}>
                                <div className="card-header">
                                    <div>
                                        <div className="card-title">👥 {teamName}</div>
                                        <div className="card-subtitle">
                                            Project: <strong style={{ color: 'var(--primary-light)' }}>{team.projectName}</strong>
                                            {' · '}{team.members.length} member(s)
                                        </div>
                                    </div>
                                    <span className="badge badge-blue">{team.members.length}</span>
                                </div>
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr><th>Name</th><th>Email</th><th>Role</th><th>Score</th></tr>
                                        </thead>
                                        <tbody>
                                            {team.members.map(u => (
                                                <tr key={u._id}>
                                                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                                                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                                                    <td>
                                                        <span className="badge" style={{
                                                            background: `${ROLE_COLOR[u.role] || '#6366f1'}18`,
                                                            color: ROLE_COLOR[u.role] || '#a5b4fc'
                                                        }}>{u.role}</span>
                                                    </td>
                                                    <td>
                                                        {u.role === 'member' ? (
                                                            <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                                                                {u.autoScore || 0}/{u.totalMarks || 100}
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* SCORES */}
                {activeTab === 'scores' && (
                    <>
                        <div className="card" style={{ marginBottom: '1.5rem' }}>
                            <div className="card-header">
                                <div>
                                    <div className="card-title">🏆 Auto-Evaluation Scores</div>
                                    <div className="card-subtitle">Calculated automatically — no manual editing possible</div>
                                </div>
                                <span className="badge badge-green">🔒 Auto-locked</span>
                            </div>
                            <div style={{
                                background: 'rgba(99,102,241,0.08)', borderRadius: 10,
                                padding: '1rem', marginBottom: '1.2rem',
                                fontSize: '0.82rem', color: 'var(--text-muted)',
                                borderLeft: '3px solid var(--primary)',
                            }}>
                                <strong style={{ color: 'var(--primary-light)' }}>Score Formula: </strong>
                                Completion Rate (40%) + On-Time Delivery (30%) + Task Weightage (20%) + Mentor Feedback (10%)
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={scoreData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                                        formatter={(value, name, props) => [`${value}/${props.payload.total}`, 'Score']}
                                    />
                                    <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <div className="card-title">Member Score Details</div>
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Member</th><th>Team</th><th>Project</th>
                                            <th>Score</th><th>Out of</th><th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(u => u.role === 'member').length === 0 ? (
                                            <tr><td colSpan={6}>
                                                <div className="empty-state">
                                                    <div className="empty-state-icon">🏆</div>
                                                    <div className="empty-state-title">No member scores yet</div>
                                                </div>
                                            </td></tr>
                                        ) : users.filter(u => u.role === 'member').map(u => {
                                            const pct = u.totalMarks
                                                ? Math.round(((u.autoScore || 0) / u.totalMarks) * 100) : 0;
                                            return (
                                                <tr key={u._id}>
                                                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                                                    <td style={{ color: 'var(--text-muted)' }}>{u.teamName    || '—'}</td>
                                                    <td style={{ color: 'var(--text-muted)' }}>{u.projectName || '—'}</td>
                                                    <td style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{u.autoScore || 0}</td>
                                                    <td>{u.totalMarks || 100}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                            <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                                                                <div className="progress-fill" style={{ width: `${pct}%` }} />
                                                            </div>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{pct}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* USERS */}
                {activeTab === 'users' && (
                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">All Users</div>
                                <div className="card-subtitle">Manage all organization members</div>
                            </div>
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
                                            <td style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem' }}>
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.email)}>
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