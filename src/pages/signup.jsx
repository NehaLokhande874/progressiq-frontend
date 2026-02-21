import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api/axios';

const Signup = () => {
    // URL madhun email ani role ghenyasathi query parameters
    const query = new URLSearchParams(useLocation().search);
    const initialEmail = query.get('email') || '';
    const initialRole = query.get('role') || 'Member';

    // State initialization: URL params aseltar te pahile ghetle jatil
    const [formData, setFormData] = useState({
        username: '', 
        email: initialEmail, 
        password: '', 
        role: initialRole
    });

    const navigate = useNavigate();

    // Jar URL badalli tar form data parat update karnyathi useEffect
    useEffect(() => {
        if (initialEmail || initialRole) {
            setFormData(prev => ({
                ...prev,
                email: initialEmail,
                role: initialRole
            }));
        }
    }, [initialEmail, initialRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/auth/register', formData);
            alert("Registration Successful!");
            navigate('/'); 
        } catch (err) {
            alert(err.response?.data?.error || err.response?.data?.msg || "Signup failed");
        }
    };

    // --- Styles (Same as yours) ---
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

    const inputStyle = {
        width: '100%', padding: '12px', margin: '10px 0 20px 0',
        borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box'
    };

    const btnStyle = {
        width: '100%', padding: '12px', backgroundColor: '#0047ff',
        color: 'white', border: 'none', borderRadius: '5px',
        cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create New Account</h2>
                <form onSubmit={handleSubmit}>
                    <label>Full Name</label>
                    <input 
                        type="text" 
                        placeholder="Name" 
                        style={inputStyle} 
                        value={formData.username}
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        required 
                    />
                    
                    <label>Email Address</label>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        style={inputStyle} 
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    
                    <label>Password</label>
                    <input 
                        type="password" 
                        placeholder="Password" 
                        style={inputStyle} 
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required 
                    />
                    
                    <label>Register as:</label>
                    <select 
                        style={inputStyle} 
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                        <option value="Member">Member</option>
                        <option value="Leader">Leader</option>
                        <option value="Mentor">Mentor</option>
                    </select>
                    
                    <button type="submit" style={btnStyle}>Sign Up</button>
                    
                    <p style={{ textAlign: 'center', marginTop: '15px' }}>
                        Already have an account? <Link to="/" style={{ color: '#0047ff', textDecoration: 'none' }}>Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;