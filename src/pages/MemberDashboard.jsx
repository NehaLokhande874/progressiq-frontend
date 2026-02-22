import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [teamMates, setTeamMates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 
    const [files, setFiles] = useState({}); 
    const [notes, setNotes] = useState({}); 
    
    const userEmail = localStorage.getItem('email'); 
    const username = localStorage.getItem('username') || "Member";

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!userEmail) return setLoading(false);
            try {
                // 1. Member che tasks fetch kara
                const res = await API.get(`/tasks/member/${userEmail}`);
                setTasks(res.data);

                // 2. Jar tasks asel, tar Team Mates fetch kara (Same Leader asलेले members)
                if (res.data.length > 0) {
                    const leaderEmail = res.data[0].leaderEmail;
                    const teamRes = await API.get(`/tasks/leader/${leaderEmail}`);
                    
                    // Duplicate emails kadhun taka ani swatahla filter kara
                    const uniqueMates = [...new Set(teamRes.data.map(t => t.assignedTo))]
                                        .filter(email => email !== userEmail);
                    setTeamMates(uniqueMates);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [userEmail]);

    const handleSubmitWork = async (taskId) => {
        if (!files[taskId]) return alert("Please select a file first!");
        
        setUploadingId(taskId);
        const formData = new FormData();
        formData.append('workFile', files[taskId]); 
        formData.append('submissionNote', notes[taskId] || "");

        try {
            const res = await API.put(`/tasks/submit-work/${taskId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert("✅ Work submitted successfully!");
            setTasks(tasks.map(t => t._id === taskId ? res.data : t));
        } catch (err) {
            alert("❌ Submission failed: " + (err.response?.data?.message || "Server Error"));
        } finally {
            setUploadingId(null);
        }
    };

    const statusBadge = (status) => {
        const isActive = status === 'Active';
        const isCompleted = status === 'Completed';
        return {
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: (isActive || isCompleted) ? '#dcfce7' : '#fee2e2',
            color: (isActive || isCompleted) ? '#166534' : '#991b1b',
            border: (isActive || isCompleted) ? '1px solid #bbf7d0' : '1px solid #fecaca'
        };
    };

    return (
        <div style={pageStyle}>
            {/* --- LEFT SIDE: PROJECT & TEAM INFO --- */}
            <div style={sidebarStyle}>
                <div style={infoCard}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '18px'}}>🚀 Project Info</h3>
                    <p style={infoText}><b>Project:</b> {tasks.length > 0 ? (tasks[0].projectName || "Ongoing Project") : "No Project"}</p>
                    <p style={infoText}><b>Mentor:</b> {tasks.length > 0 ? tasks[0].leaderEmail : "Not Assigned"}</p>
                </div>

                <div style={infoCard}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '18px'}}>👥 Team Mates</h3>
                    {teamMates.length > 0 ? teamMates.map((mate, idx) => (
                        <div key={idx} style={mateItem}>
                            <div style={avatarStyle}>{mate[0].toUpperCase()}</div>
                            <span style={{fontSize: '13px'}}>{mate}</span>
                        </div>
                    )) : <p style={{fontSize: '12px', color: '#718096'}}>Working Solo</p>}
                </div>
            </div>

            {/* --- RIGHT SIDE: TASKS --- */}
            <div style={mainContent}>
                <div style={headerSection}>
                    <h2 style={{margin: 0}}>Welcome, {username}! 👋</h2>
                    <p style={{fontSize: '13px', color: '#718096'}}>{userEmail}</p>
                </div>

                {loading ? (
                    <p>Loading your tasks...</p>
                ) : (
                    <div style={taskList}>
                        {tasks.length > 0 ? tasks.map(task => (
                            <div key={task._id} style={taskItem}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                                    <h4 style={taskTitle}>{task.title}</h4>
                                    <span style={statusBadge(task.status)}>{task.status}</span>
                                </div>
                                <p style={deadlineStyle}>📅 Deadline: {new Date(task.deadline).toLocaleDateString()}</p>

                                {task.status === 'Active' ? (
                                    <div style={submissionArea}>
                                        <input 
                                            type="text" 
                                            placeholder="Submission note..." 
                                            style={noteInput}
                                            onChange={(e) => setNotes({...notes, [task._id]: e.target.value})}
                                        />
                                        <div style={fileRow}>
                                            <input 
                                                type="file" 
                                                style={{fontSize: '11px'}} 
                                                onChange={(e) => setFiles({...files, [task._id]: e.target.files[0]})}
                                            />
                                            <button 
                                                onClick={() => handleSubmitWork(task._id)}
                                                disabled={uploadingId === task._id}
                                                style={{...submitBtn, backgroundColor: uploadingId === task._id ? '#cbd5e0' : '#2563eb'}}
                                            >
                                                {uploadingId === task._id ? 'Submitting...' : 'Submit Work'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={successBox}>✅ Task Completed & Submitted</div>
                                )}
                            </div>
                        )) : (
                            <div style={noDataBox}>No tasks assigned yet.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Updated Styles ---
const pageStyle = { display: 'flex', gap: '30px', padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' };
const sidebarStyle = { width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' };
const mainContent = { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' };
const infoCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const infoText = { fontSize: '14px', margin: '5px 0', color: '#475569' };
const mateItem = { display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' };
const avatarStyle = { width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' };
const headerSection = { marginBottom: '10px' };
const taskList = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }; // Two column layout for tasks
const taskItem = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const taskTitle = { margin: 0, fontSize: '17px', color: '#1e293b' };
const deadlineStyle = { fontSize: '12px', color: '#64748b', marginBottom: '15px' };
const submissionArea = { borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' };
const noteInput = { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' };
const fileRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const submitBtn = { color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const successBox = { textAlign: 'center', padding: '10px', backgroundColor: '#f0fff4', color: '#166534', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' };
const noDataBox = { textAlign: 'center', padding: '50px', color: '#94a3b8', backgroundColor: '#fff', borderRadius: '15px' };

export default MemberDashboard;