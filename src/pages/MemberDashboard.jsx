import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import io from 'socket.io-client'; // Socket.io import

// Real-time server connection
const socket = io(process.env.REACT_APP_BACKEND_URL || "http://localhost:5000");

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [teamMates, setTeamMates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 
    const [files, setFiles] = useState({}); 
    const [notes, setNotes] = useState({}); 
    
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const userEmail = user.email || localStorage.getItem('email') || localStorage.getItem('username'); 
    const displayName = user.username || (userEmail ? userEmail.split('@')[0] : "Member");

    const fetchDashboardData = async () => {
        if (!userEmail) { setLoading(false); return; }
        try {
            const res = await API.get(`/tasks/member/${userEmail}`);
            const memberTasks = Array.isArray(res.data) ? res.data : [];
            setTasks(memberTasks);

            if (memberTasks.length > 0) {
                const leaderEmail = memberTasks[0].leaderEmail;
                if (leaderEmail) {
                    const teamRes = await API.get(`/tasks/leader/${leaderEmail}`);
                    const allTeamTasks = Array.isArray(teamRes.data) ? teamRes.data : [];
                    const uniqueMates = [...new Set(allTeamTasks.map(t => t.assignedTo))]
                                        .filter(email => email !== userEmail);
                    setTeamMates(uniqueMates);
                }
            }
        } catch (err) {
            console.error("Dashboard Sync Error:", err);
        } finally {
            setLoading(false);
        }
    };

    // 🚀 Real-time logic: Server kadun update milta-ch data refresh hone
    useEffect(() => {
        fetchDashboardData();

        socket.on("new-task-assigned", (data) => {
            if (data.memberEmail === userEmail) {
                alert("✨ New task assigned to you!");
                fetchDashboardData();
            }
        });

        socket.on("new-guidance", (data) => {
            if (data.memberEmail === userEmail) {
                alert("💡 New guidance from Mentor!");
                fetchDashboardData();
            }
        });

        return () => {
            socket.off("new-task-assigned");
            socket.off("new-guidance");
        };
    }, [userEmail]);

    const calculateProgress = (createdAt, deadline) => {
        const start = new Date(createdAt).getTime();
        const end = new Date(deadline).getTime();
        const now = new Date().getTime();
        if (now >= end) return 100;
        const total = end - start;
        const elapsed = now - start;
        const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
        return Math.round(progress);
    };

    const handleSubmitWork = async (taskId) => {
        if (!files[taskId]) return alert("Please select a file first!");
        setUploadingId(taskId);
        const formData = new FormData();
        formData.append('workFile', files[taskId]); 
        formData.append('submissionNote', notes[taskId] || "");
        try {
            await API.put(`/tasks/submit-work/${taskId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ Work submitted successfully!");
            fetchDashboardData();
        } catch (err) {
            alert("❌ Submission failed.");
        } finally {
            setUploadingId(null);
        }
    };

    // --- Styles (Original Maintained) ---
    const pageWrapper = { backgroundColor: '#f1f5f9', minHeight: '100vh', width: '100vw', margin: 0, padding: 0, boxSizing: 'border-box', fontFamily: '"Inter", sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowX: 'hidden' };
    const mainLayout = { display: 'flex', width: '100%', maxWidth: '1400px', padding: '40px', gap: '30px', boxSizing: 'border-box' };
    const sidebar = { width: '320px', display: 'flex', flexDirection: 'column', gap: '20px', flexShrink: 0 };
    const contentArea = { flexGrow: 1, maxWidth: '100%' };
    const cardBase = { backgroundColor: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
    const taskCardStyle = (isCompleted, isOverdue) => ({ backgroundColor: '#fff', padding: '35px', borderRadius: '24px', marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', borderLeft: isCompleted ? '12px solid #10b981' : isOverdue ? '12px solid #ef4444' : '12px solid #2563eb', transition: '0.3s' });

    return (
        <div style={pageWrapper}>
            <div style={mainLayout}>
                <div style={sidebar}>
                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b'}}>🚀 My Status</h3>
                        <p style={{fontSize: '15px', color: '#64748b'}}><b>Tasks:</b> {tasks.length}</p>
                    </div>
                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b'}}>👥 Team Mates</h3>
                        {teamMates.map((mate, idx) => (
                            <div key={idx} style={{padding: '10px 0'}}>{mate}</div>
                        ))}
                    </div>
                </div>

                <div style={contentArea}>
                    <h1>Welcome, {displayName}! 👋</h1>
                    {loading ? <p>🔄 Syncing...</p> : tasks.map(task => {
                        const progress = calculateProgress(task.createdAt, task.deadline);
                        const isCompleted = task.status === 'Completed';
                        return (
                            <div key={task._id} style={taskCardStyle(isCompleted, false)}>
                                <h2>{task.title}</h2>
                                <p>Status: {task.status}</p>
                                {/* Mentor Guidance Display */}
                                {task.mentorGuidance && (
                                    <div style={{background: '#eff6ff', padding: '15px', borderRadius: '10px', marginTop: '10px'}}>
                                        <b>💡 Guidance:</b> {task.mentorGuidance}
                                    </div>
                                )}
                                {/* Submission inputs remain the same */}
                                <input type="file" onChange={(e) => setFiles({...files, [task._id]: e.target.files[0]})} />
                                <button onClick={() => handleSubmitWork(task._id)}>Submit</button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;