import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const LeaderDashboard = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, submitted: 0 });
    const [teamTasks, setTeamTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ✅ Strong User Parsing & Sync
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const leaderEmail = user.email || localStorage.getItem('email');
    const leaderName = user.username || (leaderEmail ? leaderEmail.split('@')[0] : "Leader");
    
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        if (!leaderEmail) {
            setLoading(false);
            return;
        }
        try {
            const res = await API.get(`/tasks/leader/${leaderEmail}`);
            const allTasks = Array.isArray(res.data) ? res.data : [];
            
            // Real-time Sorting: Latest Tasks on Top
            setTeamTasks(allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

            // 📊 Real-time Stats Calculation
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
        // Optional: Real-time polling (every 30 seconds)
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [leaderEmail]);

    const handleEvaluation = async (taskId) => {
        try {
            await API.put(`/tasks/add-feedback/${taskId}`, { 
                feedback: "Verified and Approved by Leader.", 
                status: 'Completed' 
            });
            alert("Task marked as Completed! ✅");
            fetchDashboardData(); // Trigger Real-time UI Sync
        } catch (err) {
            console.error("Evaluation error:", err);
            alert("❌ Action failed.");
        }
    };

    const handleLogout = () => { 
        localStorage.clear(); 
        navigate('/'); 
    };

    // --- 💎 Premium UI Styles ---
    const pageWrapper = { 
        backgroundColor: '#f1f5f9', 
        minHeight: '100vh', 
        width: '100%', 
        padding: '30px', 
        boxSizing: 'border-box',
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif'
    };

    const headerArea = { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '35px',
        backgroundColor: '#fff',
        padding: '20px 30px',
        borderRadius: '20px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    };

    const statsGrid = { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: '20px', 
        marginBottom: '35px' 
    };

    const statCard = (color) => ({ 
        padding: '25px', 
        borderRadius: '20px', 
        backgroundColor: '#fff', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', 
        borderTop: `6px solid ${color}`,
        textAlign: 'left'
    });

    const tableWrapper = { 
        backgroundColor: '#fff', 
        padding: '30px', 
        borderRadius: '24px', 
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
        width: '100%',
        boxSizing: 'border-box'
    };

    const btnCreate = { 
        backgroundColor: '#2563eb', 
        color: 'white', 
        border: 'none', 
        padding: '12px 25px', 
        borderRadius: '12px', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '15px',
        transition: '0.3s'
    };

    const statusBadge = (s) => {
        const colors = {
            'Completed': { bg: '#dcfce7', text: '#166534' },
            'Submitted': { bg: '#e0f2fe', text: '#0369a1' },
            'Active': { bg: '#fef3c7', text: '#92400e' }
        };
        const style = colors[s] || { bg: '#f1f5f9', text: '#475569' };
        return { padding: '6px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', backgroundColor: style.bg, color: style.text, textTransform: 'uppercase' };
    };

    return (
        <div style={pageWrapper}>
            {/* 🔝 Professional Header */}
            <div style={headerArea}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: '800' }}>Leader Console ⚡</h1>
                    <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '14px' }}>Welcome, <b style={{color: '#2563eb'}}>{leaderName}</b></p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => navigate('/leader-tasks')} style={btnCreate}>+ New Assignment</button>
                    <button onClick={handleLogout} style={{ backgroundColor: '#fff', color: '#ef4444', padding: '12px 20px', border: '1px solid #fee2e2', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>Logout</button>
                </div>
            </div>

            {/* 📊 Full-Width Stats Grid */}
            <div style={statsGrid}>
                <div style={statCard('#3b82f6')}>
                    <p style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Total Tasks</p>
                    <h2 style={{ fontSize: '32px', margin: 0, color: '#1e293b' }}>{stats.total}</h2>
                </div>
                <div style={statCard('#f59e0b')}>
                    <p style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Active Pending</p>
                    <h2 style={{ fontSize: '32px', margin: 0, color: '#1e293b' }}>{stats.pending}</h2>
                </div>
                <div style={statCard('#0ea5e9')}>
                    <p style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Review Required</p>
                    <h2 style={{ fontSize: '32px', margin: 0, color: '#1e293b' }}>{stats.submitted}</h2>
                </div>
                <div style={statCard('#10b981')}>
                    <p style={{ color: '#64748b', margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' }}>Success Rate</p>
                    <h2 style={{ fontSize: '32px', margin: 0, color: '#1e293b' }}>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</h2>
                </div>
            </div>

            {/* 📋 Team Progress Matrix (Full Utilization) */}
            <div style={tableWrapper}>
                <h3 style={{ marginBottom: '30px', color: '#0f172a', fontSize: '20px', fontWeight: '700' }}>Team Activity Feed</h3>
                {loading ? <div style={{ textAlign: 'center', padding: '50px' }}>🔄 Syncing with Cloud...</div> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                            <thead>
                                <tr style={{ textAlign: 'left' }}>
                                    <th style={{ padding: '15px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Member</th>
                                    <th style={{ padding: '15px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Task Details</th>
                                    <th style={{ padding: '15px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Status</th>
                                    <th style={{ padding: '15px', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Management</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamTasks.length > 0 ? teamTasks.map((task) => (
                                    <tr key={task._id} style={{ backgroundColor: '#f8fafc', transition: '0.3s' }}>
                                        <td style={{ padding: '20px', borderRadius: '15px 0 0 15px' }}>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{task.assignedTo}</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Assigned: {new Date(task.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{ fontWeight: '600', color: '#475569' }}>{task.title}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{task.description}</div>
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <span style={statusBadge(task.status)}>{task.status}</span>
                                        </td>
                                        <td style={{ padding: '20px', textAlign: 'center', borderRadius: '0 15px 15px 0' }}>
                                            <button 
                                                onClick={() => navigate(`/member-details/${task.assignedTo}`)} 
                                                style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', marginRight: '10px', color: '#475569' }}
                                            >Review</button>
                                            
                                            {task.status === 'Submitted' && (
                                                <button 
                                                    onClick={() => handleEvaluation(task._id)} 
                                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >Approve ✅</button>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
                                            <div style={{ fontSize: '40px' }}>🏜️</div>
                                            <p>No tasks found in your team ecosystem.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaderDashboard;