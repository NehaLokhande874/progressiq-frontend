import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const LeaderDashboard = () => {
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, submitted: 0 });
    const [teamTasks, setTeamTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const leaderEmail = localStorage.getItem('email');
    const leaderName = localStorage.getItem('username');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!leaderEmail) { setLoading(false); return; }
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
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [leaderEmail]);

    const handleEvaluation = async (taskId) => {
        try {
            await API.put(`/tasks/add-feedback/${taskId}`, { feedback: "Verified by Leader.", status: 'Completed' });
            alert("Task marked as Completed! ✅");
            window.location.reload();
        } catch (err) {
            console.error("Evaluation error:", err);
        }
    };

    const handleRemoveMember = async (memberEmail) => {
        if (window.confirm(`Remove ${memberEmail}?`)) {
            try {
                await API.delete(`/tasks/remove-member/${encodeURIComponent(memberEmail)}`);
                setTeamTasks(prev => prev.filter(t => t.assignedTo !== memberEmail));
                alert("🗑️ Removed!");
            } catch (err) {
                alert("❌ Error removing member.");
            }
        }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    const cardStyle = { padding: '25px', borderRadius: '15px', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', textAlign: 'center', flex: 1, margin: '10px', border: '1px solid #e2e8f0' };
    const tableHeader = { backgroundColor: '#f8fafc', textAlign: 'left', padding: '15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase' };
    const tableCell = { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' };
    const viewBtn = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' };
    const doneBtn = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', marginRight: '5px' };
    const removeBtn = { backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
    const statusBadge = (s) => ({ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', backgroundColor: s === 'Completed' ? '#dcfce7' : s === 'Submitted' ? '#e0f2fe' : s === 'Active' ? '#d1fae5' : '#fee2e2', color: s === 'Completed' ? '#166534' : s === 'Submitted' ? '#0369a1' : s === 'Active' ? '#065f46' : '#991b1b' });

    return (
        <div style={{ padding: '40px', fontFamily: '"Inter", sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px' }}>Leader Dashboard 🚀</h1>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Welcome back, <b>{leaderName}</b></p>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>{leaderEmail}</p>
                </div>
                <button onClick={handleLogout} style={{ backgroundColor: '#ef4444', color: '#fff', padding: '10px 22px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Logout</button>
            </div>

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

            <div style={{ margin: '40px 0', textAlign: 'center' }}>
                <button onClick={() => navigate('/leader-tasks')} style={{ backgroundColor: '#2563eb', color: 'white', padding: '18px 40px', fontSize: '16px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)' }}>
                    + Assign New Task
                </button>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '25px', color: '#1e293b' }}>👥 Team Real-time Progress</h3>
                {loading ? <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={tableHeader}>Member</th>
                                <th style={tableHeader}>Task</th>
                                <th style={tableHeader}>Status</th>
                                <th style={tableHeader}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamTasks.length > 0 ? teamTasks.map((task) => (
                                <tr key={task._id}>
                                    <td style={tableCell}><b>{task.assignedTo}</b></td>
                                    <td style={tableCell}>{task.title || "Untitled"}</td>
                                    <td style={tableCell}><span style={statusBadge(task.status)}>{task.status}</span></td>
                                    <td style={tableCell}>
                                        <button onClick={() => navigate(`/member-details/${task.assignedTo}`)} style={viewBtn}>View</button>
                                        {task.status === 'Submitted' && (
                                            <button onClick={() => handleEvaluation(task._id)} style={doneBtn}>Approve ✅</button>
                                        )}
                                        <button onClick={() => handleRemoveMember(task.assignedTo)} style={removeBtn}>🗑️</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No tasks assigned yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default LeaderDashboard;
```

**Step 5 — Scroll down, click "Commit changes"**, write message:
```
fix: complete LeaderDashboard - build error fixed