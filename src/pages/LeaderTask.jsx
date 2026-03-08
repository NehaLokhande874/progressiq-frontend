import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
                 || 'https://progressiq-backend.onrender.com';

const STATUS_COLORS = {
    Completed:     { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
    Pending:       { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
    Active:        { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
    Submitted:     { bg: 'rgba(99,102,241,0.12)',  color: '#a5b4fc' },
    Revision:      { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
    'In Progress': { bg: 'rgba(34,211,238,0.12)',  color: '#22d3ee' },
};

const emptyTask = { title: '', assignedTo: '', deadline: '', weightage: 5 };

const LeaderTask = () => {
    const [tasksList, setTasksList] = useState([{ ...emptyTask }]);
    const [myTasks,   setMyTasks]   = useState([]);
    const [members,   setMembers]   = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [fetching,  setFetching]  = useState(true);
    const [success,   setSuccess]   = useState('');
    const [error,     setError]     = useState('');
    const navigate  = useNavigate();
    const socketRef = useRef(null);

    const email       = localStorage.getItem('email')       || '';
    const teamName    = localStorage.getItem('teamName')    || '';
    const projectName = localStorage.getItem('projectName') || '';

    useEffect(() => {
        socketRef.current = io(BACKEND_URL, { withCredentials: true });
        if (email) socketRef.current.emit('join', email);

        socketRef.current.on('work-submitted', () => { fetchData(); });

        return () => socketRef.current?.disconnect();
    }, []);

    const fetchData = async () => {
        try {
            const [tRes, mRes] = await Promise.all([
                API.get('/tasks/leader/my-tasks'),
                API.get('/tasks/leader/members'),
            ]);
            setMyTasks(tRes.data);
            setMembers(mRes.data);
        } catch {
            setError('Failed to load data.');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleRowChange = (i, field, value) => {
        setTasksList(prev =>
            prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t)
        );
    };

    const addRow    = () => setTasksList(prev => [...prev, { ...emptyTask }]);
    const removeRow = (i) => setTasksList(prev => prev.filter((_, idx) => idx !== i));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        const valid = tasksList.filter(t => t.title.trim() && t.assignedTo);
        if (!valid.length) return setError('Please fill in at least one task.');
        setLoading(true);
        try {
            const tasksToSend = valid.map(t => ({
                ...t,
                leaderEmail: email,
                teamName:    teamName    || 'Default Team',
                projectName: projectName || 'Default Project',
                weightage:   parseInt(t.weightage) || 5,
            }));
            await API.post('/tasks/leader/tasks', { tasks: tasksToSend });
            setSuccess(`✅ ${valid.length} task(s) assigned successfully!`);
            setTasksList([{ ...emptyTask }]);
            const { data } = await API.get('/tasks/leader/my-tasks');
            setMyTasks(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign tasks.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="loading-screen"><div className="spinner" /></div>
    );

    return (
        <div className="page-shell">
            <Sidebar active="Manage Tasks" />
            <main className="main-content">

                <div className="page-header">
                    <div>
                        <h1 className="page-title">Manage Tasks</h1>
                        <p className="page-subtitle">Assign tasks to your team members</p>
                        {(teamName || projectName) && (
                            <div className="flex-row" style={{ marginTop: '0.4rem', gap: '0.6rem' }}>
                                {teamName    && <span className="badge badge-blue">👥 {teamName}</span>}
                                {projectName && <span className="badge badge-purple">📁 {projectName}</span>}
                            </div>
                        )}
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/leader-dashboard')}>
                        ← Dashboard
                    </button>
                </div>

                {error   && <div className="alert alert-error"><span>⚠</span> {error}</div>}
                {success && <div className="alert alert-success"><span>✓</span> {success}</div>}

                {/* Assign tasks form */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="card-header">
                        <div>
                            <div className="card-title">Assign New Tasks</div>
                            <div className="card-subtitle">
                                Set title, assignee, deadline and difficulty weightage
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={addRow}>
                            + Add Row
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.2rem' }}>

                            {/* Column headers */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
                                gap: '0.75rem', alignItems: 'center'
                            }}>
                                <span className="section-title" style={{ margin: 0 }}>Task Title</span>
                                <span className="section-title" style={{ margin: 0 }}>Assign To</span>
                                <span className="section-title" style={{ margin: 0 }}>Deadline</span>
                                <span className="section-title" style={{ margin: 0 }}>Weightage (1-10)</span>
                                <span />
                            </div>

                            {/* Task rows */}
                            {tasksList.map((task, i) => (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto',
                                    gap: '0.75rem', alignItems: 'center',
                                    background: 'var(--surface-2)', borderRadius: 8,
                                    padding: '0.75rem', border: '1px solid var(--border)',
                                }}>
                                    <input
                                        className="form-input"
                                        placeholder="e.g. Write API docs"
                                        value={task.title}
                                        onChange={e => handleRowChange(i, 'title', e.target.value)}
                                    />
                                    <select
                                        className="form-select"
                                        value={task.assignedTo}
                                        onChange={e => handleRowChange(i, 'assignedTo', e.target.value)}
                                    >
                                        <option value="">Select member…</option>
                                        {members.map(m => (
                                            <option key={m._id} value={m.email}>
                                                {m.username || m.email}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="date" className="form-input"
                                        value={task.deadline}
                                        onChange={e => handleRowChange(i, 'deadline', e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    {/* Weightage slider */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="range" min="1" max="10" step="1"
                                            value={task.weightage}
                                            onChange={e => handleRowChange(i, 'weightage', e.target.value)}
                                            style={{ flex: 1, accentColor: 'var(--primary)' }}
                                        />
                                        <span style={{
                                            minWidth: 28, textAlign: 'center',
                                            fontWeight: 700, color: 'var(--primary-light)',
                                            fontSize: '0.9rem'
                                        }}>{task.weightage}</span>
                                    </div>
                                    <button
                                        type="button" className="btn btn-danger btn-sm"
                                        onClick={() => removeRow(i)}
                                        disabled={tasksList.length === 1}
                                        style={{ padding: '0.35rem 0.6rem' }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>

                        <div className="flex-row">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                        Assigning…
                                    </>
                                ) : '✓ Assign Tasks'}
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={addRow}>
                                + Add another row
                            </button>
                        </div>
                    </form>
                </div>

                {/* Existing tasks table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">All Assigned Tasks</div>
                        <span className="badge badge-purple">{myTasks.length}</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Task</th><th>Assigned To</th><th>Weightage</th>
                                    <th>Deadline</th><th>Status</th><th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTasks.length === 0 ? (
                                    <tr><td colSpan={6}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-title">No tasks assigned yet</div>
                                        </div>
                                    </td></tr>
                                ) : myTasks.map(t => {
                                    const sc = STATUS_COLORS[t.status] || STATUS_COLORS.Pending;
                                    return (
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
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: '0.8rem', color: 'var(--text-muted)'
                                            }}>
                                                {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                                                    {t.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ minWidth: 120 }}>
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{
                                                        width: t.status === 'Completed' ? '100%'
                                                             : t.status === 'Submitted'  ? '75%'
                                                             : t.status === 'Revision'   ? '40%'
                                                             : '20%',
                                                    }} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default LeaderTask;