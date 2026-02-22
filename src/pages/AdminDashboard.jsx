import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState(''); // ✅ New: Search sathi

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
        } catch (err) { alert("Reset failed."); }
    };

    const handleDeleteUser = async (email) => {
        if (!window.confirm(`Delete ${email}?`)) return;
        try {
            await API.delete(`/auth/admin/delete-user/${email}`);
            fetchAllData();
        } catch (err) { alert("Error deleting user"); }
    };

    // ✅ New: Filter logic for Search
    const filteredTasks = tasks.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div style={loaderStyle}>Loading Master Panel...</div>;

    return (
        <div style={containerStyle}>
            {/* --- SIDEBAR --- */}
            <div style={sidebarStyle}>
                <h2 style={{ color: '#fff', marginBottom: '40px' }}>IQ Admin</h2>
                <nav style={navStyle}>
                    <div onClick={() => setActiveTab('dashboard')} style={activeTab === 'dashboard' ? navItemActive : navItem}>📊 Dashboard</div>
                    <div onClick={() => setActiveTab('users')} style={activeTab === 'users' ? navItemActive : navItem}>👥 Users List</div>
                    <div onClick={() => setActiveTab('logs')} style={activeTab === 'logs' ? navItemActive : navItem}>📝 Task Logs</div>
                </nav>
                <button onClick={() => { localStorage.clear(); window.location.href = '/' }} style={logoutBtnSide}>Logout 🚪</button>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div style={mainContentStyle}>
                <div style={headerStyle}>
                    <h1>Master Control Panel</h1>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        {/* ✅ New: Search Bar */}
                        <input 
                            type="text" 
                            placeholder="Search tasks or members..." 
                            style={searchField}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button onClick={handleResetDatabase} style={resetBtnStyle}>Reset DB 💣</button>
                    </div>
                </div>

                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'dashboard' && (
                    <>
                        <div style={statsGrid}>
                            <div style={statCard}><p>Total System Tasks</p><h2>{tasks.length}</h2></div>
                            <div style={statCard}><p>Completed</p><h2 style={{color: '#10b981'}}>{tasks.filter(t => t.status === 'Completed').length}</h2></div>
                            <div style={statCard}><p>Active/Pending</p><h2 style={{color: '#f59e0b'}}>{tasks.filter(t => t.status !== 'Completed').length}</h2></div>
                        </div>

                        <div style={cardWrapper}>
                            <h3 style={cardTitle}>Global Task Monitor</h3>
                            <div style={scrollArea}>
                                {filteredTasks.map(t => (
                                    <div key={t._id} style={taskItem}>
                                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                            <strong>{t.title}</strong>
                                            <span style={statusBadge(t.status)}>{t.status}</span>
                                        </div>
                                        <p style={taskMeta}>Leader: {t.leaderEmail} ➡️ Member: {t.assignedTo}</p>
                                    </div>
                                ))}
                                {filteredTasks.length === 0 && <p style={{textAlign: 'center', color: '#999'}}>No data found.</p>}
                            </div>
                        </div>
                    </>
                )}

                {/* --- USERS LIST TAB --- */}
                {activeTab === 'users' && (
                    <div style={cardWrapper}>
                        <h3 style={cardTitle}>Team Structure (Grouped)</h3>
                        {users.filter(u => u.role === 'Leader').map(leader => (
                            <div key={leader._id} style={teamBox}>
                                <div style={teamHeader}>
                                    <strong>Leader: {leader.username} ({leader.email})</strong>
                                    <button onClick={() => handleDeleteUser(leader.email)} style={delBtn}>Remove Leader</button>
                                </div>
                                <div style={{paddingLeft: '15px'}}>
                                    <small style={{color: '#888'}}>Team Members:</small>
                                    {tasks.filter(t => t.leaderEmail === leader.email).map((t, i) => (
                                        <div key={i} style={memberItem}>
                                            <span>👤 {t.assignedTo}</span>
                                            <button onClick={() => handleDeleteUser(t.assignedTo)} style={delBtnSmall}>Remove</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- TASK LOGS TAB --- */}
                {activeTab === 'logs' && (
                    <div style={cardWrapper}>
                        <h3 style={cardTitle}>Full System Logs</h3>
                        <table style={tableStyle}>
                            <thead style={{backgroundColor: '#f8f9fa'}}>
                                <tr>
                                    <th style={thStyle}>Task</th>
                                    <th style={thStyle}>Assigned To</th>
                                    <th style={thStyle}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map(t => (
                                    <tr key={t._id}>
                                        <td style={tdStyle}>{t.title}</td>
                                        <td style={tdStyle}>{t.assignedTo}</td>
                                        <td style={tdStyle}><span style={statusBadge(t.status)}>{t.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STYLES (Properly Aligned) ---
const containerStyle = { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f4f7fe', overflow: 'hidden' };
const sidebarStyle = { width: '240px', backgroundColor: '#1e1e2d', padding: '30px 20px', display: 'flex', flexDirection: 'column' };
const navStyle = { flex: 1 };
const navItem = { padding: '12px 15px', color: '#a2a3b7', cursor: 'pointer', marginBottom: '8px', borderRadius: '8px', transition: '0.3s' };
const navItemActive = { ...navItem, backgroundColor: '#2b2b40', color: '#fff', fontWeight: 'bold' };
const mainContentStyle = { flex: 1, padding: '30px', overflowY: 'auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const searchField = { padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', width: '250px' };
const resetBtnStyle = { backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' };
const statCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const cardWrapper = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const cardTitle = { marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' };
const scrollArea = { maxHeight: '450px', overflowY: 'auto' };
const taskItem = { padding: '15px 0', borderBottom: '1px solid #f1f1f1' };
const taskMeta = { fontSize: '12px', color: '#777', marginTop: '5px' };
const teamBox = { border: '1px solid #eee', borderRadius: '10px', padding: '15px', marginBottom: '15px' };
const teamHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #f9f9f9', paddingBottom: '5px' };
const memberItem = { display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '5px', marginBottom: '5px', fontSize: '13px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '12px', fontSize: '14px', color: '#666' };
const tdStyle = { padding: '12px', borderBottom: '1px solid #eee', fontSize: '14px' };
const delBtn = { color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' };
const delBtnSmall = { ...delBtn, fontSize: '11px' };
const statusBadge = (s) => ({ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', backgroundColor: s === 'Completed' ? '#d1fae5' : '#fef3c7', color: s === 'Completed' ? '#065f46' : '#92400e' });
const logoutBtnSide = { backgroundColor: '#333', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginTop: 'auto' };
const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' };

export default AdminDashboard;