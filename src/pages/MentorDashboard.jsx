import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const MentorDashboard = () => {
    const [groupedTasks, setGroupedTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const username = localStorage.getItem('username') || "Mentor";
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                // Backend madhun saglya teams cha data ghene
                const res = await API.get('/tasks/all'); 
                const allTasks = Array.isArray(res.data) ? res.data : [];

                // 📂 Leader nusar tasks group karnyaacha logic
                const groups = allTasks.reduce((acc, task) => {
                    const leader = task.leaderEmail || "Independent Projects";
                    if (!acc[leader]) acc[leader] = [];
                    acc[leader].push(task);
                    return acc;
                }, {});

                setGroupedTasks(groups);
            } catch (err) {
                console.error("Data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // --- 📏 Premium Mentor Layout Styles ---
    const pageWrapper = {
        backgroundColor: '#f1f5f9',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: '40px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        boxSizing: 'border-box',
        overflowX: 'hidden'
    };

    const contentBox = {
        width: '90%',
        maxWidth: '1400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px'
    };

    const groupCard = {
        backgroundColor: '#fff',
        borderRadius: '28px',
        padding: '35px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        width: '100%',
        boxSizing: 'border-box'
    };

    const statusBadge = (s) => {
        const colors = {
            'Completed': { bg: '#dcfce7', text: '#166534' },
            'Submitted': { bg: '#e0f2fe', text: '#0369a1' },
            'Active': { bg: '#fff7ed', text: '#9a3412' }
        };
        const style = colors[s] || { bg: '#f1f5f9', text: '#475569' };
        return { padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', backgroundColor: style.bg, color: style.text };
    };

    if (loading) return <div style={pageWrapper}>🔄 Syncing Global Team Data...</div>;

    return (
        <div style={pageWrapper}>
            <div style={contentBox}>
                
                {/* 🎓 Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '30px 45px', borderRadius: '28px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '32px', fontWeight: '800' }}>Mentor Console 🎓</h1>
                        <p style={{ color: '#64748b', margin: '5px 0 0 0', fontSize: '18px' }}>Tracking performance for <b>Prof. {username}</b></p>
                    </div>
                    <button onClick={handleLogout} style={{ background: '#fff', color: '#ef4444', border: '2px solid #fee2e2', padding: '12px 24px', borderRadius: '15px', cursor: 'pointer', fontWeight: '700' }}>Logout</button>
                </div>

                {/* 📂 Group-wise Team Display */}
                {Object.keys(groupedTasks).length > 0 ? Object.keys(groupedTasks).map((leader) => (
                    <div key={leader} style={groupCard}>
                        {/* Leader Title Area */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #f1f5f9' }}>
                            <div style={{ background: '#2563eb', color: '#fff', padding: '10px', borderRadius: '12px' }}>🚩</div>
                            <h2 style={{ margin: 0, fontSize: '22px', color: '#1e293b' }}>
                                Team Leader: <span style={{ color: '#2563eb' }}>{leader}</span>
                            </h2>
                        </div>

                        {/* Team Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: '#94a3b8', fontSize: '14px', fontWeight: '700' }}>
                                        <th style={{ padding: '0 20px' }}>ASSIGNED MEMBER</th>
                                        <th style={{ padding: '0 20px' }}>TASK TITLE</th>
                                        <th style={{ padding: '0 20px' }}>STATUS</th>
                                        <th style={{ padding: '0 20px', textAlign: 'right' }}>ANALYSIS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedTasks[leader].map((task) => (
                                        <tr key={task._id} style={{ backgroundColor: '#f8fafc', transition: '0.3s' }}>
                                            <td style={{ padding: '20px', borderRadius: '18px 0 0 18px', fontWeight: '700', color: '#334155' }}>{task.assignedTo}</td>
                                            <td style={{ padding: '20px', color: '#475569' }}>{task.title}</td>
                                            <td style={{ padding: '20px' }}><span style={statusBadge(task.status)}>{task.status}</span></td>
                                            <td style={{ padding: '20px', textAlign: 'right', borderRadius: '0 18px 18px 0' }}>
                                                <button 
                                                    onClick={() => navigate(`/member-details/${task.assignedTo}`)}
                                                    style={{ background: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 10px rgba(5, 150, 105, 0.2)' }}
                                                >
                                                    Review & Guide 💡
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )) : (
                    <div style={{ ...groupCard, textAlign: 'center', color: '#64748b', fontSize: '18px' }}>
                        No project data available to monitor.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorDashboard;