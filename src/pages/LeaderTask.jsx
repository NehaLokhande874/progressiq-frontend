import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const LeaderTask = () => {
    const [tasksList, setTasksList] = useState([{ title: '', assignedTo: '', deadline: '' }]);
    const [myTasks, setMyTasks] = useState([]);
    const [inviteLink, setInviteLink] = useState('');
    const [isTaskSaved, setIsTaskSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const leaderEmail = localStorage.getItem('email') || localStorage.getItem('username'); 
    const navigate = useNavigate();

    const fetchTasks = async () => {
        if (!leaderEmail) return;
        try {
            const res = await API.get(`/tasks/leader/${leaderEmail}`);
            setMyTasks(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    useEffect(() => { fetchTasks(); }, [leaderEmail]);

    const addRow = () => setTasksList([...tasksList, { title: '', assignedTo: '', deadline: '' }]);

    const handleInputChange = (index, field, value) => {
        const updatedList = [...tasksList];
        updatedList[index][field] = value;
        setTasksList(updatedList);
    };

    const handleSaveAllTasks = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const tasksWithLeader = tasksList.map(task => ({
                ...task,
                leaderEmail
            }));
            const response = await API.post('/tasks/create-multiple', { 
                tasks: tasksWithLeader, 
                leaderEmail 
            });
            if (response.status === 201) {
                alert("✅ Tasks saved successfully!");
                setIsTaskSaved(true); 
                fetchTasks(); 
                setTasksList([{ title: '', assignedTo: '', deadline: '' }]);
            }
        } catch (err) { 
            console.error(err);
            alert("❌ Save Error! Check if backend is active."); 
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        try {
            const res = await API.post('/tasks/invite', { leaderEmail });
            setInviteLink(res.data.link);
        } catch (err) {
            alert("❌ Link generation failed.");
        }
    };

    const handleRemoveMember = async (memberEmail) => {
        if (window.confirm(`Are you sure you want to remove ${memberEmail}?`)) {
            try {
                await API.delete(`/tasks/remove-member/${encodeURIComponent(memberEmail)}`);
                setMyTasks(myTasks.filter(t => t.assignedTo !== memberEmail));
                alert("🗑️ Removed successfully!");
            } catch (err) {
                alert("❌ Error removing member.");
            }
        }
    };

    return (
        <div style={containerStyle}>
            <div style={wrapperStyle}>
                
                <div style={navHeader}>
                    <button onClick={() => navigate('/leader-dashboard')} style={backBtn}>← Back</button>
                    <h2 style={{ margin: 0, color: '#1a202c' }}>Leader Task Manager</h2>
                </div>

                {/* 1. Assign Tasks */}
                <div style={cardStyle}>
                    <h3 style={sectionTitle}>1. Assign New Tasks</h3>
                    <form onSubmit={handleSaveAllTasks}>
                        {tasksList.map((row, index) => (
                            <div key={index} style={gridRow}>
                                <input type="text" placeholder="Task Title" style={inputStyle} value={row.title} onChange={(e) => handleInputChange(index, 'title', e.target.value)} required />
                                <input type="email" placeholder="Member Email" style={inputStyle} value={row.assignedTo} onChange={(e) => handleInputChange(index, 'assignedTo', e.target.value)} required />
                                <input type="date" style={inputStyle} value={row.deadline} onChange={(e) => handleInputChange(index, 'deadline', e.target.value)} required />
                                {index === tasksList.length - 1 && (
                                    <button type="button" onClick={addRow} style={addBtn}>+</button>
                                )}
                            </div>
                        ))}
                        <div style={actionRow}>
                            <button type="submit" disabled={loading} style={saveBtn}>
                                {loading ? "Saving..." : "Save All Tasks"}
                            </button>
                            {isTaskSaved && (
                                <button type="button" onClick={handleGenerateLink} style={inviteBtn}>
                                    🔗 Generate Invite Link
                                </button>
                            )}
                        </div>
                    </form>

                    {/* ✅ Invite Link Box */}
                    {inviteLink && (
                        <div style={linkBox}>
                            <p style={linkLabel}>📲 Team Invite Link (Share on WhatsApp):</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input readOnly value={inviteLink} style={linkInput} />
                                <button onClick={() => { navigator.clipboard.writeText(inviteLink); alert("✅ Copied!"); }} style={copyBtn}>
                                    Copy
                                </button>
                            </div>
                            <p style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
                                ℹ️ Member opens this link → signs up → automatically joins your team
                            </p>
                        </div>
                    )}
                </div>

                {/* 2. Team Progress */}
                <div style={cardStyle}>
                    <h3 style={sectionTitle}>2. Team Progress</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead style={tableHead}>
                                <tr>
                                    <th style={thStyle}>Task Details (Click to view analysis)</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myTasks.length > 0 ? myTasks.map(t => (
                                    <tr key={t._id} style={trStyle}>
                                        <td style={clickableTd} onClick={() => navigate(`/member-details/${t.assignedTo}`)} title="Click to view member report">
                                            <div style={taskTitle}>{t.title}</div>
                                            <div style={memberSubText}>{t.assignedTo} 📈</div>
                                            <div style={{ fontSize: '11px', color: '#718096' }}>Due: {new Date(t.deadline).toLocaleDateString()}</div>
                                        </td>
                                        <td style={tdCentered}>
                                            {/* ✅ Green for Active, Green for Completed/Submitted */}
                                            <span style={statusBadge(t.status)}>{t.status || '-'}</span>
                                        </td>
                                        </tr>
                                )) : (
                                    <tr><td colSpan="3" style={noDataTd}>No members found yet.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Styles ---
const containerStyle = { display: 'flex', justifyContent: 'center', backgroundColor: '#f7fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Segoe UI, sans-serif' };
const wrapperStyle = { width: '100%', maxWidth: '900px' };
const navHeader = { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' };
const cardStyle = { backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '32px' };
const sectionTitle = { margin: '0 0 20px 0', fontSize: '18px', color: '#2d3748', borderBottom: '2px solid #edf2f7', paddingBottom: '10px' };
const gridRow = { display: 'grid', gridTemplateColumns: '1fr 1fr 160px 48px', gap: '12px', marginBottom: '12px' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' };
const addBtn = { backgroundColor: '#48bb78', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '18px' };
const actionRow = { display: 'flex', gap: '12px', marginTop: '20px' };
const saveBtn = { flex: 1, padding: '14px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const inviteBtn = { flex: 1, padding: '14px', backgroundColor: '#38a169', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const backBtn = { padding: '10px 18px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' };
const linkBox = { marginTop: '24px', padding: '16px', backgroundColor: '#f0fff4', border: '1px dashed #38a169', borderRadius: '10px' };
const linkLabel = { margin: '0 0 8px 0', fontSize: '14px', color: '#276749', fontWeight: 'bold' };
const linkInput = { flex: 1, padding: '10px', border: '1px solid #c6f6d5', borderRadius: '6px', color: '#3182ce', fontSize: '13px', width: '100%' };
const copyBtn = { padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #38a169', color: '#38a169', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHead = { backgroundColor: '#edf2f7' };
const thStyle = { padding: '14px', textAlign: 'left', fontSize: '12px', color: '#718096', textTransform: 'uppercase' };
const trStyle = { borderBottom: '1px solid #edf2f7' };
const clickableTd = { padding: '16px 14px', cursor: 'pointer', backgroundColor: 'rgba(49,130,206,0.03)' };
const tdCentered = { padding: '16px 14px', textAlign: 'center' };
const taskTitle = { fontWeight: 'bold', color: '#2d3748', textDecoration: 'underline' };
const memberSubText = { fontSize: '12px', color: '#3182ce', fontWeight: '500' };
const noDataTd = { textAlign: 'center', padding: '40px', color: '#a0aec0' };
const removeBtn = { padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #e53e3e', color: '#e53e3e', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' };

// ✅ Status badge - Active=Green, Submitted/Completed=Dark Green, Pending=Grey
const statusBadge = (s) => ({
    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold',
    backgroundColor: s === 'Completed' || s === 'Submitted' ? '#c6f6d5' : s === 'Active' ? '#d1fae5' : '#edf2f7',
    color: s === 'Completed' || s === 'Submitted' ? '#22543d' : s === 'Active' ? '#065f46' : '#4a5568'
});

export default LeaderTask;