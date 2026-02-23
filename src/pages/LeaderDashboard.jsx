import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const LeaderDashboard = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, submitted: 0 });
    const [teamTasks, setTeamTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // ✅ Strong User Parsing (Hyamule Admin che updates sync hotil)
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const leaderEmail = user.email || localStorage.getItem('email');
    const leaderName = user.username || "Leader";
    
    const navigate = useNavigate();

    // ✅ Sync logic with Admin Changes
    useEffect(() => {
        fetchDashboardData();
    }, [leaderEmail]);

    const fetchDashboardData = async () => {
        if (!leaderEmail) {
            setLoading(false);
            return;
        }
        try {
            // ✅ Fresh Data fetching from backend
            const res = await API.get(`/tasks/leader/${leaderEmail}`);
            const allTasks = Array.isArray(res.data) ? res.data : [];
            
            setTeamTasks(allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

            // 📊 Real-time Stats Calculation (Logic Fix for 'Active' & 'Pending')
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

    const handleEvaluation = async (taskId) => {
        try {
            await API.put(`/tasks/add-feedback/${taskId}`, { 
                feedback: "Verified by Leader.", 
                status: 'Completed' 
            });
            alert("Task marked as Completed! ✅");
            fetchDashboardData(); // Refresh data without full reload
        } catch (err) {
            console.error("Evaluation error:", err);
        }
    };

    const handleRemoveMember = async (memberEmail) => {
        if (window.confirm(`Remove all tasks for ${memberEmail}?`)) {
            try {
                await API.delete(`/tasks/remove-member/${encodeURIComponent(memberEmail)}`);
                alert("🗑️ Removed!");
                fetchDashboardData();
            } catch (err) {
                alert("❌ Error removing member.");
            }
        }
    };

    const handleLogout = () => { 
        localStorage.clear(); 
        navigate('/'); 
    };

    // --- Modern UI Styles ---
    const containerStyle = { padding: '40px', fontFamily: '"Poppins", sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };
    const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' };
    const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' };
    const cardStyle = (color) => ({ padding: '25px', borderRadius: '16px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: `6px solid ${color}`, textAlign: 'center' });
    const tableContainer = { backgroundColor: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' };
    const btnPrimary = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' };
    
    const statusBadge = (s) => {
        const colors = {
            'Completed': { bg: '#dcfce7', text: '#166534' },
            'Submitted': { bg: '#e0f2fe', text: '#0369a1' },
            'Active': { bg: '#fef3c7', text: '#92400e' },
            'Pending': { bg: '#f1f5f9', text: '#475569' }
        };
        const style = colors[s] || colors['Pending'];
        return { padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: '600', backgroundColor: style.bg, color: style.text };
    };

    return (
        <div style={containerStyle}>
            {/* Header Section */}
            <div style={headerStyle}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '32px', fontWeight: '800' }}>Leader Dashboard 🚀</h1>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Team Overview for <b>{leaderName}</b></p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{leaderEmail}</p>
                </div>
                <button onClick={handleLogout} style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '12px 24px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Logout</button>
            </div>

            {/* Stats Overview */}
            <div style={statsGrid}>
                <div style={cardStyle('#3b82f6')}><h2 style={{ fontSize: '32px', margin: '0 0 5px 0', color: '#1e293b' }}>{stats.total}</h2><p style={{ color: '#64748b', margin: 0 }}>Total Assignments</p></div>
                <div style={cardStyle('#f59e0b')}><h2 style={{ fontSize: '32px', margin: '0 0 5px 0', color: '#1e293b' }}>{stats.pending}</h2><p style={{ color: '#64748b', margin: 0 }}>Active Pending</p></div>
                <div style={cardStyle('#0ea5e9')}><h2 style={{ fontSize: '32px', margin: '0 0 5px 0', color: '#1e293b' }}>{stats.submitted}</h2><p style={{ color: '#64748b', margin: 0 }}>Review Required</p></div>
                <div style={cardStyle('#10b981')}><h2 style={{ fontSize: '32px', margin: '0 0 5px 0', color: '#1e293b' }}>{stats.completed}</h2><p style={{ color: '#64748b', margin: 0 }}>Completed</p></div>
            </div>

            {/* Main Action */}
            <div style={{ textAlign: 'center', margin: '40px 0' }}>
                <button onClick={() => navigate('/leader-tasks')} style={btnPrimary}>+ Create New Team Task</button>
            </div>

            {/* Real-time Table */}
            <div style={tableContainer}>
                <h3 style={{ marginBottom: '25px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>👥 Team Progress Matrix</h3>
                {loading ? <p style={{ textAlign: 'center', padding: '40px' }}>🔄 Syncing with Admin Database...</p> : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #edf2f7' }}>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Member Email</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Task Title</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '15px', textAlign: 'center', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teamTasks.length > 0 ? teamTasks.map((task) => (
                                    <tr key={task._id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.3s' }}>
                                        <td style={{ padding: '15px', color: '#1e293b', fontWeight: '600' }}>{task.assignedTo}</td>
                                        <td style={{ padding: '15px', color: '#475569' }}>{task.title || "Untitled Task"}</td>
                                        <td style={{ padding: '15px' }}><span style={statusBadge(task.status)}>{task.status}</span></td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <button onClick={() => navigate(`/member-details/${task.assignedTo}`)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}>View</button>
                                            {task.status === 'Submitted' && (
                                                <button onClick={() => handleEvaluation(task._id)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', marginRight: '8px', fontWeight: 'bold' }}>Approve ✅</button>
                                            )}
                                            <button onClick={() => handleRemoveMember(task.assignedTo)} style={{ background: 'none', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>🗑️</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>No tasks found in your team records.</td></tr>
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