import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid,
         Tooltip, ResponsiveContainer } from 'recharts';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '')
                 || 'https://progressiq-backend.onrender.com';

const STATUS_COLORS = {
    Completed:   { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
    Pending:     { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    Active:      { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
    Submitted:   { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
    Revision:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171' },
};

const MentorDashboard = () => {
    const [groupedTasks, setGroupedTasks] = useState({});
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState('');
    const [feedback,     setFeedback]     = useState({});
    const [fbScore,      setFbScore]      = useState({});
    const [sending,      setSending]      = useState({});
    const [notification, setNotification] = useState('');
    const navigate  = useNavigate();
    const socketRef = useRef(null);

    const username    = localStorage.getItem('username')    || 'Mentor';
    const email       = localStorage.getItem('email')       || '';
    const teamName    = localStorage.getItem('teamName')    || '';
    const projectName = localStorage.getItem('projectName') || '';

    useEffect(() => {
        socketRef.current = io(BACKEND_URL, { withCredentials: true });
        if (email)    socketRef.current.emit('join', email);
        if (teamName) socketRef.current.emit('join-team', teamName);

        socketRef.current.on('work-submitted', ({ memberEmail }) => {
            setNotification(`📤 ${memberEmail} submitted work for review!`);
            setTimeout(() => setNotification(''), 5000);
            fetchTasks();
        });
        socketRef.current.on('score-updated', () => fetchTasks());
        socketRef.current.on('team-updated',  () => fetchTasks());

        return () => socketRef.current?.disconnect();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data } = await API.get('/tasks/mentor/tasks');
            const grouped  = data.reduce((acc, task) => {
                const key = task.assignedTo || 'Unknown';
                if (!acc[key]) acc[key] = { email: key, tasks: [] };
                acc[key].tasks.push(task);
                return acc;
            }, {});
            setGroupedTasks(grouped);
        } catch { setError('Failed to load tasks.'); }
        finally  { setLoading(false); }
    };

    useEffect(() => { fetchTasks(); }, []);

    const submitFeedback = async (taskId) => {
        if (!feedback[taskId]?.trim()) return;
        setSending(prev => ({ ...prev, [taskId]: true }));
        try {
            await API.post(`/tasks/mentor/feedback/${taskId}`, {
                feedback:      feedback[taskId],
                feedbackScore: fbScore[taskId] || 5,
            });
            setFeedback(prev => ({ ...prev, [taskId]: '' }));
            setFbScore(prev  => ({ ...prev, [taskId]: 5 }));
            setNotification('✅ Feedback submitted & score updated!');
            setTimeout(() => setNotification(''), 4000);
            fetchTasks();
        } catch { setError('Failed to send feedback.'); }
        finally  { setSending(prev => ({ ...prev, [taskId]: false })); }
    };

    if (loading) return (
        <div className="loading-screen"><div className="spinner" /></div>
    );

    const totalMembers = Object.keys(groupedTasks).length;
    const allTasks     = Object.values(groupedTasks).flatMap(g => g.tasks);
    const submitted    = allTasks.filter(t => t.status === 'Submitted').length;
    const completed    = allTasks.filter(t => t.status === 'Completed').length;

    const chartData = Object.entries(groupedTasks).map(([email, { tasks }]) => {
        const scoredTasks = tasks.filter(t => t.feedbackScore > 0);
        return {
            name:  email.split('@')[0],
            score: scoredTasks.length
                ? Math.round(scoredTasks.reduce((s, t) => s + t.feedbackScore, 0) / scoredTasks.length * 10) / 10
                : 0,
        };
    });

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                <div className="page-header">
                    <div>
                        <h1 className="page-title">Mentor Dashboard</h1>
                        <p className="page-subtitle">
                            Welcome back, {username} · Review member work and give feedback
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

                {/* Feedback scores chart */}
                {chartData.some(d => d.score > 0) && (
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <div className="card-title">Avg Feedback Scores by Member</div>
                            <span className="badge badge-green">out of 10</span>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis domain={[0, 10]} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip contentStyle={{
                                    background: 'var(--surface-2)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8, fontSize: 12
                                }} />
                                <Bar dataKey="score" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

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
                ) : Object.entries(groupedTasks).map(([memberEmail, { tasks }]) => (
                    <div className="card" key={memberEmail} style={{ marginBottom: '1.2rem' }}>

                        <div className="card-header">
                            <div className="flex-row">
                                <div className="avatar">
                                    {memberEmail.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="card-title">{memberEmail}</div>
                                    <div className="card-subtitle">{tasks.length} task(s)</div>
                                </div>
                            </div>
                            <button className="btn btn-secondary btn-sm"
                                onClick={() => navigate(`/member-details/${memberEmail}`)}>
                                View Profile →
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {tasks.map(task => {
                                const sc = STATUS_COLORS[task.status] || STATUS_COLORS.Pending;
                                return (
                                    <div key={task._id} style={{
                                        background: 'var(--surface-2)', borderRadius: 10,
                                        padding: '1rem 1.2rem', border: '1px solid var(--border)',
                                    }}>
                                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                    {task.title}
                                                </span>
                                                <span style={{
                                                    marginLeft: '0.6rem',
                                                    background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
                                                    padding: '1px 7px', borderRadius: 5,
                                                    fontSize: '0.75rem', fontWeight: 700
                                                }}>⚖ {task.weightage || 5}/10</span>
                                            </div>
                                            <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                                                {task.status || 'Pending'}
                                            </span>
                                        </div>

                                        {task.deadline && (
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                                📅 Due: {new Date(task.deadline).toLocaleDateString()}
                                                {task.onTime === true  && <span style={{ color: '#10b981', marginLeft: '0.5rem' }}>✅ On time</span>}
                                                {task.onTime === false && task.status === 'Submitted' && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>⚠ Late</span>}
                                            </p>
                                        )}

                                        {task.progressNote && (
                                            <div style={{
                                                background: 'var(--surface-3)', borderRadius: 6,
                                                padding: '0.5rem 0.75rem', fontSize: '0.8rem',
                                                color: 'var(--text-muted)', marginBottom: '0.75rem',
                                                borderLeft: '3px solid var(--primary)',
                                            }}>
                                                <strong style={{ color: 'var(--text)' }}>Progress note:</strong>{' '}
                                                {task.progressNote}
                                            </div>
                                        )}

                                        {/* Existing feedback */}
                                        {task.feedback && (
                                            <div style={{
                                                background: 'rgba(16,185,129,0.08)', borderRadius: 6,
                                                padding: '0.5rem 0.75rem', fontSize: '0.8rem',
                                                color: '#34d399', marginBottom: '0.5rem',
                                                borderLeft: '3px solid #10b981',
                                            }}>
                                                <strong>Your feedback:</strong> {task.feedback}
                                                {task.feedbackScore > 0 && (
                                                    <span style={{ marginLeft: '0.5rem', color: '#fbbf24' }}>
                                                        ⭐ {task.feedbackScore}/10
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Feedback form — only for submitted */}
                                        {task.status === 'Submitted' && (
                                            <div style={{ marginTop: '0.75rem' }}>
                                                <textarea
                                                    className="form-textarea"
                                                    placeholder="Write feedback for this task…"
                                                    value={feedback[task._id] || ''}
                                                    onChange={e => setFeedback(p => ({ ...p, [task._id]: e.target.value }))}
                                                    style={{ minHeight: 70, marginBottom: '0.5rem' }}
                                                />
                                                {/* Feedback score slider */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center',
                                                    gap: '0.75rem', marginBottom: '0.6rem'
                                                }}>
                                                    <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        Score (1-10):
                                                    </label>
                                                    <input
                                                        type="range" min="1" max="10" step="1"
                                                        value={fbScore[task._id] || 5}
                                                        onChange={e => setFbScore(p => ({ ...p, [task._id]: +e.target.value }))}
                                                        style={{ flex: 1, accentColor: 'var(--primary)' }}
                                                    />
                                                    <span style={{
                                                        minWidth: 28, textAlign: 'center',
                                                        fontWeight: 700, color: '#fbbf24', fontSize: '1rem'
                                                    }}>
                                                        {fbScore[task._id] || 5}
                                                    </span>
                                                </div>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => submitFeedback(task._id)}
                                                    disabled={sending[task._id] || !feedback[task._id]?.trim()}
                                                >
                                                    {sending[task._id] ? 'Sending…' : '✓ Send Feedback & Mark Complete'}
                                                </button>
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