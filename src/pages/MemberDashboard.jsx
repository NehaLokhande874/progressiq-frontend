import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
                 || 'https://progressiq-backend.onrender.com';

const STATUS_COLORS = {
    Completed:   { bg: 'rgba(16,185,129,0.12)', color: '#34d399', hex: '#10b981' },
    Pending:     { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', hex: '#f59e0b' },
    Active:      { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', hex: '#f59e0b' },
    Submitted:   { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', hex: '#6366f1' },
    Revision:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', hex: '#ef4444' },
};

const MemberDashboard = () => {
    const [tasks,        setTasks]        = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [progressNote, setProgressNote] = useState({});
    const [submitting,   setSubmitting]   = useState({});
    const [notification, setNotification] = useState('');
    const [autoScore,    setAutoScore]    = useState(0);
    const [totalMarks,   setTotalMarks]   = useState(100);
    const socketRef = useRef(null);

    const username    = localStorage.getItem('username')    || 'Member';
    const email       = localStorage.getItem('email')       || '';
    const teamName    = localStorage.getItem('teamName')    || '';
    const projectName = localStorage.getItem('projectName') || '';

    useEffect(() => {
        setAutoScore(parseFloat(localStorage.getItem('autoScore'))   || 0);
        setTotalMarks(parseFloat(localStorage.getItem('totalMarks')) || 100);
    }, []);

    useEffect(() => {
        socketRef.current = io(BACKEND_URL, { withCredentials: true });
        if (email)    socketRef.current.emit('join', email);
        if (teamName) socketRef.current.emit('join-team', teamName);

        socketRef.current.on('new-task-assigned', ({ memberEmail }) => {
            if (memberEmail === email) {
                setNotification('🔔 You have been assigned a new task!');
                setTimeout(() => setNotification(''), 5000);
                fetchTasks();
            }
        });

        socketRef.current.on('task-update', ({ memberEmail }) => {
            if (!memberEmail || memberEmail === email) {
                setNotification('🔔 A task was updated!');
                setTimeout(() => setNotification(''), 5000);
                fetchTasks();
            }
        });

        socketRef.current.on('new-guidance', ({ memberEmail }) => {
            if (memberEmail === email) {
                setNotification('💡 Your mentor added guidance!');
                setTimeout(() => setNotification(''), 5000);
                fetchTasks();
            }
        });

        socketRef.current.on('score-updated', ({ email: updatedEmail, autoScore, totalMarks }) => {
            if (updatedEmail === email) {
                setAutoScore(autoScore);
                setTotalMarks(totalMarks);
                localStorage.setItem('autoScore',  autoScore);
                localStorage.setItem('totalMarks', totalMarks);
                setNotification(`🏆 Your score updated: ${autoScore}/${totalMarks}`);
                setTimeout(() => setNotification(''), 6000);
            }
        });

        return () => socketRef.current?.disconnect();
    }, [email, teamName]);

    const fetchTasks = async () => {
        try {
            const { data } = await API.get(`/tasks/member/tasks?email=${email}`);
            setTasks(data);
        } catch { setError('Failed to load tasks.'); }
        finally  { setLoading(false); }
    };

    useEffect(() => { fetchTasks(); }, []);

    const updateStatus = async (taskId, status) => {
        try {
            await API.patch(`/tasks/member/tasks/${taskId}/status`, { status });
            fetchTasks();
        } catch { setError('Failed to update status.'); }
    };

    const submitProgress = async (taskId) => {
        if (!progressNote[taskId]?.trim()) return;
        setSubmitting(prev => ({ ...prev, [taskId]: true }));
        try {
            await API.patch(`/tasks/member/tasks/${taskId}/progress`, {
                progressNote: progressNote[taskId],
                status: 'Submitted',
            });
            setProgressNote(prev => ({ ...prev, [taskId]: '' }));
            fetchTasks();
        } catch { setError('Failed to submit progress.'); }
        finally  { setSubmitting(prev => ({ ...prev, [taskId]: false })); }
    };

    if (loading) return (
        <div className="loading-screen"><div className="spinner" /></div>
    );

    const pending   = tasks.filter(t => ['Pending','Active'].includes(t.status)).length;
    const submitted = tasks.filter(t => t.status === 'Submitted').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const revision  = tasks.filter(t => t.status === 'Revision').length;

    const pieData = [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'Pending',   value: pending,   color: '#f59e0b' },
        { name: 'Submitted', value: submitted,  color: '#6366f1' },
        { name: 'Revision',  value: revision,   color: '#ef4444' },
    ].filter(d => d.value > 0);

    const scorePct = totalMarks ? Math.round((autoScore / totalMarks) * 100) : 0;

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                <div className="page-header">
                    <div>
                        <h1 className="page-title">My Dashboard</h1>
                        <p className="page-subtitle">
                            Welcome, {username} · Track your tasks and submit progress
                        </p>
                        {(teamName || projectName) && (
                            <div className="flex-row" style={{ marginTop: '0.4rem', gap: '0.6rem' }}>
                                {teamName    && <span className="badge badge-blue">👥 {teamName}</span>}
                                {projectName && <span className="badge badge-purple">📁 {projectName}</span>}
                            </div>
                        )}
                    </div>
                </div>

                {notification && <div className="alert alert-info">{notification}</div>}
                {error        && <div className="alert alert-error"><span>⚠</span> {error}</div>}

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

                {/* Score + Donut chart */}
                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>

                    <div className="card">
                        <div className="card-header">
                            <div>
                                <div className="card-title">🏆 My Score</div>
                                <div className="card-subtitle">Auto-calculated · Cannot be edited</div>
                            </div>
                            <span className="badge badge-green">🔒 Auto</span>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{
                                fontSize: '3rem', fontWeight: 800,
                                color: 'var(--primary-light)', letterSpacing: '-0.04em'
                            }}>
                                {autoScore}
                                <span style={{ fontSize: '1.4rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                    /{totalMarks}
                                </span>
                            </div>
                            <div style={{ margin: '0.75rem auto', maxWidth: 200 }}>
                                <div className="progress-bar" style={{ height: 10 }}>
                                    <div className="progress-fill" style={{ width: `${scorePct}%` }} />
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                    {scorePct}% of total marks
                                </div>
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(99,102,241,0.06)', borderRadius: 8,
                            padding: '0.75rem', fontSize: '0.78rem',
                            color: 'var(--text-muted)', borderLeft: '3px solid var(--primary)'
                        }}>
                            <strong style={{ color: 'var(--primary-light)' }}>How is this calculated?</strong>
                            <br />
                            Task Completion (40%) + On-Time Delivery (30%) + Task Difficulty (20%) + Mentor Feedback (10%)
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">Task Distribution</div>
                        </div>
                        {pieData.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-title">No tasks yet</div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={85}
                                        paddingAngle={3} dataKey="value">
                                        {pieData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} stroke="transparent" />
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
                </div>

                {/* Tasks list */}
                {tasks.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">No tasks assigned yet</div>
                            <div className="empty-state-body">Your leader will assign tasks to you soon</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {tasks.map(task => {
                            const sc     = STATUS_COLORS[task.status] || STATUS_COLORS.Pending;
                            const isDone = task.status === 'Completed';
                            return (
                                <div className="card" key={task._id} style={{
                                    opacity: isDone ? 0.75 : 1,
                                    borderLeft: `3px solid ${sc.color}`,
                                }}>
                                    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
                                        <div>
                                            <h3 style={{
                                                fontSize: '1rem', fontWeight: 600,
                                                textDecoration: isDone ? 'line-through' : 'none',
                                                color: isDone ? 'var(--text-muted)' : 'var(--text)',
                                            }}>
                                                {task.title}
                                            </h3>
                                            <div className="flex-row" style={{ marginTop: '0.25rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {task.deadline && (
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        📅 Due: {new Date(task.deadline).toLocaleDateString()}
                                                    </p>
                                                )}
                                                {task.weightage && (
                                                    <span style={{
                                                        background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
                                                        padding: '1px 7px', borderRadius: 5,
                                                        fontSize: '0.72rem', fontWeight: 700
                                                    }}>⚖ {task.weightage}/10</span>
                                                )}
                                                {task.onTime === true  && <span style={{ fontSize: '0.72rem', color: '#10b981' }}>✅ On time</span>}
                                                {task.onTime === false && isDone && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>⚠ Late</span>}
                                            </div>
                                        </div>
                                        <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                                            {task.status || 'Pending'}
                                        </span>
                                    </div>

                                    {/* Mentor feedback */}
                                    {task.feedback && (
                                        <div style={{
                                            background: 'rgba(99,102,241,0.08)',
                                            borderLeft: '3px solid var(--primary)',
                                            borderRadius: 6, padding: '0.6rem 0.75rem',
                                            fontSize: '0.8rem', marginBottom: '0.75rem',
                                        }}>
                                            <strong style={{ color: 'var(--primary-light)' }}>
                                                Mentor feedback:
                                            </strong>{' '}
                                            <span style={{ color: 'var(--text-muted)' }}>{task.feedback}</span>
                                            {task.feedbackScore > 0 && (
                                                <span style={{ marginLeft: '0.5rem', color: '#fbbf24', fontWeight: 700 }}>
                                                    ⭐ {task.feedbackScore}/10
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Progress bar */}
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Progress</span>
                                            <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                                                {isDone                           ? '100%'
                                                 : task.status === 'Submitted'   ? '75%'
                                                 : task.status === 'Revision'    ? '40%'
                                                 : task.status === 'In Progress' ? '50%'
                                                 : '20%'}
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{
                                                width: isDone                           ? '100%'
                                                     : task.status === 'Submitted'     ? '75%'
                                                     : task.status === 'Revision'      ? '40%'
                                                     : task.status === 'In Progress'   ? '50%'
                                                     : '20%',
                                            }} />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!isDone && (
                                        <div style={{ marginTop: '0.75rem' }}>
                                            <textarea
                                                className="form-textarea"
                                                placeholder="Write your progress note before submitting…"
                                                value={progressNote[task._id] || ''}
                                                onChange={e => setProgressNote(prev => ({
                                                    ...prev, [task._id]: e.target.value
                                                }))}
                                                style={{ minHeight: 70, marginBottom: '0.6rem' }}
                                            />
                                            <div className="flex-row">
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => submitProgress(task._id)}
                                                    disabled={submitting[task._id] || !progressNote[task._id]?.trim()}
                                                >
                                                    {submitting[task._id] ? 'Submitting…' : '📤 Submit Progress'}
                                                </button>
                                                <button
                                                    className="btn btn-success btn-sm"
                                                    onClick={() => updateStatus(task._id, 'Completed')}
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