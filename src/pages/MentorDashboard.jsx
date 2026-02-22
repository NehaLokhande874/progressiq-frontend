import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const MentorDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const username = localStorage.getItem('username');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                // ✅ Mentor la sarv teams cha data milnyasathi backend madhe /all route pahije
                const res = await API.get('/tasks/all'); 
                setTasks(res.data);
            } catch (err) {
                console.error("Data fetch karnyaat error aali:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/'); // Login page var redirect karne
    };

    // Guidance/Review denyasathi functionality
    const handleReview = async (taskId) => {
        const feedback = prompt("Ya task sathi tumche guidance dya:");
        if (!feedback) return;

        try {
            await API.put(`/tasks/add-feedback/${taskId}`, { 
                feedback: `Mentor Guidance: ${feedback}`,
                status: 'Active' // Task parat active kela jyamule member changes karu shakel
            });
            alert("✅ Guidance pathavle aahe!");
            window.location.reload();
        } catch (err) {
            alert("❌ Feedback update failed.");
        }
    };

    if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading All Teams Data...</div>;

    return (
        <div style={{ padding: '30px', fontFamily: '"Inter", sans-serif', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0 }}>Mentor Dashboard 🎓</h1>
                    <p style={{ color: '#666' }}>Welcome, <strong>Prof. {username}</strong>! Monitoring all projects.</p>
                </div>
                <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Logout
                </button>
            </div>
            
            <hr style={{ border: '0.5px solid #ddd', marginBottom: '30px' }} />

            {/* Table Section */}
            <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <h3 style={{ padding: '20px', margin: 0, backgroundColor: '#f1f5f9' }}>Overall Project Progress</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#0047ff', color: 'white', textAlign: 'left' }}>
                            <th style={thStyle}>Task Name</th>
                            <th style={thStyle}>Leader (Team)</th>
                            <th style={thStyle}>Assigned Member</th>
                            <th style={thStyle}>Current Status</th>
                            <th style={thStyle}>Mentor Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <tr key={task._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={tdStyle}>{task.title}</td>
                                    <td style={tdStyle}>{task.leaderEmail}</td>
                                    <td style={tdStyle}>{task.assignedTo}</td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: getStatusColor(task.status) }}>
                                        {task.status}
                                    </td>
                                    <td style={tdStyle}>
                                        <button 
                                            onClick={() => handleReview(task._id)}
                                            style={actionBtnStyle}
                                        >
                                            Review & Guide 💡
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                    Hallya kontihi data upalabdh nahi.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Styling helpers
const thStyle = { padding: '15px' };
const tdStyle = { padding: '15px' };
const actionBtnStyle = { 
    backgroundColor: '#059669', 
    color: 'white', 
    border: 'none', 
    padding: '8px 12px', 
    borderRadius: '4px', 
    cursor: 'pointer',
    fontSize: '13px'
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Completed': return '#059669';
        case 'Submitted': return '#2563eb';
        case 'Active': return '#d97706';
        default: return '#6b7280';
    }
};

export default MentorDashboard;