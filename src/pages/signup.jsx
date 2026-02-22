import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api/axios';

const Signup = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    
    // 🔗 Invite Link parameters
    const initialEmail = query.get('email') || '';
    const initialRole = query.get('role') || 'Member';
    const leaderEmailFromLink = query.get('leader') || '';

    const [formData, setFormData] = useState({
        username: '', 
        email: initialEmail, 
        password: '', 
        // Jar leader link asel tar role 'Member' lock kara, nahitar dynamic dya
        role: leaderEmailFromLink ? 'Member' : initialRole,
        adminSecretKey: '',
        invitedBy: leaderEmailFromLink // Backend la mahiti denyasathi navin field
    });

    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // URL parameters badalle ki form update karne
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            email: initialEmail,
            role: leaderEmailFromLink ? 'Member' : initialRole,
            invitedBy: leaderEmailFromLink
        }));
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
            // ✅ Data backend la pathvatana invitedBy (leaderEmail) include kela aahe
            const response = await API.post('/auth/signup', formData); 
            
            if (response.status === 201 || response.status === 200) {
                alert("✅ Registration Successful! Please login.");
                navigate('/'); 
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.msg || "Signup failed.";
            alert("❌ " + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // --- Dynamic Styles ---
    const pageStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#f5f5f5', position: 'fixed', top: 0, left: 0 };
    const cardStyle = { width: '380px', padding: '30px', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0px 4px 15px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' };
    const labelStyle = { fontWeight: 'bold', fontSize: '13px', color: '#333' };
    const inputStyle = { width: '100%', padding: '12px', margin: '8px 0 18px 0', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' };
    const btnStyle = { width: '100%', padding: '12px', backgroundColor: loading ? '#668fff' : '#0047ff', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1a1a1a' }}>Create New Account</h2>
                
                {/* 📩 Invite Info Box */}
                {leaderEmailFromLink && (
                    <div style={{ backgroundColor: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#276749' }}>
                        🎉 Joining <b>{leaderEmailFromLink}</b>'s team as a Member!
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>Full Name</label>
                    <input type="text" name="username" placeholder="Enter full name" style={inputStyle} value={formData.username} onChange={handleChange} required />
                    
                    <label style={labelStyle}>Email Address</label>
                    <input type="email" name="email" placeholder="example@gmail.com" style={inputStyle} value={formData.email} onChange={handleChange} required />
                    
                    <label style={labelStyle}>Password</label>
                    <input type="password" name="password" placeholder="Min. 6 characters" style={inputStyle} value={formData.password} onChange={handleChange} required />
                    
                    {/* Role Selection (Fakt jar link nasel tarach dakhva) */}
                    {!leaderEmailFromLink ? (
                        <>
                            <label style={labelStyle}>Register as:</label>
                            <select name="role" style={inputStyle} value={formData.role} onChange={handleChange}>
                                <option value="Member">Member</option>
                                <option value="Leader">Leader</option>
                                <option value="Mentor">Mentor</option>
                                <option value="Admin">Admin (Super Power)</option>
                            </select>
                        </>
                    ) : (
                        <input type="hidden" name="role" value="Member" />
                    )}

                    {/* ✅ Admin Secret Key Field */}
                    {formData.role === 'Admin' && (
                        <div style={{ padding: '10px', backgroundColor: '#fff5f5', borderRadius: '6px', marginBottom: '15px', border: '1px solid #feb2b2' }}>
                            <label style={{ ...labelStyle, color: '#c53030' }}>Admin Secret Key</label>
                            <input 
                                type="password" 
                                name="adminSecretKey" 
                                placeholder="Enter secret code" 
                                style={{ ...inputStyle, marginBottom: 0, borderColor: '#fc8181' }} 
                                value={formData.adminSecretKey} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
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