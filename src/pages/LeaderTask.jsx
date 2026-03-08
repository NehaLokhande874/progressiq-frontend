import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';

const STATUS_COLORS = {
    completed: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    pending:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    submitted: { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
    revision:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
};

const emptyTask = { title: '', assignedTo: '', deadline: '' };

const LeaderTask = () => {
    const [tasksList, setTasksList] = useState([emptyTask]);
    const [myTasks,   setMyTasks]   = useState([]);
    const [members,   setMembers]   = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [fetching,  setFetching]  = useState(true);
    const [success,   setSuccess]   = useState('');
    const [error,     setError]     = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tRes, mRes] = await Promise.all([
                    API.get('/leader/my-tasks'),
                    API.get('/leader/members'),
                ]);
                setMyTasks(tRes.data);
                setMembers(mRes.data);
            } catch {
                setError('Failed to load data.');
            } finally {
                setFetching(false);
            }
        };
        fetchData();
    }, []);

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
        if (!valid.length) return setError('Please fill in at least one task with a title and assignee.');
        setLoading(true);
        try {
            await API.post('/leader/tasks', { tasks: valid });
            setSuccess(`${valid.length} task(s) assigned successfully!`);
            setTasksList([emptyTask]);
            const { data } = await API.get('/leader/my-tasks');
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

                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Manage Tasks</h1>
                        <p className="page-subtitle">Assign tasks to your team members</p>
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
                            <div className="card-subtitle">Add one or more tasks at once</div>
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
                                gridTemplateColumns: '1fr 1fr 1fr auto',
                                gap: '0.75rem',
                                alignItems: 'center'
                            }}>
                                <span className="section-title" style={{ margin: 0 }}>Task Title</span>
                                <span className="section-title" style={{ margin: 0 }}>Assign To</span>
                                <span className="section-title" style={{ margin: 0 }}>Deadline</span>
                                <span />
                            </div>

                            {/* Task rows */}
                            {tasksList.map((task, i) => (
                                <div key={i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1fr auto',
                                    gap: '0.75rem',
                                    alignItems: 'center',
                                    background: 'var(--surface-2)',
                                    borderRadius: 8,
                                    padding: '0.75rem',
                                    border: '1px solid var(--border)',
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
                                            <option key={m._id} value={m._id}>
                                                {m.name || m.email}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={task.deadline}
                                        onChange={e => handleRowChange(i, 'deadline', e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => removeRow(i)}
                                        disabled={tasksList.length === 1}
                                        style={{ padding: '0.35rem 0.6rem' }}
                                    >✕</button>
                                </div>
                            ))}
                        </div>

                        <div className="flex-row">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                                        Assigning…
                                    </>
                                ) : '✓ Assign Tasks'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={addRow}
                            >
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
                                    <th>Task</th>
                                    <th>Assigned To</th>
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTasks.length === 0 ? (
                                    <tr><td colSpan={5}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-title">No tasks assigned yet</div>
                                        </div>
                                    </td></tr>
                                ) : myTasks.map(t => {
                                    const sc = STATUS_COLORS[t.status] || STATUS_COLORS.pending;
                                    return (
                                        <tr key={t._id}>
                                            <td style={{ fontWeight: 500 }}>{t.title}</td>
                                            <td style={{ color: 'var(--text-muted)' }}>
                                                {t.assignedTo?.name || t.assignedTo?.email || '—'}
                                            </td>
                                            <td style={{
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: sc.bg,
                                                    color: sc.color
                                                }}>
                                                    {t.status || 'pending'}
                                                </span>
                                            </td>
                                            <td style={{ minWidth: 120 }}>
                                                <div className="progress-bar">
                                                    <div className="progress-fill" style={{
                                                        width: t.status === 'completed' ? '100%'
                                                             : t.status === 'submitted'  ? '75%'
                                                             : t.status === 'revision'   ? '40%'
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