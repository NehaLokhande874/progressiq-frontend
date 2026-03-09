import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';

const STATUS_COLORS = {
    Completed:   { bg: 'rgba(16,185,129,0.12)', color: '#34d399', hex: '#10b981' },
    Pending:     { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', hex: '#f59e0b' },
    Active:      { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', hex: '#f59e0b' },
    Submitted:   { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', hex: '#6366f1' },
    Revision:    { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', hex: '#ef4444' },
};

const MemberDetailView = () => {
    const { email }  = useParams();
    const navigate   = useNavigate();
    const [member,  setMember]  = useState(null);
    const [tasks,   setTasks]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // ✅ Fixed API path
                const { data } = await API.get(
                    `/auth/users/member-details/${encodeURIComponent(email)}`
                );
                setMember(data.member);
                setTasks(data.tasks || []);
            } catch {
                setError('Failed to load member details.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [email]);

    if (loading) return (
        <div className="loading-screen"><div className="spinner" /></div>
    );

    // ── Computed stats ──
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending   = tasks.filter(t => ['Pending','Active'].includes(t.status)).length;
    const submitted = tasks.filter(t => t.status === 'Submitted').length;
    const revision  = tasks.filter(t => t.status === 'Revision').length;
    const total     = tasks.length;
    const rate      = total ? Math.round((completed / total) * 100) : 0;

    // ✅ Auto score
    const autoScore  = member?.autoScore  || 0;
    const totalMarks = member?.totalMarks || 100;
    const scorePct   = totalMarks ? Math.round((autoScore / totalMarks) * 100) : 0;

    const pieData = [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'Pending',   value: pending,   color: '#f59e0b' },
        { name: 'Submitted', value: submitted,  color: '#6366f1' },
        { name: 'Revision',  value: revision,   color: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                {/* Back button */}
                <div className="page-header">
                    <div>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(-1)}
                        >
                            ← Back
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error"><span>⚠</span> {error}</div>
                )}

                {/* Profile header */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="flex-row">
                        <div className="avatar avatar-lg">
                            {(member?.username || email).slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                {member?.username || '—'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {email}
                            </p>
                            <div className="flex-row" style={{ marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span className="badge badge-cyan">member</span>
                                {member?.teamName && (
                                    <span className="badge badge-blue">👥 {member.teamName}</span>
                                )}
                                {member?.projectName && (
                                    <span className="badge badge-purple">📁 {member.projectName}</span>
                                )}
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {total} task(s) · {rate}% completion
                                </span>
                            </div>
                        </div>

                        {/* ✅ Auto score badge */}
                        <div style={{
                            textAlign: 'center',
                            background: 'rgba(99,102,241,0.08)',
                            borderRadius: 12, padding: '1rem 1.5rem',
                            border: '1px solid rgba(99,102,241,0.2)',
                        }}>
                            <div style={{
                                fontSize: '2rem', fontWeight: 800,
                                color: 'var(--primary-light)',
                                letterSpacing: '-0.04em',
                            }}>
                                {autoScore}
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                    /{totalMarks}
                                </span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                🏆 Auto Score
                            </div>
                            <div style={{ width: 80, margin: '0.4rem auto 0' }}>
                                <div className="progress-bar" style={{ height: 4 }}>
                                    <div className="progress-fill" style={{ width: `${scorePct}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                            {[
                                { icon: '📋', label: 'Total',     value: total,     color: 'blue'   },
                                { icon: '✅', label: 'Completed', value: completed, color: 'green'  },
                                { icon: '⏳', label: 'Pending',   value: pending,   color: 'yellow' },
                                { icon: '📤', label: 'Submitted', value: submitted, color: 'purple' },
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

                        {/* Completion rate bar */}
                        <div className="card">
                            <div className="card-title" style={{ marginBottom: '0.75rem' }}>
                                Completion Rate
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div className="progress-bar" style={{ height: 10 }}>
                                        <div className="progress-fill" style={{ width: `${rate}%` }} />
                                    </div>
                                </div>
                                <span style={{
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontWeight: 700, fontSize: '1.1rem',
                                    color: 'var(--primary-light)',
                                    minWidth: '3rem', textAlign: 'right',
                                }}>
                                    {rate}%
                                </span>
                            </div>
                        </div>

                        {/* Score formula */}
                        <div style={{
                            background: 'rgba(99,102,241,0.06)',
                            borderRadius: 10, padding: '0.85rem',
                            fontSize: '0.78rem', color: 'var(--text-muted)',
                            borderLeft: '3px solid var(--primary)',
                        }}>
                            <strong style={{ color: 'var(--primary-light)' }}>
                                Score Formula:
                            </strong>
                            <br />
                            Completion (40%) + On-Time (30%) +
                            Difficulty (20%) + Feedback (10%)
                        </div>
                    </div>

                    {/* ✅ Pie chart using recharts */}
                    <div className="card">
                        <div className="card-title" style={{ marginBottom: '1rem' }}>
                            Task Distribution
                        </div>
                        {pieData.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-title">No task data yet</div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={pieData} cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={85}
                                        paddingAngle={3} dataKey="value"
                                    >
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
                                        formatter={v => (
                                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                                                {v}
                                            </span>
                                        )} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Tasks table */}
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">All Tasks</div>
                        <span className="badge badge-blue">{total}</span>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Weightage</th>
                                    <th>Deadline</th>
                                    <th>On Time</th>
                                    <th>Status</th>
                                    <th>Feedback Score</th>
                                    <th>Progress Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length === 0 ? (
                                    <tr><td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-title">No tasks yet</div>
                                        </div>
                                    </td></tr>
                                ) : tasks.map(t => {
                                    const sc = STATUS_COLORS[t.status] || STATUS_COLORS.Pending;
                                    return (
                                        <tr key={t._id}>
                                            <td style={{ fontWeight: 500 }}>{t.title}</td>
                                            <td>
                                                <span style={{
                                                    background: 'rgba(99,102,241,0.12)',
                                                    color: '#a5b4fc',
                                                    padding: '2px 8px', borderRadius: 6,
                                                    fontSize: '0.78rem', fontWeight: 700
                                                }}>
                                                    {t.weightage || 5}/10
                                                </span>
                                            </td>
                                            <td style={{
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: '0.8rem', color: 'var(--text-muted)'
                                            }}>
                                                {t.deadline
                                                    ? new Date(t.deadline).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td>
                                                {t.status === 'Completed' || t.status === 'Submitted'
                                                    ? t.onTime
                                                        ? <span style={{ color: '#10b981' }}>✅ Yes</span>
                                                        : <span style={{ color: '#ef4444' }}>⚠ Late</span>
                                                    : <span style={{ color: 'var(--text-faint)' }}>—</span>
                                                }
                                            </td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: sc.bg, color: sc.color
                                                }}>
                                                    {t.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                {t.feedbackScore > 0 ? (
                                                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                                                        ⭐ {t.feedbackScore}/10
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-faint)' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{
                                                fontSize: '0.82rem',
                                                color: 'var(--text-muted)',
                                                maxWidth: 200
                                            }}>
                                                {t.progressNote || (
                                                    <span style={{ opacity: 0.4 }}>—</span>
                                                )}
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

export default MemberDetailView;