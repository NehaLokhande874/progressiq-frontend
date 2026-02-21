import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const MemberDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState(null); 
    const [files, setFiles] = useState({}); 
    const [notes, setNotes] = useState({}); 
    
    // 💡 Proper Fetch: 'email' vapra mhanje backend shi sync hoil
    const userEmail = localStorage.getItem('email'); 

    useEffect(() => {
        const fetchMyTasks = async () => {
            if (!userEmail) return setLoading(false);
            try {
                const res = await API.get(`/tasks/member/${userEmail}`);
                setTasks(res.data);
            } catch (err) {
                console.error("Error fetching tasks:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyTasks();
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

    return (
        <div style={pageStyle}>
            {/* 💡 Proper Alignment Container: 
                Ha card ata screen chya center la disel */}
            <div style={cardStyle}>
                <h2 style={titleStyle}>📱 Member Dashboard</h2>
                <p style={subTitle}>Logged in as: <b>{userEmail}</b></p>
                
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Loading tasks...</div>
                ) : (
                    <div style={taskList}>
                        {tasks.length > 0 ? tasks.map(task => (
                            <div key={task._id} style={taskItem}>
                                <div style={taskInfo}>
                                    <h4 style={taskTitle}>{task.title}</h4>
                                    <span style={deadlineStyle}>📅 Deadline: {new Date(task.deadline).toLocaleDateString()}</span>
                                    <span style={statusBadge(task.status)}>{task.status}</span>
                                </div>

                                {task.status !== 'Completed' ? (
                                    <div style={submissionArea}>
                                        <input 
                                            type="text" 
                                            placeholder="Add a small note..." 
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
                                                style={{
                                                    ...submitBtn,
                                                    backgroundColor: uploadingId === task._id ? '#cbd5e0' : '#38a169'
                                                }}
                                            >
                                                {uploadingId === task._id ? '...' : 'Submit'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={successBox}>
                                        ✅ Task Completed & Submitted
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div style={noDataBox}>
                                <p style={noDataText}>No tasks assigned yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Corrected Styles for Alignment ---
const pageStyle = { 
    display: 'flex', 
    justifyContent: 'center', // Center horizontal
    alignItems: 'flex-start', // Start from top
    minHeight: '100vh', 
    backgroundColor: '#f4f7f6', 
    padding: '50px 20px' 
};

const cardStyle = { 
    width: '100%', 
    maxWidth: '550px', // Card width limit kela mhanun center disto
    backgroundColor: '#ffffff', 
    borderRadius: '16px', 
    padding: '30px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column'
};

const titleStyle = { margin: '0 0 5px 0', color: '#1a365d', textAlign: 'center', fontSize: '24px' };
const subTitle = { textAlign: 'center', color: '#718096', fontSize: '13px', marginBottom: '30px' };
const taskList = { display: 'flex', flexDirection: 'column', gap: '20px' };

const taskItem = { 
    padding: '20px', 
    borderRadius: '12px', 
    border: '1px solid #edf2f7', 
    backgroundColor: '#fff', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
};

const taskInfo = { borderBottom: '1px solid #f7fafc', paddingBottom: '10px', marginBottom: '15px' };
const taskTitle = { margin: '0 0 5px 0', color: '#2d3748', textTransform: 'capitalize' };
const deadlineStyle = { fontSize: '12px', color: '#a0aec0', display: 'block', marginBottom: '8px' };
const submissionArea = { display: 'flex', flexDirection: 'column', gap: '10px' };

const noteInput = { 
    padding: '10px', 
    borderRadius: '8px', 
    border: '1px solid #e2e8f0', 
    fontSize: '13px', 
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
};

const fileRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

const submitBtn = { 
    color: '#fff', 
    border: 'none', 
    padding: '10px 20px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: '12px' 
};

const successBox = { 
    textAlign: 'center', 
    padding: '12px', 
    backgroundColor: '#f0fff4', 
    color: '#276749', 
    borderRadius: '8px', 
    fontWeight: 'bold', 
    fontSize: '13px' 
};

const noDataBox = { textAlign: 'center', padding: '30px' };
const noDataText = { color: '#a0aec0', fontSize: '14px' };

const statusBadge = (status) => ({
    display: 'inline-block', fontSize: '10px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px',
    backgroundColor: status === 'Completed' ? '#c6f6d5' : '#fff5f5',
    color: status === 'Completed' ? '#22543d' : '#c53030'
});

export default MemberDashboard;