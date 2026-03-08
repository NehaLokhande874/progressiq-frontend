import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

// ✅ Vite uses import.meta.env (NOT process.env)
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
                 || 'https://progressiq-backend.onrender.com';

const STATUS_COLORS = {
    completed: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    pending:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    submitted: { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
    revision:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
};

const MemberDashboard = () => {
    const [tasks,        setTasks]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [progressNote, setProgressNote] = useState({});
    const [submitting,   setSubmitting]   = useState({});
    const [notification, setNotification] = useState('');
    const socketRef = useRef(null);
    const username  = localStorage.getItem('username') || 'Member';

    // ── Socket.io ──
    useEffect(() => {
        socketRef.current = io(BACKEND_URL, { withCredentials: true });

        socketRef.current.on('task-update', (data) => {
            setNotification(`🔔 Task updated: ${data.title || 'A task was updated'}`);
            fetchTasks();
            setTimeout(() => setNotification(''), 5000);
        });

        return () => socketRef.current?.disconnect();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data } = await API.get('/member/tasks');
            setTasks(data);
        } catch {
            setError('Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const updateStatus = async (taskId, status) => {
        try {
            await API.patch(`/member/tasks/${taskId}/status`, { status });
            fetchTasks();
        } catch {
            setError('Failed to update status.');
        }
    };

    const submitProgress = async (taskId) => {
        if (!progressNote[taskId]?.trim()) return;
        setSubmitting(prev => ({ ...prev, [taskId]: true }));
        try {
            await API.patch(`/member/tasks/${taskId}/progress`, {
                progressNote: progressNote[taskId],
                status: 'submitted',
            });
            setProgressNote(prev => ({ ...prev, [taskId]: '' }));
            fetchTasks();
        } catch {
            setError('Failed to submit progress.');
        } finally {
            setSubmitting(prev => ({ ...prev, [taskId]: false }));
        }
    };

    if (loading) return (
        <div className="loading-screen"><div className="spinner" /></div>
    );

    const pending   = tasks.filter(t => t.status === 'pending').length;
    const submitted = tasks.filter(t => t.status === 'submitted').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const revision  = tasks.filter(t => t.status === 'revision').length;

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">My Dashboard</h1>
                        <p className="page-subtitle">
                            Welcome, {username} · Track your tasks and submit progress
                        </p>
                    </div>
                </div>

                {notification && (
                    <div className="alert alert-info">{notification}</div>
                )}
                {error && (
                    <div className="alert alert-error"><span>⚠</span> {error}</div>
                )}

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                    {[
                        { icon: '📋', label: 'Total Tasks',    value: tasks.length, color: 'blue'   },
                        { icon: '⏳', label: 'Pending',        value: pending,      color: 'yellow' },
                        { icon: '📤', label: 'Submitted',      value: submitted,    color: 'purple' },
                        { icon: '✅', label: 'Completed',      value: completed,    color: 'green'  },
                        { icon: '🔄', label: 'Needs Revision', value: revision,     color: 'red'    },
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

                {/* Tasks */}
                {tasks.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">No tasks assigned yet</div>
                            <div className="empty-state-body">
                                Your leader will assign tasks to you soon
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tasks.map(task => {
                            const sc    = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                            const isDone = task.status === 'completed';
                            return (
                                <div className="card" key={task._id} style={{
                                    opacity: isDone ? 0.75 : 1,
                                    borderLeft: `3px solid ${sc.color}`,
                                }}>
                                    {/* Title + status */}
                                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                        <div>
                                            <h3 style={{
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                textDecoration: isDone ? 'line-through' : 'none',
                                                color: isDone ? 'var(--text-muted)' : 'var(--text)',
                                            }}>
                                                {task.title}
                                            </h3>
                                            {task.deadline && (
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-muted)',
                                                    marginTop: '0.25rem'
                                                }}>
                                                    📅 Due: {new Date(task.deadline).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <span className="badge" style={{
                                            background: sc.bg,
                                            color: sc.color
                                        }}>
                                            {task.status || 'pending'}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {task.description && (
                                        <p style={{
                                            fontSize: '0.82rem',
                                            color: 'var(--text-muted)',
                                            marginBottom: '0.75rem'
                                        }}>
                                            {task.description}
                                        </p>
                                    )}

                                    {/* Mentor feedback */}
                                    {task.feedback && (
                                        <div style={{
                                            background: 'rgba(99,102,241,0.08)',
                                            borderLeft: '3px solid var(--primary)',
                                            borderRadius: 6,
                                            padding: '0.6rem 0.75rem',
                                            fontSize: '0.8rem',
                                            marginBottom: '0.75rem',
                                        }}>
                                            <strong style={{ color: 'var(--primary-light)' }}>
                                                Mentor feedback:
                                            </strong>{' '}
                                            <span style={{ color: 'var(--text-muted)' }}>
                                                {task.feedback}
                                            </span>
                                        </div>
                                    )}

                                    {/* Progress bar */}
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                Progress
                                            </span>
                                            <span style={{
                                                fontSize: '0.72rem',
                                                fontFamily: 'JetBrains Mono, monospace',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {isDone                          ? '100%'
                                                 : task.status === 'submitted'  ? '75%'
                                                 : task.status === 'revision'   ? '40%'
                                                 : '20%'}
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{
                                                width: isDone                          ? '100%'
                                                     : task.status === 'submitted'    ? '75%'
                                                     : task.status === 'revision'     ? '40%'
                                                     : '20%',
                                            }} />
                                        </div>
                                    </div>

                                    {/* Actions — hidden when completed */}
                                    {!isDone && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <textarea
                                                className="form-textarea"
                                                placeholder="Write your progress note before submitting…"
                                                value={progressNote[task._id] || ''}
                                                onChange={e => setProgressNote(prev => ({
                                                    ...prev,
                                                    [task._id]: e.target.value
                                                }))}
                                                style={{ minHeight: 70, marginBottom: '0.6rem' }}
                                            />
                                            <div className="flex-row">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => submitProgress(task._id)}
                                                    disabled={
                                                        submitting[task._id] ||
                                                        !progressNote[task._id]?.trim()
                                                    }
                                                >
                                                    {submitting[task._id]
                                                        ? 'Submitting…'
                                                        : '📤 Submit Progress'}
                                                </button>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => updateStatus(task._id, 'completed')}
                                                >
                                                    ✓ Mark Complete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

            </main>
        </div>
    );
};

export default MemberDashboard;