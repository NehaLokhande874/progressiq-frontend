import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.post('/auth/login', formData);
            
            // --- 1. Storage Logic ---
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role); 
            localStorage.setItem('username', res.data.username); // backend kadun yenara username vapra
            localStorage.setItem('email', res.data.email);

            alert(`✅ Login Successful! Welcome to ProjectProgressIQ`);
            
            // --- 2. Role-Based Redirection (Updated for Admin) ---
            const userRole = res.data.role;

            if (userRole === 'Admin') {
                navigate('/admin-dashboard');
            } else if (userRole === 'Mentor') {
                navigate('/mentor-dashboard');
            } else if (userRole === 'Leader') {
                navigate('/leader-dashboard');
            } else if (userRole === 'Member') {
                navigate('/member-dashboard');
            } else {
                alert("❌ Role not recognized!");
            }

        } catch (err) {
            alert(err.response?.data?.msg || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    // --- Styles ---
    const pageStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#f5f5f5', position: 'fixed', top: 0, left: 0 };
    const cardStyle = { width: '380px', padding: '35px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0px 10px 25px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' };
    const labelStyle = { fontWeight: 'bold', fontSize: '14px', color: '#333' };
    const inputStyle = { width: '100%', padding: '12px', margin: '8px 0 20px 0', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' };
    const btnStyle = { width: '100%', padding: '12px', backgroundColor: loading ? '#668fff' : '#0047ff', color: 'white', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold', transition: '0.3s' };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#1a1a1a' }}>ProjectProgressIQ Login</h2>
                <form onSubmit={handleSubmit}>
                    
                    <label style={labelStyle}>Email Address</label>
                    <input 
                        type="email" 
                        placeholder="example@gmail.com" 
                        style={inputStyle} 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                    />

                    <label style={labelStyle}>Password</label>
                    <input 
                        type="password" 
                        placeholder="Enter your password" 
                        style={inputStyle} 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required 
                    />

                    <button type="submit" style={btnStyle} disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
                        New user? <Link to="/signup" style={{ color: '#0047ff', textDecoration: 'none', fontWeight: 'bold' }}>Register here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;