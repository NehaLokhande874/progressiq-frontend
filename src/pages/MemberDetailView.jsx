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

    // 💡 Dynamic Host Detection: File view sathi jithe IP lagto
    const currentHost = window.location.hostname;

    const userRole = localStorage.getItem('role');
    const leaderEmail = localStorage.getItem('email'); // 'username' jagi 'email' vapra sync sathi

    useEffect(() => {
        const fetchMemberData = async () => {
            try {
                // Backend API call
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

    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = tasks.length - completed;

    const chartData = {
        labels: ['Completed', 'Pending'],
        datasets: [{
            data: [completed, pending],
            backgroundColor: ['#48bb78', '#f56565'],
            hoverOffset: 4
        }],
    };

    if (loading) return <div style={loaderStyle}>Analyzing Member Data...</div>;

    return (
        <div style={pageWrapper}>
            <div style={containerStyle}>
                {/* --- TOP BAR --- */}
                <div style={topBar}>
                    <button onClick={() => navigate(-1)} style={backBtn}>← Back to Dashboard</button>
                    <h2 style={headerTitle}>Analysis for: <span style={emailHighlight}>{email}</span></h2>
                </div>

                {/* --- STATS & CHART SECTION --- */}
                <div style={dashboardGrid}>
                    <div style={chartContainer}>
                        <h4 style={cardTitle}>Performance Overview</h4>
                        <div style={pieWrapper}>
                            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>

                    <div style={statsGrid}>
                        <div style={{ ...statCard, borderTop: '4px solid #3182ce' }}>
                            <span style={statLabel}>Total Tasks Assigned</span>
                            <span style={statValue}>{tasks.length}</span>
                        </div>
                        <div style={{ ...statCard, borderTop: '4px solid #38a169' }}>
                            <span style={statLabel}>Successfully Completed</span>
                            <span style={{ ...statValue, color: '#38a169' }}>{completed}</span>
                        </div>
                        <div style={{ ...statCard, borderTop: '4px solid #e53e3e' }}>
                            <span style={statLabel}>Pending / Active</span>
                            <span style={{ ...statValue, color: '#e53e3e' }}>{pending}</span>
                        </div>
                    </div>
                </div>

                {/* --- LEADER ASSIGNMENT FORM --- */}
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
                                        <button onClick={handleAssignTask} style={submitBtn}>Confirm Assign</button>
                                        <button onClick={() => setShowForm(false)} style={cancelBtn}>Cancel</button>
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
                                    <th style={thStyle}>Task Info</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Member Note</th>
                                    <th style={thStyle}>Submission & Feedback</th>
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
                                        <td style={tdStyle}>{task.submissionNote || "No note added."}</td>
                                        <td style={tdStyle}>
                                            <div style={proofCol}>
                                                {task.fileUrl ? (
                                                    // 💡 FIX: Manually IP taknyachya jagi currentHost vapra
                                                    <a href={`http://${currentHost}:5000${task.fileUrl}`} target="_blank" rel="noreferrer" style={viewLink}>
                                                        View Proof File 📄
                                                    </a>
                                                ) : <span style={noProof}>Pending Submission</span>}

                                                <div style={feedbackArea}>
                                                    {task.feedback ? (
                                                        <div style={feedbackBox}>
                                                            <strong>Feedback:</strong> {task.feedback}
                                                        </div>
                                                    ) : (
                                                        userRole === 'Leader' && task.status === 'Completed' && (
                                                            <div style={feedbackInputRow}>
                                                                <input 
                                                                    type="text" placeholder="Add feedback..." style={smallInput}
                                                                    onChange={(e) => setFeedbackTexts({...feedbackTexts, [task._id]: e.target.value})}
                                                                />
                                                                <button onClick={() => handleFeedbackSubmit(task._id)} style={smallBtn}>Send</button>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" style={emptyMsg}>No tasks found. Assign one to start tracking.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES (Center Aligned & Responsive) ---
const pageWrapper = { backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '40px 20px' };
const containerStyle = { maxWidth: '1000px', margin: '0 auto' };
const topBar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' };
const backBtn = { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#fff', fontWeight: '600', color: '#475569', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const headerTitle = { margin: 0, fontSize: '22px', color: '#1e293b' };
const emailHighlight = { color: '#2563eb', fontWeight: '700' };

const dashboardGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '300px' };
const chartContainer = { backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' };
const pieWrapper = { height: '200px', position: 'relative' };
const statsGrid = { display: 'flex', flexDirection: 'column', gap: '12px' };
const statCard = { backgroundColor: '#fff', padding: '18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const statLabel = { fontSize: '14px', color: '#64748b', fontWeight: '500' };
const statValue = { fontSize: '24px', fontWeight: '800' };
const cardTitle = { marginBottom: '15px', fontSize: '15px', color: '#475569', textAlign: 'center' };

const actionRow = { marginBottom: '30px', display: 'flex', justifyContent: 'center' };
const primaryBtn = { backgroundColor: '#2563eb', color: '#fff', padding: '12px 30px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' };
const formCard = { backgroundColor: '#fff', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', width: '100%' };
const formTitle = { margin: '0 0 15px 0', fontSize: '17px', textAlign: 'center' };
const formRow = { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' };
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', width: '250px' };
const btnGroup = { display: 'flex', gap: '10px' };
const submitBtn = { padding: '12px 20px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' };
const cancelBtn = { padding: '12px 20px', backgroundColor: '#64748b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' };

const tableCard = { backgroundColor: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', marginTop: '-250px' };
const tableHeading = { margin: '0 0 15px 0', fontSize: '17px', color: '#1e293b' };
const mainTable = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { textAlign: 'left', padding: '12px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' };
const trStyle = { borderBottom: '1px solid #f8fafc' };
const tdStyle = { padding: '15px 12px', verticalAlign: 'middle' };
const taskName = { fontWeight: '700', color: '#334155', fontSize: '14px' };
const taskDate = { fontSize: '11px', color: '#94a3b8' };
const viewLink = { color: '#2563eb', textDecoration: 'none', fontSize: '13px', fontWeight: '600' };
const noProof = { color: '#cbd5e1', fontSize: '12px', fontStyle: 'italic' };
const feedbackArea = { marginTop: '8px' };
const feedbackBox = { padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '12px', color: '#0369a1' };
const feedbackInputRow = { display: 'flex', gap: '5px' };
const smallInput = { flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px' };
const smallBtn = { padding: '6px 10px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' };
const emptyMsg = { textAlign: 'center', padding: '30px', color: '#94a3b8' };
const headerRow = { backgroundColor: '#f8fafc' };
const proofCol = { display: 'flex', flexDirection: 'column', gap: '3px' };

const statusBadge = (status) => ({
    display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '800',
    backgroundColor: status === 'Completed' ? '#dcfce7' : '#fee2e2',
    color: status === 'Completed' ? '#166534' : '#991b1b'
});

const loaderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontWeight: '600', color: '#64748b' };

export default MemberDetailView;