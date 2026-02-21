import React, { useEffect, useState } from 'react';
import API from '../api/axios';

const MentorDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const username = localStorage.getItem('username');

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Mentor la saglya teams cha progress disayla hava
                // Note: Ya sathi backend madhe /api/tasks/all route asne garjeche aahe
                const res = await API.get('/tasks/all'); 
                setTasks(res.data);
            } catch (err) {
                console.error("Data fetch karnyaat error aali:", err);
            }
        };
        fetchAllData();
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Mentor Dashboard</h1>
                <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>
            
            <p>Welcome, <strong>Prof. {username}</strong>! Yethun tumhi sarv teams cha progress monitor karu shakta.</p>
            
            <hr />

            <h3>Overall Project Progress</h3>
            <table border="1" cellPadding="12" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead style={{ backgroundColor: '#0047ff', color: 'white' }}>
                    <tr>
                        <th>Task Name</th>
                        <th>Leader (Team)</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.length > 0 ? (
                        tasks.map((task) => (
                            <tr key={task._id}>
                                <td>{task.title}</td>
                                <td>{task.leaderEmail}</td>
                                <td>{task.assignedTo}</td>
                                <td style={{ fontWeight: 'bold', color: task.status === 'Completed' ? 'green' : 'orange' }}>
                                    {task.status}
                                </td>
                                <td>
                                    <button style={{ cursor: 'pointer' }}>Review</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center' }}>Hallya kontihi data upalabdh nahi.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MentorDashboard;