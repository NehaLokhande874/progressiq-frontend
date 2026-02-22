import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await API.get('/auth/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Users fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (email) => {
        if (!window.confirm(`Are you sure you want to delete ${email}? This will also delete their tasks!`)) return;
        try {
            await API.delete(`/auth/admin/delete-user/${email}`);
            alert("User deleted successfully!");
            fetchUsers(); // List refresh kara
        } catch (err) {
            alert("Failed to delete user.");
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Accessing Master Control...</h2>;

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1>Admin Control Center ⚡</h1>
                <button onClick={handleLogout} style={logoutBtnStyle}>Logout</button>
            </div>

            <div style={statsContainer}>
                <div style={statCard}><h3>{users.length}</h3><p>Total Users</p></div>
                <div style={statCard}><h3>{users.filter(u => u.role === 'Leader').length}</h3><p>Leaders</p></div>
                <div style={statCard}><h3>{users.filter(u => u.role === 'Member').length}</h3><p>Members</p></div>
            </div>

            <div style={tableContainer}>
                <h3 style={{ marginBottom: '20px' }}>User Management</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#1a1a1a', color: 'white', textAlign: 'left' }}>
                            <th style={cellStyle}>Username</th>
                            <th style={cellStyle}>Email</th>
                            <th style={cellStyle}>Role</th>
                            <th style={cellStyle}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={cellStyle}>{user.username}</td>
                                <td style={cellStyle}>{user.email}</td>
                                <td style={cellStyle}>
                                    <span style={roleBadge(user.role)}>{user.role}</span>
                                </td>
                                <td style={cellStyle}>
                                    <button 
                                        onClick={() => handleDeleteUser(user.email)}
                                        style={deleteBtnStyle}
                                        disabled={user.role === 'Admin'}
                                    >
                                        Delete User 🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Styles ---
const statsContainer = { display: 'flex', gap: '20px', marginBottom: '30px' };
const statCard = { flex: 1, padding: '20px', backgroundColor: '#fff', borderRadius: '10px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' };
const tableContainer = { backgroundColor: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const cellStyle = { padding: '15px' };
const logoutBtnStyle = { backgroundColor: '#333', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const deleteBtnStyle = { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' };

const roleBadge = (role) => ({
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: role === 'Admin' ? '#7c3aed' : role === 'Leader' ? '#2563eb' : '#059669',
    color: 'white'
});

export default AdminDashboard;