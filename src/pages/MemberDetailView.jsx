import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import API from '../api/axios';
import Sidebar from '../components/Sidebar';

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_COLORS = {
    completed: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', hex: '#10b981' },
    pending:   { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', hex: '#f59e0b' },
    submitted: { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', hex: '#6366f1' },
    revision:  { bg: 'rgba(239,68,68,0.12)',  color: '#f87171', hex: '#ef4444' },
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
                const { data } = await API.get(
                    `/users/member-details/${encodeURIComponent(email)}`
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
    const statusCounts = tasks.reduce((acc, t) => {
        acc[t.status || 'pending'] = (acc[t.status || 'pending'] || 0) + 1;
        return acc;
    }, {});

    const completed = statusCounts.completed || 0;
    const pending   = statusCounts.pending   || 0;
    const submitted = statusCounts.submitted || 0;
    const revision  = statusCounts.revision  || 0;
    const total     = tasks.length;
    const rate      = total ? Math.round((completed / total) * 100) : 0;

    const chartData = {
        labels: ['Completed', 'Pending', 'Submitted', 'Revision'],
        datasets: [{
            data: [completed, pending, submitted, revision],
            backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#ef4444'],
            borderWidth: 0,
        }],
    };

    const chartOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#64748b',
                    font: { family: 'Plus Jakarta Sans', size: 12 },
                    padding: 16,
                },
            },
        },
        cutout: '60%',
    };

    return (
        <div className="page-shell">
            <Sidebar active="Dashboard" />
            <main className="main-content">

                {/* Back button */}
                <div className="page-header">
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(-1)}
                    >
                        ← Back
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error"><span>⚠</span> {error}</div>
                )}

                {/* Profile header */}
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="flex-row">
                        <div className="avatar avatar-lg">
                            {(member?.name || email).slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                                {member?.name || '—'}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {email}
                            </p>
                            <div className="flex-row" style={{ marginTop: '0.5rem' }}>
                                <span className="badge badge-cyan">member</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {total} task(s) · {rate}% completion
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid-2" style={{ marginBottom: '1.5rem' }}>

                    {/* Stats + completion bar */}
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
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: 'var(--primary-light)',
                                    minWidth: '3rem',
                                    textAlign: 'right',
                                }}>
                                    {rate}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pie chart */}
                    <div className="card">
                        <div className="card-title" style={{ marginBottom: '1rem' }}>
                            Task Distribution
                        </div>
                        {total > 0 ? (
                            <Pie data={chartData} options={chartOptions} />
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📊</div>
                                <div className="empty-state-title">No task data yet</div>
                            </div>
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
                                    <th>Deadline</th>
                                    <th>Status</th>
                                    <th>Progress Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length === 0 ? (
                                    <tr><td colSpan={4}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-title">No tasks yet</div>
                                        </div>
                                    </td></tr>
                                ) : tasks.map(t => {
                                    const sc = STATUS_COLORS[t.status] || STATUS_COLORS.pending;
                                    return (
                                        <tr key={t._id}>
                                            <td style={{ fontWeight: 500 }}>{t.title}</td>
                                            <td style={{
                                                fontFamily: 'JetBrains Mono, monospace',
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {t.deadline
                                                    ? new Date(t.deadline).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td>
                                                <span className="badge" style={{
                                                    background: sc.bg,
                                                    color: sc.color
                                                }}>
                                                    {t.status || 'pending'}
                                                </span>
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