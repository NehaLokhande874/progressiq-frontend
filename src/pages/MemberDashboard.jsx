import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [teamMates, setTeamMates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 
    const [files, setFiles] = useState({}); 
    const [notes, setNotes] = useState({}); 
    
    // ✅ Strong User Mapping
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const userEmail = user.email || localStorage.getItem('email') || localStorage.getItem('username'); 
    const displayName = user.username || (userEmail ? userEmail.split('@')[0] : "Member");

    const fetchDashboardData = async () => {
        if (!userEmail) {
            setLoading(false);
            return;
        }
        try {
            // 1. Swatache tasks fetch karne
            const res = await API.get(`/tasks/member/${userEmail}`);
            const memberTasks = Array.isArray(res.data) ? res.data : [];
            setTasks(memberTasks);

            // 2. Team mates fetch karne (Real-time sync)
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

    useEffect(() => {
        fetchDashboardData();
    }, [userEmail]);

    // ✅ Deadline Progress Calculation Logic
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
            alert("❌ Submission failed: " + (err.response?.data?.message || "Server Error"));
        } finally {
            setUploadingId(null);
        }
    };

    // --- Modern Styles (Professional Centered Alignment) ---
    const pageWrapper = { 
        display: 'flex', 
        justifyContent: 'center', // Center Alignment Fix
        backgroundColor: '#f8fafc', 
        minHeight: '100vh', 
        padding: '40px 20px',
        fontFamily: '"Inter", sans-serif'
    };

    const mainLayout = { 
        width: '100%', 
        maxWidth: '1200px', // Content restricts to professional width
        display: 'flex', 
        gap: '30px' 
    };

    const sidebar = { width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' };
    const contentArea = { flex: 1 };
    
    const cardBase = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
    const taskCard = { 
        backgroundColor: '#fff', 
        padding: '25px', 
        borderRadius: '20px', 
        marginBottom: '25px', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.04)', 
        border: '1px solid #f1f5f9',
        position: 'relative'
    };

    const progressBarContainer = { width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '10px' };
    
    const submitBtnStyle = (isUploading) => ({
        backgroundColor: isUploading ? '#94a3b8' : '#2563eb',
        color: '#fff',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '10px',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: '0.3s'
    });

    return (
        <div style={pageWrapper}>
            <div style={mainLayout}>
                
                {/* 🛡️ Left Sidebar (Info & Team) */}
                <div style={sidebar}>
                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b'}}>🚀 My Status</h3>
                        <p style={{fontSize: '14px', color: '#64748b', margin: '5px 0'}}><b>Tasks Assigned:</b> {tasks.length}</p>
                        <p style={{fontSize: '12px', color: '#94a3b8'}}>Leader: {tasks.length > 0 ? tasks[0].leaderEmail : "N/A"}</p>
                    </div>

                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 15px 0', fontSize: '18px', color: '#1e293b'}}>👥 Team Mates</h3>
                        {teamMates.length > 0 ? teamMates.map((mate, idx) => (
                            <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f8fafc'}}>
                                <div style={{width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'}}>{mate[0].toUpperCase()}</div>
                                <span style={{fontSize: '13px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{mate}</span>
                            </div>
                        )) : <p style={{fontSize: '12px', color: '#94a3b8'}}>Working Solo ⚡</p>}
                    </div>
                </div>

                {/* 📝 Main Dashboard Area */}
                <div style={contentArea}>
                    <div style={{marginBottom: '30px'}}>
                        <h2 style={{margin: 0, color: '#0f172a'}}>Welcome, {displayName}! 👋</h2>
                        <p style={{color: '#64748b', margin: '5px 0'}}>Here is your real-time task progress.</p>
                    </div>

                    {loading ? <div style={{textAlign: 'center', padding: '50px'}}>🔄 Syncing with Server...</div> : (
                        tasks.length > 0 ? tasks.map(task => {
                            const progress = calculateProgress(task.createdAt, task.deadline);
                            const isOverdue = progress === 100 && task.status !== 'Completed';
                            const isCompleted = task.status === 'Completed' || task.status === 'Done';

                            return (
                                <div key={task._id} style={{
                                    ...taskCard,
                                    borderLeft: isCompleted ? '8px solid #10b981' : isOverdue ? '8px solid #ef4444' : '8px solid #2563eb'
                                }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                        <div>
                                            <h4 style={{margin: 0, fontSize: '20px', color: '#1e293b'}}>{task.title}</h4>
                                            <p style={{fontSize: '12px', color: isOverdue ? '#ef4444' : '#64748b', margin: '5px 0', fontWeight: '600'}}>
                                                📅 DEADLINE: {new Date(task.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span style={{
                                            padding: '5px 15px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
                                            backgroundColor: isCompleted ? '#dcfce7' : '#e0f2fe',
                                            color: isCompleted ? '#166534' : '#0369a1'
                                        }}>{task.status}</span>
                                    </div>

                                    {/* 📊 Progress Bar Feature */}
                                    <div style={{margin: '20px 0'}}>
                                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '5px'}}>
                                            <span>Time Elapsed</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div style={progressBarContainer}>
                                            <div style={{
                                                width: `${progress}%`, height: '100%', 
                                                backgroundColor: isOverdue ? '#ef4444' : progress > 80 ? '#f59e0b' : '#10b981',
                                                transition: 'width 0.5s ease-in-out'
                                            }}></div>
                                        </div>
                                    </div>

                                    <p style={{fontSize: '14px', color: '#475569', lineHeight: '1.6'}}>{task.description}</p>

                                    {/* 💬 Leader Feedback Section */}
                                    {task.feedback && (
                                        <div style={{marginTop: '15px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '10px', borderLeft: '4px solid #0369a1'}}>
                                            <small style={{color: '#0369a1'}}><b>Leader's Note:</b> {task.feedback}</small>
                                        </div>
                                    )}

                                    {/* 📤 Submission Area */}
                                    {task.status === 'Active' || task.status === 'Pending' ? (
                                        <div style={{marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '20px'}}>
                                            <input 
                                                type="text" 
                                                placeholder="Link or Note for leader..." 
                                                style={{padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px'}}
                                                onChange={(e) => setNotes({...notes, [task._id]: e.target.value})}
                                            />
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                <input type="file" onChange={(e) => setFiles({...files, [task._id]: e.target.files[0]})} style={{fontSize: '12px'}} />
                                                <button 
                                                    onClick={() => handleSubmitWork(task._id)}
                                                    disabled={uploadingId === task._id}
                                                    style={submitBtnStyle(uploadingId === task._id)}
                                                >
                                                    {uploadingId === task._id ? 'Uploading...' : 'Submit Work'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{marginTop: '20px', textAlign: 'center', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '10px', color: '#166534', fontWeight: 'bold'}}>
                                            {isCompleted ? '🎉 Task Completed' : '⏳ Under Review'}
                                        </div>
                                    )}
                                </div>
                            )
                        }) : (
                            <div style={{textAlign: 'center', padding: '100px', backgroundColor: '#fff', borderRadius: '20px', border: '2px dashed #e2e8f0'}}>
                                <h3>No Tasks Assigned Yet 😴</h3>
                                <p>Relax! When your leader assigns a task, it will appear here in real-time.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;