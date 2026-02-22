import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleResetDatabase = async () => {
        if (!window.confirm("⚠️ DANGER: Sagle tasks delete karayche aahet ka?")) return;
        try {
            await API.delete('/tasks/admin/clear-all-tasks');
            alert("✅ Database Cleaned!");
            fetchAllData();
        } catch (err) {
            alert("Reset failed.");
        }
    };

    const handleDeleteUser = async (email) => {
        if (!window.confirm(`Delete ${email}?`)) return;
        try {
            await API.delete(`/auth/admin/delete-user/${email}`);
            fetchAllData();
        } catch (err) {
            alert("Error deleting user");
        }
    };

    if (loading) return <div style={loaderStyle}>Mastering the Control Panel...</div>;

    return (
        <div style={containerStyle}>
            {/* --- SIDEBAR --- */}
            <div style={sidebarStyle}>
                <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '40px' }}>IQ Admin</h2>
                <nav style={navStyle}>
                    <div style={navItemActive}>📊 Dashboard</div>
                    <div style={navItem}>👥 Users List</div>
                    <div style={navItem}>📝 Task Logs</div>
                </nav>
                <button onClick={() => {localStorage.clear(); window.location.href='/'}} style={logoutBtnSide}>
                    Logout 🚪
                </button>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div style={mainContentStyle}>
                <header style={headerStyle}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px' }}>System Overview</h1>
                        <p style={{ color: '#666', margin: '5px 0 0 0' }}>Manage users and monitor project health</p>
                    </div>
                    <button onClick={handleResetDatabase} style={dangerBtn}>
                        Reset Database 💣
                    </button>
                </header>

                {/* STATS CARDS */}
                <div style={statsGrid}>
                    <div style={statCard}>
                        <p style={statLabel}>Total Users</p>
                        <h2 style={statValue}>{users.length}</h2>
                    </div>
                    <div style={statCard}>
                        <p style={statLabel}>Total Tasks</p>
                        <h2 style={statValue}>{tasks.length}</h2>
                    </div>
                    <div style={statCard}>
                        <p style={statLabel}>Completed</p>
                        <h2 style={{ ...statValue, color: '#10b981' }}>
                            {tasks.filter(t => t.status === 'Completed').length}
                        </h2>
                    </div>
                    <div style={statCard}>
                        <p style={statLabel}>Pending/Active</p>
                        <h2 style={{ ...statValue, color: '#f59e0b' }}>
                            {tasks.filter(t => t.status !== 'Completed').length}
                        </h2>
                    </div>
                </div>

                <div style={contentLayout}>
                    {/* LEFT: USER TABLE */}
                    <div style={cardWrapper}>
                        <h3 style={cardTitle}>User Management</h3>
                        <div style={scrollableTable}>
                            <table style={tableStyle}>
                                <thead style={theadStyle}>
                                    <tr>
                                        <th style={thStyle}>User Details</th>
                                        <th style={thStyle}>Role</th>
                                        <th style={thStyle}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={trStyle}>
                                            <td style={tdStyle}>
                                                <strong>{u.username}</strong><br/>
                                                <span style={{ fontSize: '12px', color: '#888' }}>{u.email}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={roleBadge(u.role)}>{u.role}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <button onClick={() => handleDeleteUser(u.email)} style={delLink} disabled={u.role === 'Admin'}>
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT: TASK MONITOR */}
                    <div style={cardWrapper}>
                        <h3 style={cardTitle}>Global Task Monitor</h3>
                        <div style={taskScrollList}>
                            {tasks.length > 0 ? tasks.map(t => (
                                <div key={t._id} style={taskItem}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '600' }}>{t.title}</span>
                                        <span style={statusText(t.status)}>{t.status}</span>
                                    </div>
                                    <p style={taskMeta}>Leader: {t.leaderEmail} → {t.assignedTo}</p>
                                </div>
                            )) : <p style={{ textAlign: 'center', color: '#999' }}>No tasks found.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES (PRO ALIGNMENT) ---
const containerStyle = { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f4f7fe', overflow: 'hidden' };
const sidebarStyle = { width: '240px', backgroundColor: '#1e1e2d', padding: '30px 20px', display: 'flex', flexDirection: 'column', color: '#fff' };
const navStyle = { flex: 1, marginTop: '20px' };
const navItem = { padding: '12px 15px', borderRadius: '8px', marginBottom: '10px', color: '#a2a3b7', cursor: 'pointer' };
const navItemActive = { ...navItem, backgroundColor: '#2b2b40', color: '#fff', fontWeight: 'bold' };

const mainContentStyle = { flex: 1, padding: '30px', overflowY: 'auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '30px' };
const statCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', textAlign: 'left' };
const statLabel = { margin: 0, color: '#888', fontSize: '14px', fontWeight: '600' };
const statValue = { margin: '10px 0 0 0', fontSize: '28px', fontWeight: 'bold' };

const contentLayout = { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '30px' };
const cardWrapper = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: 'fit-content' };
const cardTitle = { margin: '0 0 20px 0', fontSize: '18px', borderBottom: '1px solid #eee', paddingBottom: '10px' };

const scrollableTable = { maxHeight: '400px', overflowY: 'auto' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const theadStyle = { position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 };
const thStyle = { textAlign: 'left', padding: '12px', color: '#666', fontSize: '13px', textTransform: 'uppercase' };
const tdStyle = { padding: '15px 12px', fontSize: '14px' };
const trStyle = { borderBottom: '1px solid #f8f9fa' };

const taskScrollList = { maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' };
const taskItem = { padding: '15px', backgroundColor: '#fcfcfc', borderRadius: '10px', border: '1px solid #f1f1f1', marginBottom: '12px' };
const taskMeta = { margin: '5px 0 0 0', fontSize: '12px', color: '#777' };

const dangerBtn = { backgroundColor: '#fff1f1', color: '#e53e3e', border: '1px solid #feb2b2', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const logoutBtnSide = { backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const delLink = { color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '13px' };

const roleBadge = (role) => ({
    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
    backgroundColor: role === 'Admin' ? '#e0e7ff' : role === 'Leader' ? '#ecfdf5' : '#fff7ed',
    color: role === 'Admin' ? '#4338ca' : role === 'Leader' ? '#065f46' : '#9a3412'
});

const statusText = (status) => ({
    fontSize: '11px', fontWeight: 'bold', color: status === 'Completed' ? '#10b981' : '#f59e0b'
});

const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px', fontWeight: 'bold', color: '#444' };

export default AdminDashboard;