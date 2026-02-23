import React, { useState, useEffect } from 'react';
import API from '../api/axios';

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

    useEffect(() => {
        fetchDashboardData();
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
            alert("✅ Work submitted! Leader dashboard updated.");
            fetchDashboardData();
        } catch (err) {
            alert("❌ Submission failed.");
        } finally {
            setUploadingId(null);
        }
    };

    // --- 📏 Alignment Optimized Styles ---
    const pageWrapper = { 
        backgroundColor: '#f1f5f9', 
        minHeight: '100vh', 
        width: '100vw',        // Fixed: Purn screen width
        margin: 0,
        padding: 0,
        boxSizing: 'border-box',
        fontFamily: '"Inter", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',  // Centers the main layout
        overflowX: 'hidden'
    };

    const mainLayout = { 
        display: 'flex', 
        width: '100%', 
        maxWidth: '1400px',    // Admin dashboard sarkhi width
        padding: '40px', 
        gap: '30px',
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
        flexGrow: 1, 
        maxWidth: '100%' 
    };
    
    const cardBase = { backgroundColor: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
    
    const taskCardStyle = (isCompleted, isOverdue) => ({
        backgroundColor: '#fff', 
        padding: '35px', 
        borderRadius: '24px', 
        marginBottom: '30px', 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', 
        borderLeft: isCompleted ? '12px solid #10b981' : isOverdue ? '12px solid #ef4444' : '12px solid #2563eb',
        transition: '0.3s'
    });

    return (
        <div style={pageWrapper}>
            <div style={mainLayout}>
                
                {/* 🛡️ Sidebar (Left) */}
                <div style={sidebar}>
                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 15px 0', fontSize: '20px', color: '#1e293b'}}>🚀 My Status</h3>
                        <p style={{fontSize: '15px', color: '#64748b', marginBottom: '8px'}}><b>Tasks Assigned:</b> {tasks.length}</p>
                        <p style={{fontSize: '13px', color: '#94a3b8'}}>Leader: <b style={{color: '#2563eb'}}>{tasks.length > 0 ? tasks[0].leaderEmail : "Not Assigned"}</b></p>
                    </div>

                    <div style={cardBase}>
                        <h3 style={{margin: '0 0 20px 0', fontSize: '20px', color: '#1e293b'}}>👥 Team Mates</h3>
                        {teamMates.length > 0 ? teamMates.map((mate, idx) => (
                            <div key={idx} style={{display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f8fafc'}}>
                                <div style={{width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'}}>{mate[0].toUpperCase()}</div>
                                <span style={{fontSize: '14px', color: '#475569', fontWeight: '500'}}>{mate}</span>
                            </div>
                        )) : <p style={{fontSize: '13px', color: '#94a3b8'}}>Solo Mission ⚡</p>}
                    </div>
                </div>

                {/* 📝 Main Dashboard (Right) */}
                <div style={contentArea}>
                    <div style={{marginBottom: '40px'}}>
                        <h1 style={{margin: 0, color: '#0f172a', fontSize: '36px', fontWeight: '800'}}>Welcome, {displayName}! 👋</h1>
                        <p style={{color: '#64748b', fontSize: '18px', marginTop: '5px'}}>Here is your real-time task progress.</p>
                    </div>

                    {loading ? <div style={{textAlign: 'center', padding: '50px'}}>🔄 Syncing tasks...</div> : (
                        tasks.length > 0 ? tasks.map(task => {
                            const progress = calculateProgress(task.createdAt, task.deadline);
                            const isOverdue = progress === 100 && task.status !== 'Completed';
                            const isCompleted = task.status === 'Completed' || task.status === 'Done';

                            return (
                                <div key={task._id} style={taskCardStyle(isCompleted, isOverdue)}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                        <div>
                                            <h2 style={{margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: '700'}}>{task.title}</h2>
                                            <p style={{fontSize: '14px', color: isOverdue ? '#ef4444' : '#64748b', fontWeight: '700', marginTop: '8px'}}>
                                                📅 DEADLINE: {new Date(task.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span style={{
                                            padding: '10px 20px', borderRadius: '12px', fontSize: '12px', fontWeight: '800',
                                            backgroundColor: isCompleted ? '#dcfce7' : '#e0f2fe',
                                            color: isCompleted ? '#166534' : '#0369a1',
                                            textTransform: 'uppercase', letterSpacing: '1px'
                                        }}>{task.status}</span>
                                    </div>

                                    {/* 📊 Progress Bar */}
                                    <div style={{margin: '30px 0'}}>
                                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', marginBottom: '10px'}}>
                                            <span>Time Elapsed</span>
                                            <span style={{fontWeight: 'bold'}}>{progress}%</span>
                                        </div>
                                        <div style={{width: '100%', height: '12px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden'}}>
                                            <div style={{
                                                width: `${progress}%`, height: '100%', 
                                                backgroundColor: isOverdue ? '#ef4444' : progress > 85 ? '#f59e0b' : '#10b981',
                                                transition: 'width 1s ease-in-out'
                                            }}></div>
                                        </div>
                                    </div>

                                    <p style={{fontSize: '16px', color: '#475569', lineHeight: '1.8', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0'}}>{task.description}</p>

                                    {/* 📤 Submission Section */}
                                    {task.status === 'Active' || task.status === 'Pending' ? (
                                        <div style={{marginTop: '30px', borderTop: '2px dashed #e2e8f0', paddingTop: '25px'}}>
                                            <input 
                                                type="text" 
                                                placeholder="Link or Note for leader..." 
                                                style={{width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '15px', boxSizing: 'border-box'}}
                                                onChange={(e) => setNotes({...notes, [task._id]: e.target.value})}
                                            />
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '15px'}}>
                                                <input type="file" onChange={(e) => setFiles({...files, [task._id]: e.target.files[0]})} />
                                                <button 
                                                    onClick={() => handleSubmitWork(task._id)}
                                                    disabled={uploadingId === task._id}
                                                    style={{
                                                        backgroundColor: uploadingId === task._id ? '#94a3b8' : '#2563eb',
                                                        color: '#fff', border: 'none', padding: '15px 35px', borderRadius: '12px',
                                                        cursor: 'pointer', fontWeight: '800', fontSize: '15px', transition: '0.2s'
                                                    }}
                                                >
                                                    {uploadingId === task._id ? 'Submitting...' : 'Submit Work'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{marginTop: '30px', textAlign: 'center', padding: '20px', backgroundColor: isCompleted ? '#ecfdf5' : '#fff9eb', borderRadius: '15px', color: isCompleted ? '#065f46' : '#92400e', fontWeight: 'bold', border: '2px solid currentColor'}}>
                                            {isCompleted ? '✅ Task Verified & Completed' : '⏳ Waiting for Leader Review'}
                                        </div>
                                    )}
                                </div>
                            )
                        }) : (
                            <div style={{textAlign: 'center', padding: '100px', backgroundColor: '#fff', borderRadius: '30px', border: '4px dashed #e2e8f0'}}>
                                <h2 style={{color: '#94a3b8', fontSize: '24px'}}>No Tasks Assigned 🧐</h2>
                                <p style={{color: '#cbd5e1'}}>Relax! When your leader assigns something, it will pop up here.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;