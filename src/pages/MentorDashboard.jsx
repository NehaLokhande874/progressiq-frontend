import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submissionNote, setSubmissionNote] = useState("");
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const memberEmail = user.email || localStorage.getItem('email');
    const memberName = user.username || (memberEmail ? memberEmail.split('@')[0] : "Member");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyTasks = async () => {
            if (!memberEmail) { setLoading(false); return; }
            try {
                const res = await API.get(`/tasks/member/${memberEmail}`);
                setTasks(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyTasks();
    }, [memberEmail]);

    const handleSubmitWork = async (taskId) => {
        if (!submissionNote) return alert("Please add a note or link!");
        try {
            await API.put(`/tasks/submit/${taskId}`, { 
                submissionNote, 
                status: 'Submitted' 
            });
            alert("Work submitted successfully! 🚀");
            window.location.reload();
        } catch (err) { alert("Submission failed."); }
    };

    // --- 📏 Premium Layout Styles ---
    const pageWrapper = {
        backgroundColor: '#f1f5f9',
        minHeight: '100vh',
        width: '100vw',
        margin: 0,
        padding: '40px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Centers everything
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        boxSizing: 'border-box'
    };

    const container = {
        width: '90%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: '320px 1fr', // Sidebar + Main Content
        gap: '30px'
    };

    const cardStyle = {
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '25px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
    };

    if (loading) return <div style={pageWrapper}>🔄 Syncing your tasks...</div>;

    return (
        <div style={pageWrapper}>
            <div style={container}>
                
                {/* ⬅️ Sidebar: Profile & Team */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={cardStyle}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>🚀 My Status</h3>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Tasks Assigned: <b>{tasks.length}</b></p>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>Leader: <span style={{ color: '#2563eb' }}>{tasks[0]?.leaderEmail || 'N/A'}</span></p>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>👥 Team Mates</h3>
                        {/* Placeholder for teammates */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['rushi@gmail.com', 'anjali@gmail.com', 'rahul@gmail.com'].map(email => (
                                <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
                                    <div style={{ width: '30px', height: '30px', background: '#2563eb', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{email[0].toUpperCase()}</div>
                                    {email}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ➡️ Main Content: Greetings & Tasks */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                        <h1 style={{ margin: 0, fontSize: '30px', fontWeight: '800' }}>Welcome, {memberName}! 👋</h1>
                        <button onClick={() => { localStorage.clear(); navigate('/'); }} style={{ background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700' }}>Logout</button>
                    </div>

                    {/* 💡 Mentor Guidance Section (NEW FEATURE) */}
                    {tasks.some(t => t.mentorGuidance) && (
                        <div style={{ ...cardStyle, backgroundColor: '#fffbeb', borderLeft: '8px solid #f59e0b' }}>
                            <h4 style={{ margin: 0, color: '#92400e' }}>💡 Guidance from Mentor</h4>
                            <p style={{ marginTop: '10px', color: '#b45309', fontStyle: 'italic' }}>
                                "{tasks.find(t => t.mentorGuidance)?.mentorGuidance}"
                            </p>
                        </div>
                    )}

                    {/* Task List */}
                    {tasks.length > 0 ? tasks.map((task) => (
                        <div key={task._id} style={{ ...cardStyle, borderLeft: '10px solid #2563eb', padding: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: '#1e293b' }}>{task.title}</h2>
                                    <p style={{ margin: '10px 0', color: '#64748b' }}>📅 DEADLINE: <b>{task.deadline || '3/24/2026'}</b></p>
                                </div>
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{task.status}</span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ margin: '20px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                                    <span>Time Elapsed</span>
                                    <span>{task.status === 'Completed' ? '100%' : '1%'}</span>
                                </div>
                                <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{ width: task.status === 'Completed' ? '100%' : '1%', height: '100%', background: '#10b981' }}></div>
                                </div>
                            </div>

                            {/* Submission Area */}
                            {task.status !== 'Completed' && (
                                <div style={{ marginTop: '20px' }}>
                                    <textarea 
                                        placeholder="Link or Note for leader..."
                                        value={submissionNote}
                                        onChange={(e) => setSubmissionNote(e.target.value)}
                                        style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', resize: 'none', marginBottom: '15px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <input type="file" style={{ fontSize: '14px' }} />
                                        <button 
                                            onClick={() => handleSubmitWork(task._id)}
                                            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}
                                        >
                                            Submit Work
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Feedback */}
                            {task.feedback && (
                                <div style={{ marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <small style={{ color: '#94a3b8' }}>Leader Feedback:</small>
                                    <p style={{ margin: '5px 0 0 0', fontWeight: '600' }}>{task.feedback}</p>
                                </div>
                            )}
                        </div>
                    )) : (
                        <div style={cardStyle}>Relax! No tasks assigned yet. ☕</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;