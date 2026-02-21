import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await API.post('/auth/login', formData);
            
            // --- 1. Storage Logic (Corrected) ---
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role); 

            /** * IMPORTANT: We store 'formData.email' in 'username' key.
             * This allows MemberDashboard to use the exact email used by the Leader
             * to fetch assigned tasks from the database.
             */
            localStorage.setItem('username', formData.email);

            alert(`Login Successful! Welcome to ProjectProgressIQ`);
            
            // --- 2. Role-Based Redirection ---
            const userRole = res.data.role;

            if (userRole === 'Mentor') {
                navigate('/mentor-dashboard');
            } else if (userRole === 'Leader') {
                navigate('/leader-dashboard');
            } else if (userRole === 'Member') {
                navigate('/member-dashboard');
            } else {
                alert("Role not recognized!");
            }

        } catch (err) {
            alert(err.response?.data?.msg || "Login failed. Please check your credentials.");
        }
    };

    // --- Styles ---
    const pageStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#f5f5f5', position: 'fixed', top: 0, left: 0 };
    const cardStyle = { width: '380px', padding: '30px', backgroundColor: '#ffffff', borderRadius: '10px', boxShadow: '0px 4px 15px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' };
    const inputStyle = { width: '100%', padding: '12px', margin: '10px 0 20px 0', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' };
    const btnStyle = { width: '100%', padding: '12px', backgroundColor: '#0047ff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>ProjectProgressIQ</h2>
                <form onSubmit={handleSubmit}>
                    <label>Email Address</label>
                    <input 
                        type="email" 
                        placeholder="Enter registered email" 
                        style={inputStyle} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    <label>Password</label>
                    <input 
                        type="password" 
                        placeholder="Password" 
                        style={inputStyle} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required 
                    />
                    <button type="submit" style={btnStyle}>Login</button>
                    <p style={{ textAlign: 'center', marginTop: '15px' }}>
                        New user? <Link to="/signup" style={{ color: '#0047ff', textDecoration: 'none' }}>Register here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;