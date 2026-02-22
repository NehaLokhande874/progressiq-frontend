import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const MemberDetailView = () => {
    const { email } = useParams();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [feedbackTexts, setFeedbackTexts] = useState({});
    const [showForm, setShowForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', deadline: '' });

    const userRole = localStorage.getItem('role');
    const leaderEmail = localStorage.getItem('email'); 

    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                const res = await API.get(`/tasks/member/${email}`);
                setTasks(res.data);
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMemberData();
    }, [email]);

    const handleAssignTask = async (e) => {
        e.preventDefault();
        if (!newTask.title || !newTask.deadline) return alert("Please fill all fields!");

        try {
            // ✅ Leader ne task assign kelyavar to direct Member la disto
            const res = await API.post('/tasks/assign', {
                email: email,
                title: newTask.title,
                deadline: newTask.deadline,
                leaderEmail: leaderEmail
            });
            alert("✅ Task Assigned Successfully!");
            setTasks([...tasks, res.data]);
            setNewTask({ title: '', deadline: '' });
            setShowForm(false);
        } catch (err) {
            alert("❌ Failed to assign task.");
        }
    };

    const handleFeedbackSubmit = async (taskId) => {
        const feedback = feedbackTexts[taskId];
        if (!feedback) return alert("Please enter feedback.");
        try {
            await API.put(`/tasks/add-feedback/${taskId}`, { feedback });
            alert("✅ Feedback sent!");
            setTasks(tasks.map(t => t._id === taskId ? { ...t, feedback } : t));
        } catch (err) {
            alert("❌ Feedback failed.");
        }
    };

    // --- CHART LOGIC ---
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const active = tasks.filter(t => t.status === 'Active').length;
    const pending = tasks.length - (completed + active);

    const chartData = {
        labels: ['Completed', 'Active', 'Pending'],
        datasets: [{
            data: [completed, active, pending],
            backgroundColor: ['#38a169', '#3182ce', '#e53e3e'],
            hoverOffset: 4
        }],
    };

    // --- Status Badge Style (Active & Completed = Green) ---
    const statusBadge = (status) => {
        const isGood = status === 'Completed' || status === 'Active';
        return {
            padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800',
            backgroundColor: isGood ? '#dcfce7' : '#fee2e2',
            color: isGood ? '#166534' : '#991b1b',
            textTransform: 'uppercase'
        };
    };

    if (loading) return <div style={loaderStyle}>Analyzing Member Data...</div>;

    return (
        <div style={pageWrapper}>
            <div style={containerStyle}>
                {/* --- TOP BAR --- */}
                <div style={topBar}>
                    <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>
                    <h2 style={headerTitle}>Analysis: <span style={emailHighlight}>{email}</span></h2>
                </div>

                {/* --- STATS & CHART --- */}
                <div style={dashboardGrid}>
                    <div style={chartContainer}>
                        <h4 style={cardTitle}>Performance Overview</h4>
                        <div style={pieWrapper}>
                            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>

                    <div style={statsGrid}>
                        <div style={{ ...statCard, borderTop: '4px solid #3182ce' }}>
                            <span style={statLabel}>Total Tasks</span>
                            <span style={statValue}>{tasks.length}</span>
                        </div>
                        <div style={{ ...statCard, borderTop: '4px solid #38a169' }}>
                            <span style={statLabel}>Completed</span>
                            <span style={{ ...statValue, color: '#38a169' }}>{completed}</span>
                        </div>
                    </div>
                </div>

                {/* --- LEADER ASSIGNMENT --- */}
                {userRole === 'Leader' && (
                    <div style={actionRow}>
                        {!showForm ? (
                            <button onClick={() => setShowForm(true)} style={primaryBtn}>+ Assign New Task</button>
                        ) : (
                            <div style={formCard}>
                                <h3 style={formTitle}>Create New Task</h3>
                                <div style={formRow}>
                                    <input 
                                        type="text" placeholder="Task Description" style={inputStyle}
                                        value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                                    />
                                    <input 
                                        type="date" style={inputStyle}
                                        value={newTask.deadline} onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                                    />
                                    <div style={btnGroup}>
                                        <button onClick={handleAssignTask} style={submitBtn}>Assign</button>
                                        <button onClick={() => setShowForm(false)} style={cancelBtn}>X</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- REPORTS TABLE --- */}
                <div style={tableCard}>
                    <h3 style={tableHeading}>📁 Detailed Task Reports</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={mainTable}>
                            <thead>
                                <tr style={headerRow}>
                                    <th style={thStyle}>Task</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Submission</th>
                                    <th style={thStyle}>Feedback</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.length > 0 ? tasks.map(task => (
                                    <tr key={task._id} style={trStyle}>
                                        <td style={tdStyle}>
                                            <div style={taskName}>{task.title}</div>
                                            <div style={taskDate}>Due: {new Date(task.deadline).toLocaleDateString()}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={statusBadge(task.status)}>{task.status}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            {/* ✅ Fixed: Backend pramane direct task.fileUrl vapra */}
                                            {task.fileUrl ? (
                                                <a href={`${API.defaults.baseURL.replace('/api', '')}${task.fileUrl}`} 
                                                   target="_blank" rel="noreferrer" style={viewLink}>
                                                    View Proof 📄
                                                </a>
                                            ) : (
                                                <span style={noProof}>Pending...</span>
                                            )}
                                            <div style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>{task.submissionNote}</div>
                                        </td>
                                        <td style={tdStyle}>
                                            {task.feedback ? (
                                                <div style={feedbackBox}>{task.feedback}</div>
                                            ) : (
                                                userRole === 'Leader' && (
                                                    <div style={feedbackInputRow}>
                                                        <input 
                                                            type="text" placeholder="Comment..." style={smallInput}
                                                            onChange={(e) => setFeedbackTexts({...feedbackTexts, [task._id]: e.target.value})}
                                                        />
                                                        <button onClick={() => handleFeedbackSubmit(task._id)} style={smallBtn}>OK</button>
                                                    </div>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" style={emptyMsg}>No tasks found for this member.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const pageWrapper = { backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '20px' };
const containerStyle = { maxWidth: '1000px', margin: '0 auto' };
const topBar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' };
const backBtn = { padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#fff', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const headerTitle = { fontSize: '18px', fontWeight: '700' };
const emailHighlight = { color: '#2563eb' };
const dashboardGrid = { display: 'grid', gridTemplateColumns: 'window.innerWidth > 768 ? 1fr 1fr : 1fr', gap: '20px', marginBottom: '20px' };
const chartContainer = { backgroundColor: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const pieWrapper = { height: '160px', position: 'relative' };
const statsGrid = { display: 'flex', flexDirection: 'column', gap: '10px' };
const statCard = { backgroundColor: '#fff', padding: '18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const statLabel = { fontSize: '13px', color: '#64748b', fontWeight: '600' };
const statValue = { fontSize: '22px', fontWeight: '800' };
const cardTitle = { fontSize: '14px', marginBottom: '15px', fontWeight: '600', color: '#475569' };
const actionRow = { marginBottom: '20px', display: 'flex', justifyContent: 'center' };
const primaryBtn = { backgroundColor: '#2563eb', color: '#fff', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' };
const formCard = { backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%' };
const formTitle = { fontSize: '15px', marginBottom: '15px', fontWeight: '600' };
const formRow = { display: 'flex', gap: '10px', flexWrap: 'wrap' };
const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', flex: 1, minWidth: '150px' };
const btnGroup = { display: 'flex', gap: '5px' };
const submitBtn = { backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: '600', cursor: 'pointer' };
const cancelBtn = { backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 15px', cursor: 'pointer' };
const tableCard = { backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const tableHeading = { fontSize: '16px', marginBottom: '15px', fontWeight: '700', color: '#1e293b' };
const mainTable = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f1f5f9', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const tdStyle = { padding: '15px 12px', verticalAlign: 'middle' };
const taskName = { fontWeight: '700', fontSize: '14px', color: '#334155' };
const taskDate = { fontSize: '11px', color: '#94a3b8', marginTop: '4px' };
const viewLink = { color: '#2563eb', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', border: '1px solid #2563eb', padding: '4px 8px', borderRadius: '4px' };
const noProof = { color: '#cbd5e1', fontSize: '11px', fontStyle: 'italic' };
const feedbackBox = { padding: '8px 12px', backgroundColor: '#f0f9ff', borderRadius: '6px', fontSize: '12px', color: '#0c4a6e', borderLeft: '4px solid #0ea5e9' };
const feedbackInputRow = { display: 'flex', gap: '5px' };
const smallInput = { flex: 1, padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' };
const smallBtn = { backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', padding: '0 12px', cursor: 'pointer', fontWeight: '600' };
const emptyMsg = { textAlign: 'center', padding: '40px', color: '#94a3b8' };
const headerRow = { backgroundColor: '#f8fafc' };
const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: '#2563eb', fontWeight: '600' };

export default MemberDetailView;