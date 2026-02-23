import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const LeaderDashboard = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, submitted: 0 });
    const [teamTasks, setTeamTasks] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // ✅ FIXED: use 'email' not 'username' for fetching tasks
    const leaderEmail = localStorage.getItem('email');
    // ✅ Show name in welcome message separately
    const leaderName = localStorage.getItem('username');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!leaderEmail) {
                setLoading(false);
                return;
            }
            try {
                const res = await API.get(`/tasks/leader/${leaderEmail}`);
                const allTasks = res.data;
                
                const sortedTasks = allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setTeamTasks(sortedTasks);

                const total = allTasks.length;
                const completed = allTasks.filter(t => t.status === 'Completed').length;
                const submitted = allTasks.filter(t => t.status === 'Submitted').length;
                const pending = total - (completed + submitted);
                setStats({ total, completed, pending, submitted });
            } catch (err) {
                console.error("Dashboard data fetching error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [leaderEmail]);

    const handleEvaluation = async (taskId) => {
        try {
            await API.put(`/tasks/add-feedback/${taskId}`, { 
                feedback: "Excellent Work! Verified by Leader.",
                status: 'Completed' 
            });
            alert("Task marked as Completed! ✅");
            window.location.reload();
        } catch (err) {
            console.error("Evaluation error:", err);
        }
    };

    // ✅ NEW: Remove member function
    const handleRemoveMember = async (memberEmail) => {
        if (window.confirm(`Are you sure you want to remove ${memberEmail}?`)) {
            try {
                await API.delete(`/tasks/remove-member/${encodeURIComponent(memberEmail)}`);
                setTeamTasks(prev => prev.filter(t => t.assignedTo !== memberEmail));
                alert("🗑️ Member removed successfully!");
            } catch (err) {
                alert("❌ Error removing member.");
            }
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const cardStyle = {
        padding: '25px', borderRadius: '15px', backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center',
        flex: 1, margin: '10px', border: '1px solid #e2e8f0'
    };
    const tableHeader = { backgroundColor: '#f8fafc', textAlign: 'left', padding: '15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' };
    const tableCell = { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' };
    const viewBtn = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' };
    const doneBtn = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' };
    const removeBtn = { backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };

    // ✅ Status badge with correct colors
    const statusBadge = (status) => ({
        padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
        backgroundColor: status === 'Completed' ? '#dcfce7' : status === 'Submitted' ? '#e0f2fe' : status === 'Active' ? '#d1fae5' : '#fee2e2',
        color: status === 'Completed' ? '#166534' : status === 'Submitted' ? '#0369a1' : status === 'Active' ? '#065f46' : '#991b1b'
    });

    return (
        <div style={{ padding: '40px', fontFamily: '"Inter", sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Leader Dashboard 🚀</h1>
                    {/* ✅ Shows name, not email */}
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Welcome back, <b>{leaderName}</b></p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{leaderEmail}</p>
                </div>
                <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 22px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Logout
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={cardStyle}>
                    <h2 style={{ color: '#2563eb', margin: '0 0 5px 0', fontSize: '32px' }}>{stats.total}</h2>
                    <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Total Tasks</p>
                </div>
                <div style={cardStyle}>
                    <h2 style={{ color: '#f59e0b', margin: '0 0 5px 0', fontSize: '32px' }}>{stats.submitted}</h2>
                    <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Waiting Review</p>
                </div>
                <div style={cardStyle}>
                    <h2 style={{ color: '#10b981', margin: '0 0 5px 0', fontSize: '32px' }}>{stats.completed}</h2>
                    <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Completed Work</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ margin: