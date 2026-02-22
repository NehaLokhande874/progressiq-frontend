import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard'); // ✅ Sidebar control sathi

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            const [userRes, taskRes] = await Promise.all([
                API.get('/auth/admin/users'),
                API.get('/tasks/all')
            ]);
            setUsers(userRes.data);
            setTasks(taskRes.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    // ✅ SARVIKADUN REMOVE KARNYACHE LOGIC
    const handleDeleteUser = async (email) => {
        if (!window.confirm(`⚠️ Delete ${email}? This will remove them from all teams and delete their tasks!`)) return;
        try {
            // Backend madhe deleteMany logic aslyamule ha user sarvikadun saaf hoil
            await API.delete(`/auth/admin/delete-user/${email}`);
            alert("User and related tasks removed everywhere!");
            fetchAllData();
        } catch (err) {
            alert("Error deleting user");
        }
    };

    if (loading) return <div style={loaderStyle}>Loading Master Panel...</div>;

    // --- RENDER FUNCTIONS ---

    const renderDashboard = () => (
        <>
            <div style={statsGrid}>
                <div style={statCard}><p style={statLabel}>Total Tasks</p><h2 style={statValue}>{tasks.length}</h2></div>
                <div style={statCard}><p style={statLabel}>Completed</p><h2 style={{ ...statValue, color: '#10b981' }}>{tasks.filter(t => t.status === 'Completed').length}</h2></div>
                <div style={statCard}><p style={statLabel}>Pending/Active</p><h2 style={{ ...statValue, color: '#f59e0b' }}>{tasks.filter(t => t.status !== 'Completed').length}</h2></div>
            </div>
            <div style={contentLayout}>
                <div style={cardWrapper}>
                    <h3 style={cardTitle}>Recent Global Activities</h3>
                    {tasks.slice(0, 5).map(t => (
                        <div key={t._id} style={taskItem}>
                            <strong>{t.title}</strong> - <small>{t.status}</small>
                            <p style={taskMeta}>{t.leaderEmail} assigned to {t.assignedTo}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    const renderUsersList = () => {
        const leaders = users.filter(u => u.role === 'Leader');
        return (
            <div style={cardWrapper}>
                <h3 style={cardTitle}>Grouped Users (Teams)</h3>
                {leaders.map(leader => (
                    <div key={leader._id} style={teamBox}>
                        <div style={teamHeader}>
                            <strong>Leader: {leader.username} ({leader.email})</strong>
                            <button onClick={() => handleDeleteUser(leader.email)} style={delBtn}>Remove Leader</button>
                        </div>
                        <div style={{ paddingLeft: '20px' }}>
                            <p style={{ fontSize: '12px', color: '#666' }}>Team Members:</p>
                            {/* Task madhun member list find karne */}
                            {[...new Set(tasks.filter(t => t.leaderEmail === leader.email).map(t => t.assignedTo))].map(memberEmail => (
                                <div key={memberEmail} style={memberItem}>
                                    👤 {memberEmail} 
                                    <button onClick={() => handleDeleteUser(memberEmail)} style={delBtnSmall}>Remove</button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderTaskLogs = () => (
        <div style={cardWrapper}>
            <h3 style={cardTitle}>Full System Task Logs</h3>
            <table style={tableStyle}>
                <thead>
                    <tr style={theadStyle}>
                        <th style={thStyle}>Task</th>
                        <th style={thStyle}>From/To</th>
                        <th style={thStyle}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.map(t => (
                        <tr key={t._id} style={trStyle}>
                            <td style={tdStyle}>{t.title}</td>
                            <td style={tdStyle}>{t.leaderEmail} ➡️ {t.assignedTo}</td>
                            <td style={tdStyle}>{t.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={containerStyle}>
            {/* SIDEBAR */}
            <div style={sidebarStyle}>
                <h2 style={{ color: '#fff', marginBottom: '40px' }}>IQ Admin</h2>
                <nav style={navStyle}>
                    <div onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? navItemActive : navItem}>📊 Dashboard</div>
                    <div onClick={() => setActiveTab('users')} style={activeTab === 'users' ? navItemActive : navItem}>👥 Users List</div>
                    <div onClick={() => setActiveTab('logs')} style={activeTab === 'logs' ? navItemActive : navItem}>📝 Task Logs</div>
                </nav>
                <button onClick={() => { localStorage.clear(); window.location.href = '/' }} style={logoutBtnSide}>Logout 🚪</button>
            </div>

            {/* MAIN CONTENT */}
            <div style={mainContentStyle}>
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'users' && renderUsersList()}
                {activeTab === 'logs' && renderTaskLogs()}
            </div>
        </div>
    );
};

// --- STYLES ---
const containerStyle = { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f4f7fe' };
const sidebarStyle = { width: '240px', backgroundColor: '#1e1e2d', padding: '30px 20px', display: 'flex', flexDirection: 'column' };
const navStyle = { flex: 1 };
const navItem = { padding: '12px 15px', borderRadius: '8px', marginBottom: '10px', color: '#a2a3b7', cursor: 'pointer', transition: '0.3s' };
const navItemActive = { ...navItem, backgroundColor: '#2b2b40', color: '#fff', fontWeight: 'bold' };
const mainContentStyle = { flex: 1, padding: '30px', overflowY: 'auto' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '30px' };
const statCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const statLabel = { color: '#888', fontSize: '14px' };
const statValue = { fontSize: '28px', fontWeight: 'bold', margin: '10px 0 0 0' };
const contentLayout = { display: 'grid', gridTemplateColumns: '1fr', gap: '30px' };
const cardWrapper = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const cardTitle = { marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' };
const teamBox = { border: '1px solid #eee', borderRadius: '10px', padding: '15px', marginBottom: '15px' };
const teamHeader = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f9f9f9', marginBottom: '10px' };
const memberItem = { padding: '8px', backgroundColor: '#f8f9fa', marginBottom: '5px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' };
const taskItem = { padding: '15px', borderBottom: '1px solid #f1f1f1' };
const taskMeta = { fontSize: '12px', color: '#777', margin: '5px 0' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '12px', backgroundColor: '#f8f9fa' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee', fontSize: '14px' };
const delBtn = { color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' };
const delBtnSmall = { ...delBtn, fontSize: '11px' };
const logoutBtnSide = { backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' };
const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' };

export default AdminDashboard;