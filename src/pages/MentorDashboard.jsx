import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';

const STATUS_COLORS = {
    completed: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    pending:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    submitted: { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
    revision:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
};

const MentorDashboard = () => {
    const [groupedTasks, setGroupedTasks] = useState({});
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [feedback,     setFeedback]     = useState({});
    const [sending,      setSending]      = useState({});
    const navigate = useNavigate();
    const username = localStorage.getItem('username') || 'Mentor';

    const fetchTasks = async () => {
        try {
            const { data } = await API.get('/mentor/tasks');
            const grouped = data.reduce((acc, task) => {
                const key = task.assignedTo?.email || 'Unknown';
                if (!acc[key]) acc[key] = { member: task.assignedTo, tasks: [] };
                acc[key].tasks.push(task);
                return acc;
            }, {});
            setGroupedTasks(grouped);
        } catch {
            setError('Failed to load tasks.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    const handleFeedbackChange = (taskId, value) =>
        setFeedback(prev => ({ ...prev, [taskId]: value }));

    const submitFeedback = async (taskId) => {
        if (!feedback[taskId]?.trim()) return;
        setSending(prev => ({ ...prev, [taskId]: true }));
        try {
            await API.post(`/mentor/feedback/${taskId}`, { feedback: feedback[taskId] });
            setFeedback(prev => ({ ...prev, [taskId]: '' }));
            await fetchTasks();
        } catch {
            setError('Failed to send feedback.');
        } finally {
            setSending(prev => ({ ...prev, [taskId]: false }));
        }
    };

    if (loading) return (
        <div className="loading-screen"><div className="spinner" /></div>
    );

    const totalMembers = Object.keys(groupedTasks).length;
    const allTasks     = Object.values(groupedTasks).flatMap(g => g.tasks);
    const submitted    = allTasks.filter(t => t.status === 'submitted').length;
    const completed    = allTasks.filter(t => t.status === 'completed').length;

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Mentor Dashboard</h1>
                        <p className="page-subtitle">
                            Welcome back, {username} · Review member work and give feedback
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error"><span>⚠</span> {error}</div>
                )}

                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                    {[
                        { icon: '👥', label: 'Members',         value: totalMembers,    color: 'purple' },
                        { icon: '📋', label: 'Total Tasks',     value: allTasks.length, color: 'blue'   },
                        { icon: '📤', label: 'Awaiting Review', value: submitted,       color: 'yellow' },
                        { icon: '✅', label: 'Completed',       value: completed,       color: 'green'  },
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

                {/* Grouped by member */}
                {Object.keys(groupedTasks).length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">No tasks to review</div>
                            <div className="empty-state-body">
                                Tasks assigned to your mentees will appear here
                            </div>
                        </div>
                    </div>
                ) : Object.entries(groupedTasks).map(([email, { member, tasks }]) => (
                    <div className="card" key={email} style={{ marginBottom: '1.2rem' }}>

                        {/* Member header */}
                        <div className="card-header">
                            <div className="flex-row">
                                <div className="avatar">
                                    {(member?.name || email).slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="card-title">{member?.name || email}</div>
                                    <div className="card-subtitle">{email} · {tasks.length} task(s)</div>
                                </div>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => navigate(`/member-details/${email}`)}
                            >
                                View Profile →
                            </button>
                        </div>

                        {/* Tasks */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {tasks.map(task => {
                                const sc = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                                return (
                                    <div key={task._id} style={{
                                        background: 'var(--surface-2)',
                                        borderRadius: 10,
                                        padding: '1rem 1.2rem',
                                        border: '1px solid var(--border)',
                                    }}>
                                        {/* Task title + status */}
                                        <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                {task.title}
                                            </span>
                                            <span className="badge" style={{
                                                background: sc.bg,
                                                color: sc.color
                                            }}>
                                                {task.status || 'pending'}
                                            </span>
                                        </div>

                                        {/* Deadline */}
                                        {task.deadline && (
                                            <p style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--text-muted)',
                                                marginBottom: '0.5rem'
                                            }}>
                                                📅 Due: {new Date(task.deadline).toLocaleDateString()}
                                            </p>
                                        )}

                                        {/* Progress note from member */}
                                        {task.progressNote && (
                                            <div style={{
                                                background: 'var(--surface-3)',
                                                borderRadius: 6,
                                                padding: '0.5rem 0.75rem',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)',
                                                marginBottom: '0.75rem',
                                                borderLeft: '3px solid var(--primary)',
                                            }}>
                                                <strong style={{ color: 'var(--text)' }}>
                                                    Progress note:
                                                </strong>{' '}
                                                {task.progressNote}
                                            </div>
                                        )}

                                        {/* Feedback input — only for submitted tasks */}
                                        {task.status === 'submitted' && (
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <textarea
                                                    className="form-textarea"
                                                    placeholder="Write feedback for this task…"
                                                    value={feedback[task._id] || ''}
                                                    onChange={e => handleFeedbackChange(task._id, e.target.value)}
                                                    style={{ minHeight: 70, marginBottom: '0.5rem' }}
                                                />
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => submitFeedback(task._id)}
                                                    disabled={
                                                        sending[task._id] ||
                                                        !feedback[task._id]?.trim()
                                                    }
                                                >
                                                    {sending[task._id] ? 'Sending…' : 'Send Feedback'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Existing feedback */}
                                        {task.feedback && (
                                            <div style={{
                                                background: 'rgba(16,185,129,0.08)',
                                                borderRadius: 6,
                                                padding: '0.5rem 0.75rem',
                                                fontSize: '0.8rem',
                                                color: '#34d399',
                                                marginTop: '0.5rem',
                                                borderLeft: '3px solid #10b981',
                                            }}>
                                                <strong>Your feedback:</strong>{' '}
                                                {task.feedback}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

            </main>
        </div>
    );
};

export default MentorDashboard;