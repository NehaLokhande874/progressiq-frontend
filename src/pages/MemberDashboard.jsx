import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [teamMates, setTeamMates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 
    const [files, setFiles] = useState({}); 
    const [notes, setNotes] = useState({}); 
    
    // ✅ Reliable User Mapping
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

            // 2. Team mates fetch karne (Real-time sync logic)
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

    // ✅ Progress Bar Calculation
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

    // ✅ Real-time Submission to Leader
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
            alert("✅ Work submitted! Leader dashboard updated.");
            fetchDashboardData(); // Refresh to show "Under Review"
        } catch (err) {
            alert("❌ Submission failed: " + (err.response?.data?.message || "Server Error"));
        } finally {
            setUploadingId(null);
        }
    };

    // --- Optimized Styles (Full Screen Utilization) ---
    const pageWrapper = { 
        display: 'flex', 
        backgroundColor: '#f1f5f9', 
        minHeight: '100vh', 
        width: '100%',
        fontFamily: '"Inter", sans-serif'
    };

    const mainLayout = { 
        display: 'flex', 
        width: '100%', 
        padding: '30px', 
        gap: '25px',
        boxSizing: 'border-box'
    };

    const sidebar = { 
        width: '320px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '20px',
        flexShrink: 0 
    };

    const contentArea = { 
        flexGrow: 1, // Utilize purn urleli space
        maxWidth: 'calc(100% - 345px)' 
    };
    
    const cardBase = { backgroundColor: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };
    
    const taskCardStyle = (isCompleted, isOverdue) => ({
        backgroundColor: '#fff', 
        padding: '30px', 
        borderRadius: '20px', 
        marginBottom: '25px', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', 
        borderLeft: isCompleted ? '10px solid #10b981' : isOverdue ? '10px solid #ef4444' : '10px solid #2563eb',
        position: 'relative',
        transition: 'transform 0.2s'
    });

    const progressBarContainer = { width: '100%', height: '10px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '10px' };

    return (
        <div style={pageWrapper}>
            <div style={mainLayout}>
                
                {/* 🛡️ Sidebar (Utilization 25%) */}
                <div style={sidebar}>
                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b'}}>🚀 My Status</h3>
                        <p style={{fontSize: '14px', color: '#64748b'}}><b>Tasks Assigned:</b> {tasks.length}</p>
                        <p style={{fontSize: '12px', color: '#94a3b8'}}>Leader: {tasks.length > 0 ? tasks[0].leaderEmail : "Not Assigned"}</p>
                    </div>

                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 15px 0', fontSize: '18px', color: '#1e293b'}}>👥 Team Mates</h3>
                        {teamMates.length > 0 ? teamMates.map((mate, idx) => (
                            <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f8fafc'}}>
                                <div style={{width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'}}>{mate[0].toUpperCase()}</div>
                                <span style={{fontSize: '13px', color: '#475569'}}>{mate}</span>
                            </div>
                        )) : <p style={{fontSize: '12px', color: '#94a3b8'}}>Solo Mission ⚡</p>}
                    </div>
                </div>

                {/* 📝 Main Dashboard (Utilization 75%) */}
                <div style={contentArea}>
                    <div style={{marginBottom: '35px'}}>
                        <h1 style={{margin: 0, color: '#0f172a', fontSize: '32px'}}>Hello, {displayName}! 👋</h1>
                        <p style={{color: '#64748b', fontSize: '16px'}}>Manage your deadlines and submissions here.</p>
                    </div>

                    {loading ? <div style={{textAlign: 'center', padding: '50px', fontSize: '18px'}}>🔄 Syncing tasks...</div> : (
                        tasks.length > 0 ? tasks.map(task => {
                            const progress = calculateProgress(task.createdAt, task.deadline);
                            const isOverdue = progress === 100 && task.status !== 'Completed';
                            const isCompleted = task.status === 'Completed' || task.status === 'Done';

                            return (
                                <div key={task._id} style={taskCardStyle(isCompleted, isOverdue)}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <div>
                                            <h2 style={{margin: 0, fontSize: '24px', color: '#1e293b'}}>{task.title}</h2>
                                            <p style={{fontSize: '13px', color: isOverdue ? '#ef4444' : '#64748b', fontWeight: '700', marginTop: '5px'}}>
                                                📅 DEADLINE: {new Date(task.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span style={{
                                            padding: '8px 18px', borderRadius: '25px', fontSize: '12px', fontWeight: 'bold',
                                            backgroundColor: isCompleted ? '#dcfce7' : '#e0f2fe',
                                            color: isCompleted ? '#166534' : '#0369a1',
                                            textTransform: 'uppercase'
                                        }}>{task.status}</span>
                                    </div>

                                    {/* 📊 Progress Bar */}
                                    <div style={{margin: '25px 0'}}>
                                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '8px'}}>
                                            <span>Deadline Progress</span>
                                            <span style={{fontWeight: 'bold'}}>{progress}%</span>
                                        </div>
                                        <div style={progressBarContainer}>
                                            <div style={{
                                                width: `${progress}%`, height: '100%', 
                                                backgroundColor: isOverdue ? '#ef4444' : progress > 85 ? '#f59e0b' : '#10b981',
                                                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                            }}></div>
                                        </div>
                                    </div>

                                    <p style={{fontSize: '15px', color: '#475569', lineHeight: '1.7', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px'}}>{task.description}</p>

                                    {/* 📤 Submission Section */}
                                    {task.status === 'Active' || task.status === 'Pending' ? (
                                        <div style={{marginTop: '25px', borderTop: '2px dashed #f1f5f9', paddingTop: '20px'}}>
                                            <div style={{display: 'flex', gap: '15px', marginBottom: '15px'}}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Add a note or link for your leader..." 
                                                    style={{flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1'}}
                                                    onChange={(e) => setNotes({...notes, [task._id]: e.target.value})}
                                                />
                                            </div>
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px'}}>
                                                <input type="file" onChange={(e) => setFiles({...files, [task._id]: e.target.files[0]})} />
                                                <button 
                                                    onClick={() => handleSubmitWork(task._id)}
                                                    disabled={uploadingId === task._id}
                                                    style={{
                                                        backgroundColor: uploadingId === task._id ? '#94a3b8' : '#2563eb',
                                                        color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '10px',
                                                        cursor: 'pointer', fontWeight: 'bold', fontSize: '14px'
                                                    }}
                                                >
                                                    {uploadingId === task._id ? '🚀 Submitting...' : 'Submit Work'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{marginTop: '25px', textAlign: 'center', padding: '18px', backgroundColor: isCompleted ? '#ecfdf5' : '#fff9eb', borderRadius: '12px', color: isCompleted ? '#065f46' : '#92400e', fontWeight: 'bold', border: '1px solid currentColor'}}>
                                            {isCompleted ? '✅ Task Verified & Completed' : '⏳ Submission Received - Waiting for Leader Review'}
                                        </div>
                                    )}
                                </div>
                            )
                        }) : (
                            <div style={{textAlign: 'center', padding: '100px', backgroundColor: '#fff', borderRadius: '25px', border: '3px dashed #e2e8f0'}}>
                                <h2 style={{color: '#94a3b8'}}>No Active Tasks 🎈</h2>
                                <p style={{color: '#cbd5e1'}}>When the leader assigns something, it will appear here in real-time.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;