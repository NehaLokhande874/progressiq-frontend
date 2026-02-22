import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const LeaderDashboard = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [teamTasks, setTeamTasks] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    // ✅ Login logic pramane 'username' madhe email aahe
    const leaderEmail = localStorage.getItem('username'); 
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!leaderEmail) {
                setLoading(false);
                return;
            }
            try {
                // 1. Leader sathi sarv tasks aanne
                const res = await API.get(`/tasks/leader/${leaderEmail}`);
                const allTasks = res.data;
                
                // Sorting: Navin tasks var dakhva
                const sortedTasks = allTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setTeamTasks(sortedTasks);

                // 2. Stats calculate karne
                const total = allTasks.length;
                const completed = allTasks.filter(t => t.status === 'Completed' || t.status === 'Submitted').length;
                const pending = total - completed;
                setStats({ total, completed, pending });
            } catch (err) {
                console.error("Dashboard data fetching error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [leaderEmail]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // --- Internal Styling ---
    const cardStyle = {
        padding: '25px',
        borderRadius: '15px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center',
        flex: 1,
        margin: '10px',
        border: '1px solid #e2e8f0'
    };

    const tableHeader = { backgroundColor: '#f8fafc', textAlign: 'left', padding: '15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' };
    const tableCell = { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' };
    const viewBtn = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.2s' };

    return (
        <div style={{ padding: '40px', fontFamily: '"Inter", sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Leader Dashboard 🚀</h1>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Welcome back, <b>{leaderEmail}</b></p>
                </div>
                <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 22px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Logout
                </button>
            </div>

            {/* Overview Stats Cards */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={cardStyle}>
                    <h2 style={{ color: '#2563eb', margin: '0 0 5px 0', fontSize: '32px' }}>{stats.total}</h2>
                    <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Total Assignments</p>
                </div>
                <div style={cardStyle}>
                    <h2 style={{ color: '#f59e0b', margin: '0 0 5px 0', fontSize: '32px' }}>{stats.pending}</h2>
                    <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Pending Tasks</p>
                </div>
                <div style={cardStyle}>
                    <h2 style={{ color: '#10b981', margin: '0 0 5px 0', fontSize: '32px' }}>{stats.completed}</h2>
                    <p style={{ color: '#64748b', margin: 0, fontWeight: '500' }}>Completed Work</p>
                </div>
            </div>

            {/* Quick Actions Section */}
            <div style={{ margin: '40px 0', textAlign: 'center' }}>
                <button 
                    onClick={() => navigate('/leader-tasks')} 
                    style={{ backgroundColor: '#2563eb', color: 'white', padding: '18px 40px', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}
                >
                    + Assign New Task to Members
                </button>
            </div>

            {/* 👥 Team Progress Table */}
            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '25px', color: '#1e293b' }}>👥 Team Real-time Progress</h3>
                
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#64748b' }}>Updating team data...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableHeader}>Member</th>
                                <th style={tableHeader}>Task Assigned</th>
                                <th style={tableHeader}>Status</th>
                                <th style={tableHeader}>Evaluation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamTasks.length > 0 ? teamTasks.map((task) => (
                                <tr key={task._id}>
                                    <td style={tableCell}><b>{task.assignedTo}</b></td>
                                    <td style={tableCell}>{task.title || "Untitled Task"}</td>
                                    <td style={tableCell}>
                                        <span style={{ 
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                            backgroundColor: (task.status === 'Completed' || task.status === 'Submitted') ? '#dcfce7' : '#fee2e2',
                                            color: (task.status === 'Completed' || task.status === 'Submitted') ? '#166534' : '#991b1b'
                                        }}>
                                            {task.status}
                                        </span>
                                    </td>
                                    <td style={tableCell}>
                                        <button 
                                            onClick={() => navigate(`/member-details/${task.assignedTo}`)} 
                                            style={viewBtn}
                                        >
                                            Analyze Work 📈
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No tasks created. Start by assigning your first task!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ marginTop: '30px', padding: '15px 25px', backgroundColor: '#eff6ff', borderRadius: '10px', borderLeft: '5px solid #2563eb' }}>
                <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                    <b>💡 Pro Tip:</b> Jeva member file upload karel, teva status automatic "Submitted" hoil. Tumhi "Analyze Work" var click karun tyanchi file check karu shakta.
                </p>
            </div>
        </div>
    );
};

export default LeaderDashboard;