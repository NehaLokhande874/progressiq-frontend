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

    // --- 📏 Premium Alignment Styles ---
    const pageWrapper = { 
        backgroundColor: '#f8fafc', 
        minHeight: '100vh', 
        width: '100vw',        
        margin: '0', 
        padding: '40px 0',     // Top/Bottom padding
        boxSizing: 'border-box',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',  // Centers everything horizontally
        overflowX: 'hidden'
    };

    const contentBox = {
        width: '90%',          // Desktop var 90% space vaprel
        maxWidth: '1400px',    // Mothya screen var size limit karel
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
    };

    const headerArea = { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: '#fff',
        padding: '30px 45px',
        borderRadius: '28px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0'
    };

    const statsGrid = { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '25px', 
        width: '100%'
    };

    const statCard = (color) => ({ 
        padding: '35px', 
        borderRadius: '28px', 
        backgroundColor: '#fff', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', 
        borderTop: `10px solid ${color}`, // Top border looks cleaner for cards
        textAlign: 'left',
        transition: 'transform 0.2s'
    });

    const tableContainer = { 
        backgroundColor: '#fff', 
        padding: '40px', 
        borderRadius: '32px', 
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid #e2e8f0'
    };

    const statusBadge = (s) => {
        const colors = {
            'Completed': { bg: '#dcfce7', text: '#166534' },
            'Submitted': { bg: '#e0f2fe', text: '#0369a1' },
            'Active': { bg: '#fff7ed', text: '#9a3412' }
        };
        const style = colors[s] || { bg: '#f1f5f9', text: '#475569' };
        return { padding: '10px 20px', borderRadius: '14px', fontSize: '13px', fontWeight: '800', backgroundColor: style.bg, color: style.text, textTransform: 'uppercase' };
    };

    return (
        <div style={pageWrapper}>
            <div style={contentBox}>
                
                {/* 🏷️ Header Section */}
                <div style={headerArea}>
                    <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '38px', fontWeight: '800', letterSpacing: '-1px' }}>Leader Console ⚡</h1>
                        <p style={{ color: '#64748b', fontSize: '18px', marginTop: '8px' }}>Tracking team performance for <b>{leaderName}</b></p>
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={() => navigate('/leader-tasks')} style={{ background: '#2563eb', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '18px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}>+ New Assignment</button>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: '#fff', color: '#ef4444', border: '2px solid #fee2e2', padding: '14px 28px', borderRadius: '18px', cursor: 'pointer', fontWeight: '700' }}>Logout</button>
                    </div>
                </div>

                {/* 📊 High-Level Stats */}
                <div style={statsGrid}>
                    <div style={statCard('#3b82f6')}><p style={{ color: '#64748b', fontWeight: '700', fontSize: '15px' }}>TOTAL PROJECTS</p><h2 style={{ fontSize: '42px', margin: '10px 0 0 0', color: '#1e293b' }}>{stats.total}</h2></div>
                    <div style={statCard('#f59e0b')}><p style={{ color: '#64748b', fontWeight: '700', fontSize: '15px' }}>PENDING TASKS</p><h2 style={{ fontSize: '42px', margin: '10px 0 0 0', color: '#1e293b' }}>{stats.pending}</h2></div>
                    <div style={statCard('#0ea5e9')}><p style={{ color: '#64748b', fontWeight: '700', fontSize: '15px' }}>NEEDS REVIEW</p><h2 style={{ fontSize: '42px', margin: '10px 0 0 0', color: '#1e293b' }}>{stats.submitted}</h2></div>
                    <div style={statCard('#10b981')}><p style={{ color: '#64748b', fontWeight: '700', fontSize: '15px' }}>TEAM EFFICIENCY</p><h2 style={{ fontSize: '42px', margin: '10px 0 0 0', color: '#10b981' }}>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</h2></div>
                </div>

                {/* 📑 Data Table Section */}
                <div style={tableContainer}>
                    <h3 style={{ marginBottom: '35px', color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>👥 Team Activity Feed</h3>
                    {loading ? <div style={{ textAlign: 'center', padding: '40px', fontSize: '20px', color: '#64748b' }}>🔄 Syncing database...</div> : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 15px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <th style={{ padding: '0 25px' }}>Member</th>
                                        <th style={{ padding: '0 25px' }}>Task Details</th>
                                        <th style={{ padding: '0 25px' }}>Current Status</th>
                                        <th style={{ padding: '0 25px', textAlign: 'center' }}>Management</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamTasks.length > 0 ? teamTasks.map((task) => (
                                        <tr key={task._id} style={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                                            <td style={{ padding: '25px', borderRadius: '20px 0 0 20px', fontWeight: '700', color: '#334155' }}>
                                                {task.assignedTo}
                                                <div style={{ fontWeight: '400', fontSize: '12px', color: '#94a3b8' }}>Assigned: {new Date(task.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '25px', color: '#475569', fontWeight: '600' }}>{task.title}</td>
                                            <td style={{ padding: '25px' }}><span style={statusBadge(task.status)}>{task.status}</span></td>
                                            <td style={{ padding: '25px', textAlign: 'center', borderRadius: '0 20px 20px 0' }}>
                                                <button onClick={() => navigate(`/member-details/${task.assignedTo}`)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 24px', borderRadius: '14px', marginRight: '12px', cursor: 'pointer', fontWeight: '700', color: '#475569' }}>Review</button>
                                                {task.status === 'Submitted' && (
                                                    <button onClick={() => handleEvaluation(task._id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', marginRight: '12px', cursor: 'pointer', fontWeight: '800' }}>Approve</button>
                                                )}
                                                <button onClick={() => handleRemoveMember(task.assignedTo)} style={{ background: 'none', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '22px', verticalAlign: 'middle' }}>🗑️</button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '18px' }}>No tasks found in the pipeline.</td>
                                        </tr>
                                    )}
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