import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [teamMates, setTeamMates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 
    const [files, setFiles] = useState({}); 
    const [notes, setNotes] = useState({}); 
    
    // ✅ IMPORTANT: Login madhe apan email 'username' key madhe save kela aahe
    const userEmail = localStorage.getItem('username'); 
    const displayName = userEmail ? userEmail.split('@')[0] : "Member";

    const fetchDashboardData = async () => {
        if (!userEmail) {
            setLoading(false);
            return;
        }
        try {
            // 1. Member che tasks fetch kara
            const res = await API.get(`/tasks/member/${userEmail}`);
            setTasks(res.data);

            // 2. Jar tasks asel, tar Team Mates fetch kara
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

    useEffect(() => {
        fetchDashboardData();
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
            // Data refresh kara mhanje status 'Completed' disel
            fetchDashboardData(); 
        } catch (err) {
            alert("❌ Submission failed: " + (err.response?.data?.message || "Server Error"));
        } finally {
            setUploadingId(null);
        }
    };

    const statusBadge = (status) => {
        const isCompleted = status === 'Completed' || status === 'Submitted';
        return {
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: isCompleted ? '#dcfce7' : '#fff7ed',
            color: isCompleted ? '#166534' : '#9a3412',
            border: isCompleted ? '1px solid #bbf7d0' : '1px solid #fed7aa'
        };
    };

    return (
        <div style={pageStyle}>
            {/* --- LEFT SIDE: PROJECT & TEAM INFO --- */}
            <div style={sidebarStyle}>
                <div style={infoCard}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b'}}>🚀 Project Info</h3>
                    <p style={infoText}><b>Leader Email:</b> <br/>{tasks.length > 0 ? tasks[0].leaderEmail : "Not Assigned"}</p>
                    <p style={infoText}><b>Project Status:</b> {tasks.length > 0 ? "In Progress" : "Waiting for Tasks"}</p>
                </div>

                <div style={infoCard}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b'}}>👥 Team Mates</h3>
                    {teamMates.length > 0 ? teamMates.map((mate, idx) => (
                        <div key={idx} style={mateItem}>
                            <div style={avatarStyle}>{mate[0].toUpperCase()}</div>
                            <span style={{fontSize: '13px', color: '#475569'}}>{mate}</span>
                        </div>
                    )) : <p style={{fontSize: '12px', color: '#94a3b8'}}>Working Solo or Loading...</p>}
                </div>
            </div>

            {/* --- RIGHT SIDE: TASKS --- */}
            <div style={mainContent}>
                <div style={headerSection}>
                    <h2 style={{margin: 0, color: '#0f172a'}}>Welcome, {displayName}! 👋</h2>
                    <p style={{fontSize: '13px', color: '#64748b'}}>Dashboard for {userEmail}</p>
                </div>

                {loading ? (
                    <div style={noDataBox}>Loading your tasks...</div>
                ) : (
                    <div style={taskList}>
                        {tasks.length > 0 ? tasks.map(task => (
                            <div key={task._id} style={taskItem}>
                                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                                    <h4 style={taskTitle}>{task.title || "New Task"}</h4>
                                    <span style={statusBadge(task.status)}>{task.status}</span>
                                </div>
                                <p style={deadlineStyle}>📅 Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                                <p style={{fontSize: '13px', color: '#475569', marginBottom: '15px'}}>{task.description}</p>

                                {task.status !== 'Completed' && task.status !== 'Submitted' ? (
                                    <div style={submissionArea}>
                                        <input 
                                            type="text" 
                                            placeholder="Add a comment for leader..." 
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
                                                style={{...submitBtn, backgroundColor: uploadingId === task._id ? '#94a3b8' : '#2563eb'}}
                                            >
                                                {uploadingId === task._id ? 'Sending...' : 'Submit Work'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={successBox}>✅ Work Submitted Successfully</div>
                                )}
                            </div>
                        )) : (
                            <div style={noDataBox}>
                                <h3>No tasks yet! 😴</h3>
                                <p>When your Leader assigns a task to <b>{userEmail}</b>, it will appear here in real-time.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Styles (Fixed for Clean UI) ---
const pageStyle = { display: 'flex', gap: '30px', padding: '40px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: '"Segoe UI", Roboto, sans-serif' };
const sidebarStyle = { width: '280px', display: 'flex', flexDirection: 'column', gap: '20px' };
const mainContent = { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' };
const infoCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const infoText = { fontSize: '13px', margin: '8px 0', color: '#64748b', wordBreak: 'break-all' };
const mateItem = { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' };
const avatarStyle = { width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' };
const headerSection = { marginBottom: '5px' };
const taskList = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' };
const taskItem = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };
const taskTitle = { margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: '600' };
const deadlineStyle = { fontSize: '12px', color: '#ef4444', marginBottom: '10px', fontWeight: '500' };
const submissionArea = { borderTop: '1px solid #f1f5f9', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' };
const noteInput = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' };
const fileRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' };
const submitBtn = { color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', transition: '0.2s' };
const successBox = { textAlign: 'center', padding: '12px', backgroundColor: '#f0fff4', color: '#166534', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', marginTop: '10px' };
const noDataBox = { gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#64748b', backgroundColor: '#fff', borderRadius: '15px', border: '2px dashed #e2e8f0' };

export default MemberDashboard;