import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const LeaderDashboard = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, submitted: 0 });
    const [teamTasks, setTeamTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const leaderEmail = user.email || localStorage.getItem('email');
    const leaderName = user.username || (leaderEmail ? leaderEmail.split('@')[0] : "Leader");
    
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        if (!leaderEmail) { setLoading(false); return; }
        try {
            const res = await API.get(`/tasks/leader/${leaderEmail}`);
            const allTasks = Array.isArray(res.data) ? res.data : [];
            setTeamTasks(allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

            const total = allTasks.length;
            const completed = allTasks.filter(t => t.status === 'Completed' || t.status === 'Done').length;
            const submitted = allTasks.filter(t => t.status === 'Submitted').length;
            const pending = allTasks.filter(t => t.status === 'Active' || t.status === 'Pending').length;
            
            setStats({ total, completed, pending, submitted });
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [leaderEmail]);

    const handleEvaluation = async (taskId) => {
        try {
            await API.put(`/tasks/add-feedback/${taskId}`, { 
                feedback: "Verified and Approved by Leader.", 
                status: 'Completed' 
            });
            alert("Task marked as Completed! ✅");
            fetchDashboardData();
        } catch (err) { console.error("Error:", err); }
    };

    const handleRemoveMember = async (memberEmail) => {
        if (window.confirm(`Remove tasks for ${memberEmail}?`)) {
            try {
                await API.delete(`/tasks/remove-member/${encodeURIComponent(memberEmail)}`);
                fetchDashboardData();
            } catch (err) { alert("Error removing."); }
        }
    };

    // --- 📏 Alignment Optimized Styles ---
    const pageWrapper = { 
        backgroundColor: '#f1f5f9', 
        minHeight: '100vh', 
        width: '100vw',        // Fixed: Forces full screen width
        margin: '0', 
        padding: '30px', 
        boxSizing: 'border-box',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden'    // Prevents unwanted scrolling
    };

    const contentBox = {
        width: '100%',
        maxWidth: '1400px',    // Centers content on ultra-wide monitors
        margin: '0 auto'       // Perfectly centers the layout
    };

    const headerArea = { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        backgroundColor: '#fff',
        padding: '25px 40px',
        borderRadius: '24px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
    };

    const statsGrid = { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
    };

    const statCard = (color) => ({ 
        padding: '30px', 
        borderRadius: '24px', 
        backgroundColor: '#fff', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', 
        borderLeft: `8px solid ${color}`,
        textAlign: 'left'
    });

    const tableWrapper = { 
        backgroundColor: '#fff', 
        padding: '35px', 
        borderRadius: '28px', 
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
        width: '100%'
    };

    const statusBadge = (s) => {
        const colors = {
            'Completed': { bg: '#dcfce7', text: '#166534' },
            'Submitted': { bg: '#e0f2fe', text: '#0369a1' },
            'Active': { bg: '#fef3c7', text: '#92400e' }
        };
        const style = colors[s] || { bg: '#f1f5f9', text: '#475569' };
        return { padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', backgroundColor: style.bg, color: style.text };
    };

    return (
        <div style={pageWrapper}>
            <div style={contentBox}>
                {/* Header */}
                <div style={headerArea}>
                    <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '32px', fontWeight: '800' }}>Leader Console ⚡</h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>Welcome back, <b>{leaderName}</b></p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={() => navigate('/leader-tasks')} style={{ background: '#2563eb', color: 'white', padding: '14px 28px', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold' }}>+ New Assignment</button>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', padding: '12px 24px', borderRadius: '14px', cursor: 'pointer', fontWeight: '700' }}>Logout</button>
                    </div>
                </div>

                {/* Stats */}
                <div style={statsGrid}>
                    <div style={statCard('#3b82f6')}><p style={{ color: '#64748b', fontWeight: '600' }}>Total Tasks</p><h2 style={{ fontSize: '36px', margin: 0 }}>{stats.total}</h2></div>
                    <div style={statCard('#f59e0b')}><p style={{ color: '#64748b', fontWeight: '600' }}>Active Pending</p><h2 style={{ fontSize: '36px', margin: 0 }}>{stats.pending}</h2></div>
                    <div style={statCard('#0ea5e9')}><p style={{ color: '#64748b', fontWeight: '600' }}>Review Required</p><h2 style={{ fontSize: '36px', margin: 0 }}>{stats.submitted}</h2></div>
                    <div style={statCard('#10b981')}><p style={{ color: '#64748b', fontWeight: '600' }}>Success Rate</p><h2 style={{ fontSize: '36px', margin: 0 }}>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</h2></div>
                </div>

                {/* Table */}
                <div style={tableWrapper}>
                    <h3 style={{ marginBottom: '30px', color: '#0f172a', fontSize: '22px' }}>👥 Team Progress Matrix</h3>
                    {loading ? <p>🔄 Syncing...</p> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 12px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '13px' }}>
                                        <th style={{ padding: '0 20px' }}>MEMBER</th>
                                        <th style={{ padding: '0 20px' }}>TASK</th>
                                        <th style={{ padding: '0 20px' }}>STATUS</th>
                                        <th style={{ padding: '0 20px', textAlign: 'center' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamTasks.map((task) => (
                                        <tr key={task._id} style={{ backgroundColor: '#f8fafc' }}>
                                            <td style={{ padding: '20px', borderRadius: '16px 0 0 16px', fontWeight: 'bold' }}>{task.assignedTo}</td>
                                            <td style={{ padding: '20px' }}>{task.title}</td>
                                            <td style={{ padding: '20px' }}><span style={statusBadge(task.status)}>{task.status}</span></td>
                                            <td style={{ padding: '20px', textAlign: 'center', borderRadius: '0 16px 16px 0' }}>
                                                <button onClick={() => navigate(`/member-details/${task.assignedTo}`)} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '10px', marginRight: '10px', cursor: 'pointer' }}>Review</button>
                                                {task.status === 'Submitted' && (
                                                    <button onClick={() => handleEvaluation(task._id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', marginRight: '10px', cursor: 'pointer' }}>Approve</button>
                                                )}
                                                <button onClick={() => handleRemoveMember(task.assignedTo)} style={{ background: 'none', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '18px' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderDashboard;