import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import io from 'socket.io-client';

// ✅ Dynamic URL config for Production
const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ['websocket']
});

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

    // ✅ Real-time Socket Logic
    useEffect(() => {
        fetchDashboardData();

        socket.on("connect", () => console.log("🔗 Socket Connected:", socket.id));

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

    // --- Styles ---
    const pageWrapper = { backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '40px', fontFamily: '"Inter", sans-serif' };
    const taskCardStyle = (isCompleted) => ({ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', marginBottom: '20px', borderLeft: isCompleted ? '10px solid #10b981' : '10px solid #2563eb' });

    return (
        <div style={pageWrapper}>
            <h1>Welcome, {displayName}! 👋</h1>
            {loading ? <p>🔄 Syncing...</p> : tasks.map(task => (
                <div key={task._id} style={taskCardStyle(task.status === 'Completed')}>
                    <h2>{task.title}</h2>
                    <p>Status: {task.status}</p>
                    {task.mentorGuidance && (
                        <div style={{background: '#eff6ff', padding: '10px', borderRadius: '8px'}}>
                            <b>💡 Guidance:</b> {task.mentorGuidance}
                        </div>
                    )}
                    <input type="file" onChange={(e) => setFiles({...files, [task._id]: e.target.files[0]})} />
                    <button onClick={() => handleSubmitWork(task._id)} disabled={uploadingId === task._id}>
                        {uploadingId === task._id ? "Uploading..." : "Submit"}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default MemberDashboard;