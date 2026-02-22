import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [teamMates, setTeamMates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 
    const [files, setFiles] = useState({}); 
    const [notes, setNotes] = useState({}); 
    
    const userEmail = localStorage.getItem('username'); 
    const displayName = userEmail ? userEmail.split('@')[0] : "Member";

    const fetchDashboardData = async () => {
        if (!userEmail) {
            setLoading(false);
            return;
        }
        try {
            const res = await API.get(`/tasks/member/${userEmail}`);
            setTasks(res.data);

            if (res.data.length > 0) {
                const leaderEmail = res.data[0].leaderEmail;
                const teamRes = await API.get(`/tasks/leader/${leaderEmail}`);
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
            fetchDashboardData(); 
        } catch (err) {
            alert("❌ Submission failed: " + (err.response?.data?.message || "Server Error"));
        } finally {
            setUploadingId(null);
        }
    };

    // --- Status Badge Helper ---
    const getBadgeStyle = (status) => {
        let colors = { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
        if (status === 'Completed') colors = { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' };
        if (status === 'Submitted') colors = { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' };
        if (status === 'Active') colors = { bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' };

        return {
            fontSize: '11px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px',
            backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}`
        };
    };

    return (
        <div style={pageStyle}>
            {/* --- LEFT SIDE: PROJECT & TEAM --- */}
            <div style={sidebarStyle}>
                <div style={infoCard}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b'}}>🚀 Project Info</h3>
                    <p style={infoText}><b>Leader:</b> <br/>{tasks.length > 0 ? tasks[0].leaderEmail : "Not Assigned"}</p>
                    <p style={infoText}><b>Tasks:</b> {tasks.length}</p>
                </div>

                <div style={infoCard}>
                    <h3 style={{margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b'}}>👥 Team Mates</h3>
                    {teamMates.length > 0 ? teamMates.map((mate, idx) => (
                        <div key={idx} style={mateItem}>
                            <div style={avatarStyle}>{mate[0].toUpperCase()}</div>
                            <span style={{fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis'}}>{mate}</span>
                        </div>
                    )) : <p style={{fontSize: '12px', color: '#94a3b8'}}>Solo Mission ⚡</p>}
                </div>
            </div>

            {/* --- RIGHT SIDE: MAIN CONTENT --- */}
            <div style={mainContent}>
                <div style={headerSection}>
                    <h2 style={{margin: 0, color: '#0f172a'}}>Hello, {displayName}! 👋</h2>
                    <p style={{fontSize: '14px', color: '#64748b'}}>Track your progress and submit work below.</p>
                </div>

                {loading ? (
                    <div style={noDataBox}>🔄 Loading Tasks...</div>
                ) : (
                    <div style={taskList}>
                        {tasks.length > 0 ? tasks.map(task => {
                            // Logic for visual notification border
                            const isRejected = task.status === 'Active' && task.feedback;
                            const isCompleted = task.status === 'Completed';

                            return (
                                <div key={task._id} style={{
                                    ...taskItem,
                                    borderTop: isCompleted ? '6px solid #10b981' : isRejected ? '6px solid #ef4444' : '1px solid #e2e8f0'
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                                        <h4 style={taskTitle}>{task.title}</h4>
                                        <span style={getBadgeStyle(task.status)}>{task.status}</span>
                                    </div>
                                    
                                    <p style={deadlineStyle}>📅 Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                                    <p style={{fontSize: '13px', color: '#475569', lineHeight: '1.5'}}>{task.description}</p>

                                    {/* ✅ Leader's Notification / Feedback Section */}
                                    {task.feedback && (
                                        <div style={{
                                            marginTop: '15px', padding: '12px', borderRadius: '8px', fontSize: '13px',
                                            backgroundColor: isCompleted ? '#f0fdf4' : '#fef2f2',
                                            borderLeft: isCompleted ? '4px solid #166534' : '4px solid #991b1b',
                                            color: isCompleted ? '#166534' : '#991b1b'
                                        }}>
                                            <b>💬 Leader's Note:</b> {task.feedback}
                                        </div>
                                    )}

                                    {/* Submission Logic */}
                                    {task.status === 'Active' ? (
                                        <div style={submissionArea}>
                                            <input 
                                                type="text" 
                                                placeholder="Write a message for your leader..." 
                                                style={noteInput}
                                                onChange={(e) => setNotes({...notes, [task._id]: e.target.value})}
                                            />
                                            <div style={fileRow}>
                                                <input 
                                                    type="file" 
                                                    style={{fontSize: '11px', width: '60%'}} 
                                                    onChange={(e) => setFiles({...files, [task._id]: e.target.files[0]})}
                                                />
                                                <button 
                                                    onClick={() => handleSubmitWork(task._id)}
                                                    disabled={uploadingId === task._id}
                                                    style={{...submitBtn, backgroundColor: uploadingId === task._id ? '#94a3b8' : '#2563eb'}}
                                                >
                                                    {uploadingId === task._id ? 'Uploading...' : 'Submit Work'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{...successBox, backgroundColor: isCompleted ? '#dcfce7' : '#f0f9ff', color: isCompleted ? '#166534' : '#0369a1'}}>
                                            {isCompleted ? '🎉 Task Completed & Approved' : '⏳ Waiting for Leader Review'}
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div style={noDataBox}>
                                <h3>No Tasks Assigned 😴</h3>
                                <p>Relax! When your leader assigns something, it will pop up here.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Styles (CSS-in-JS) ---
const pageStyle = { display: 'flex', gap: '30px', padding: '40px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: '"Inter", sans-serif' };
const sidebarStyle = { width: '280px', display: 'flex', flexDirection: 'column', gap: '20px' };
const mainContent = { flex: 1, display: 'flex', flexDirection: 'column', gap: '25px' };
const infoCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const infoText = { fontSize: '13px', margin: '10px 0', color: '#64748b', lineHeight: '1.4' };
const mateItem = { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' };
const avatarStyle = { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' };
const headerSection = { borderBottom: '2px solid #e2e8f0', paddingBottom: '15px' };
const taskList = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' };
const taskItem = { backgroundColor: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' };
const taskTitle = { margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' };
const deadlineStyle = { fontSize: '12px', color: '#ef4444', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' };
const submissionArea = { borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' };
const noteInput = { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', backgroundColor: '#f9fafb' };
const fileRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const submitBtn = { color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', transition: '0.3s' };
const successBox = { textAlign: 'center', padding: '15px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', marginTop: '20px' };
const noDataBox = { gridColumn: '1 / -1', textAlign: 'center', padding: '80px', color: '#94a3b8', backgroundColor: '#fff', borderRadius: '20px', border: '3px dashed #e2e8f0' };

export default MemberDashboard;