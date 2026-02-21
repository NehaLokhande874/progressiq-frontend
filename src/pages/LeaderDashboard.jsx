import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const LeaderDashboard = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });
    const [teamTasks, setTeamTasks] = useState([]); // Table sathi data
    const username = localStorage.getItem('username'); // Leader cha email
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Leader sathi sarv tasks aanne
                const res = await API.get(`/tasks/leader/${username}`);
                const allTasks = res.data;
                setTeamTasks(allTasks);

                // 2. Stats calculate karne
                const total = allTasks.length;
                const completed = allTasks.filter(t => t.status === 'Completed').length;
                const pending = total - completed;
                setStats({ total, completed, pending });
            } catch (err) {
                console.error("Dashboard data fetching error:", err);
            }
        };
        fetchDashboardData();
    }, [username]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // --- Internal Styling ---
    const cardStyle = {
        padding: '20px',
        borderRadius: '10px',
        backgroundColor: '#fff',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        flex: 1,
        margin: '10px'
    };

    const tableHeader = { backgroundColor: '#f1f5f9', textAlign: 'left', padding: '12px' };
    const tableCell = { padding: '12px', borderBottom: '1px solid #eee' };
    const viewBtn = { backgroundColor: '#3182ce', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' };

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1>Leader Dashboard</h1>
                    <p>Welcome, <strong>{username}</strong>! Managing your team is now easier.</p>
                </div>
                <button onClick={handleLogout} style={{ backgroundColor: '#ff4d4d', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            <hr />

            {/* Overview Stats Cards */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <div style={cardStyle}>
                    <h2 style={{ color: '#0047ff' }}>{stats.total}</h2>
                    <p>Total Tasks Assigned</p>
                </div>
                <div style={cardStyle}>
                    <h2 style={{ color: 'orange' }}>{stats.pending}</h2>
                    <p>Tasks Pending</p>
                </div>
                <div style={cardStyle}>
                    <h2 style={{ color: 'green' }}>{stats.completed}</h2>
                    <p>Tasks Completed</p>
                </div>
            </div>

            {/* Quick Actions Section */}
            <div style={{ margin: '30px 0', textAlign: 'center' }}>
                <button 
                    onClick={() => navigate('/leader-tasks')} 
                    style={{ backgroundColor: '#0047ff', color: 'white', padding: '15px 30px', fontSize: '16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    + Manage & Assign New Tasks
                </button>
            </div>

            {/* 📋 Team Progress Table (With Clickable Analysis) */}
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '20px' }}>👥 Team Progress & Evaluation</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={tableHeader}>Member Email</th>
                            <th style={tableHeader}>Last Task</th>
                            <th style={tableHeader}>Status</th>
                            <th style={tableHeader}>Analysis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamTasks.length > 0 ? teamTasks.map((task) => (
                            <tr key={task._id}>
                                <td style={tableCell}><b>{task.assignedTo}</b></td>
                                <td style={tableCell}>{task.title}</td>
                                <td style={tableCell}>
                                    <span style={{ 
                                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                        backgroundColor: task.status === 'Completed' ? '#c6f6d5' : '#fed7d7',
                                        color: task.status === 'Completed' ? '#22543d' : '#822727'
                                    }}>
                                        {task.status}
                                    </span>
                                </td>
                                <td style={tableCell}>
                                    <button 
                                        onClick={() => navigate(`/member-details/${task.assignedTo}`)} 
                                        style={viewBtn}
                                    >
                                        View Full Report 📈
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No tasks assigned yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#eef2ff', borderRadius: '10px' }}>
                <h4>Leader Tip:</h4>
                <p>Click "View Full Report" to check individual member's progress, uploaded files, and evaluation reports.</p>
            </div>
        </div>
    );
};

export default LeaderDashboard;