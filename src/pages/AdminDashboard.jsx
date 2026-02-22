import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null); // Modal sathi

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

    // ✅ TEAM-WISE ANALYTICS LOGIC (Efficiency Calculation)
    const leaders = users.filter(u => u.role === 'Leader');
    const teamAnalytics = leaders.map(leader => {
        const teamTasks = tasks.filter(t => t.leaderEmail === leader.email);
        const completed = teamTasks.filter(t => t.status === 'Completed').length;
        const total = teamTasks.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            leaderName: leader.username,
            leaderEmail: leader.email,
            percentage,
            total,
            completed,
            pending: total - completed,
            tasks: teamTasks,
            chartData: [
                { name: 'Done', value: completed },
                { name: 'Pending', value: total - completed }
            ]
        };
    });

    const COLORS = ['#10b981', '#f59e0b']; // Green & Orange colors for chart

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

    // Filter logic for Global Activities
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
                        <input 
                            type="text" 
                            placeholder="Search tasks or members..." 
                            style={searchField}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button onClick={handleResetDatabase} style={resetBtnStyle}>Reset DB 💣</button>
                    </div>
                </div>

                {/* --- DASHBOARD TAB (Charts + Global List) --- */}
                {activeTab === 'dashboard' && (
                    <>
                        <h3 style={{marginBottom: '15px'}}>Team Performance (Click cards to Evaluate)</h3>
                        <div style={teamGrid}>
                            {teamAnalytics.map((team, index) => (
                                <div key={index} style={teamCard} onClick={() => setSelectedTeam(team)}>
                                    <h4 style={{margin: '0 0 10px 0'}}>{team.leaderName}</h4>
                                    <div style={{ height: '100px' }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={team.chartData} innerRadius={30} outerRadius={45} paddingAngle={5} dataKey="value">
                                                    {team.chartData.map((entry, i) => (
                                                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div style={{textAlign: 'center', marginTop: '5px'}}>
                                        <span style={{fontSize: '16px', fontWeight: 'bold', color: '#10b981'}}>{team.percentage}% Done</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={cardWrapper}>
                            <h3 style={cardTitle}>Recent Global Activities</h3>
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
                            </div>
                        </div>
                    </>
                )}

                {/* --- USERS LIST TAB --- */}
                {activeTab === 'users' && (
                    <div style={cardWrapper}>
                        <h3 style={cardTitle}>Grouped Team Structure</h3>
                        {leaders.map(leader => (
                            <div key={leader._id} style={teamBox}>
                                <div style={teamHeader}>
                                    <strong>Leader: {leader.username} ({leader.email})</strong>
                                    <button onClick={() => handleDeleteUser(leader.email)} style={delBtn}>Remove Leader</button>
                                </div>
                                <div style={{paddingLeft: '15px'}}>
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

                {/* --- EVALUATION MODAL (Pop-up on Click) --- */}
                {selectedTeam && (
                    <div style={modalOverlay} onClick={() => setSelectedTeam(null)}>
                        <div style={modalContent} onClick={e => e.stopPropagation()}>
                            <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                                <h2>Evaluation: {selectedTeam.leaderName}'s Team</h2>
                                <button onClick={() => setSelectedTeam(null)} style={{cursor: 'pointer', border: 'none', background: 'none', fontSize: '20px'}}>✖</button>
                            </div>
                            <div style={{marginTop: '20px'}}>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr style={{background: '#f8f9fa'}}>
                                            <th style={thStyle}>Member Email</th>
                                            <th style={thStyle}>Task</th>
                                            <th style={thStyle}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTeam.tasks.map((t, i) => (
                                            <tr key={i}>
                                                <td style={tdStyle}>{t.assignedTo}</td>
                                                <td style={tdStyle}>{t.title}</td>
                                                <td style={tdStyle}><span style={statusBadge(t.status)}>{t.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- CSS STYLES ---
const containerStyle = { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f4f7fe', overflow: 'hidden' };
const sidebarStyle = { width: '240px', backgroundColor: '#1e1e2d', padding: '30px 20px', display: 'flex', flexDirection: 'column' };
const navStyle = { flex: 1 };
const navItem = { padding: '12px 15px', color: '#a2a3b7', cursor: 'pointer', marginBottom: '8px', borderRadius: '8px' };
const navItemActive = { ...navItem, backgroundColor: '#2b2b40', color: '#fff', fontWeight: 'bold' };
const mainContentStyle = { flex: 1, padding: '30px', overflowY: 'auto' };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const searchField = { padding: '10px 15px', borderRadius: '8px', border: '1px solid #ddd', width: '250px' };
const resetBtnStyle = { backgroundColor: '#ff4d4d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const teamGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px', marginBottom: '30px' };
const teamCard = { backgroundColor: '#fff', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', cursor: 'pointer', textAlign: 'center' };
const cardWrapper = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px' };
const cardTitle = { marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' };
const scrollArea = { maxHeight: '350px', overflowY: 'auto' };
const taskItem = { padding: '12px 0', borderBottom: '1px solid #f1f1f1' };
const taskMeta = { fontSize: '12px', color: '#777', marginTop: '5px' };
const teamBox = { border: '1px solid #eee', borderRadius: '10px', padding: '15px', marginBottom: '15px' };
const teamHeader = { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' };
const memberItem = { display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '5px', marginBottom: '5px', fontSize: '13px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '10px', fontSize: '13px', color: '#666' };
const tdStyle = { padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px' };
const delBtn = { color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' };
const delBtnSmall = { ...delBtn, fontSize: '11px' };
const statusBadge = (s) => ({ padding: '3px 7px', borderRadius: '5px', fontSize: '10px', fontWeight: 'bold', backgroundColor: s === 'Completed' ? '#d1fae5' : '#fef3c7', color: s === 'Completed' ? '#065f46' : '#92400e' });
const logoutBtnSide = { backgroundColor: '#333', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', marginTop: 'auto' };
const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: 'bold' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { background: '#fff', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '700px' };

export default AdminDashboard;