import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api/axios';

const Signup = () => {
    const query = new URLSearchParams(useLocation().search);
    const initialEmail = query.get('email') || '';
    const initialRole = query.get('role') || 'Member';
    // ✅ Read leaderEmail from invite link
    const leaderEmailFromLink = query.get('leader') || '';

    const [formData, setFormData] = useState({
        username: '', 
        email: initialEmail, 
        password: '', 
        role: leaderEmailFromLink ? 'Member' : initialRole // Force Member if invited
    });

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (initialEmail || initialRole) {
            setFormData(prev => ({
                ...prev,
                email: initialEmail,
                role: leaderEmailFromLink ? 'Member' : initialRole
            }));
        }
    }, [initialEmail, initialRole, leaderEmailFromLink]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password.length < 6) {
            return alert("Password must be at least 6 characters long");
        }

        setLoading(true);
        try {
            // ✅ Send leaderEmail along with signup data
            const response = await API.post('/auth/signup', { 
                ...formData,
                leaderEmail: leaderEmailFromLink  // connects member to leader
            }); 
            
            if (response.status === 201 || response.status === 200) {
                alert("✅ Registration Successful! Please login.");
                navigate('/'); 
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.msg || "Signup failed. Please try again.";
            alert("❌ " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const pageStyle = {
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        width: '100vw', height: '100vh', margin: 0, padding: 0,
        backgroundColor: '#f5f5f5', position: 'fixed', top: 0, left: 0
    };

    const cardStyle = {
        width: '380px', padding: '30px', backgroundColor: '#ffffff',
        borderRadius: '10px', boxShadow: '0px 4px 15px rgba(0,0,0,0.1)',
        textAlign: 'left', fontFamily: 'Arial, sans-serif'
    };

    const labelStyle = { fontWeight: 'bold', fontSize: '14px', color: '#333' };

    const inputStyle = {
        width: '100%', padding: '12px', margin: '8px 0 18px 0',
        borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box',
        fontSize: '14px'
    };

    const btnStyle = {
        width: '100%', padding: '12px', 
        backgroundColor: loading ? '#668fff' : '#0047ff',
        color: 'white', border: 'none', borderRadius: '5px',
        cursor: loading ? 'not-allowed' : 'pointer', 
        fontSize: '16px', fontWeight: 'bold', transition: '0.3s'
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1a1a1a' }}>Create New Account</h2>
                
                {/* ✅ Join Banner */}
                {leaderEmailFromLink && (
                    <div style={{ backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#276749' }}>
                        🎉 You're joining <b>{leaderEmailFromLink}</b>'s team!
                        <br/>
                        <small>Role set to: <b>Member</b></small>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>Full Name</label>
                    <input 
                        type="text" name="username" placeholder="Enter full name" 
                        style={inputStyle} value={formData.username}
                        onChange={handleChange} required 
                    />
                    
                    <label style={labelStyle}>Email Address</label>
                    <input 
                        type="email" name="email" placeholder="example@gmail.com" 
                        style={inputStyle} value={formData.email}
                        onChange={handleChange} required 
                    />
                    
                    <label style={labelStyle}>Password</label>
                    <input 
                        type="password" name="password" placeholder="Min. 6 characters" 
                        style={inputStyle} value={formData.password}
                        onChange={handleChange} required 
                    />
                    
                    {/* ✅ Conditional Role Selection */}
                    {!leaderEmailFromLink ? (
                        <>
                            <label style={labelStyle}>Register as:</label>
                            <select name="role" style={inputStyle} value={formData.role} onChange={handleChange}>
                                <option value="Member">Member</option>
                                <option value="Leader">Leader</option>
                                <option value="Mentor">Mentor</option>
                            </select>
                        </>
                    ) : (
                        // Hidden input to ensure role is sent if invited
                        <input type="hidden" name="role" value="Member" />
                    )}
                    
                    <button type="submit" style={btnStyle} disabled={loading}>
                        {loading ? 'Processing...' : 'Sign Up'}
                    </button>
                    
                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                        Already have an account? <Link to="/" style={{ color: '#0047ff', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;