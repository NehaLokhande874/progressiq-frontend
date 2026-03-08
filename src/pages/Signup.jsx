import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../api/axios';

const Signup = () => {
    const location = useLocation();
    const query    = new URLSearchParams(location.search);

    const [formData, setFormData] = useState({
        name:     '',
        email:    query.get('email') || '',
        password: '',
        confirm:  '',
        role:     query.get('role')  || 'member',
        token:    query.get('token') || '',
    });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const navigate = useNavigate();

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password !== formData.confirm) {
            return setError('Passwords do not match.');
        }
        setLoading(true);
        try {
            await API.post('/auth/signup', {
                name:     formData.name,
                email:    formData.email,
                password: formData.password,
                role:     formData.role,
                token:    formData.token,
            });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            padding: '1rem',
        }}>
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34,211,238,0.08) 0%, transparent 70%)',
            }} />

            <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 52, height: 52, background: 'var(--primary)',
                        borderRadius: 14, display: 'inline-flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.4rem',
                        boxShadow: 'var(--glow)', marginBottom: '1rem',
                    }}>⚡</div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
                        Progress<span style={{ color: 'var(--primary-light)' }}>IQ</span>
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                        Create your account
                    </p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        Register
                    </h2>

                    {error && (
                        <div className="alert alert-error">
                            <span>⚠</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Full name</label>
                            <input
                                type="text" name="name" className="form-input"
                                placeholder="Jane Doe"
                                value={formData.name} onChange={handleChange} required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                type="email" name="email" className="form-input"
                                placeholder="you@example.com"
                                value={formData.email} onChange={handleChange} required
                            />
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password" name="password" className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password} onChange={handleChange} required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm</label>
                                <input
                                    type="password" name="confirm" className="form-input"
                                    placeholder="••••••••"
                                    value={formData.confirm} onChange={handleChange} required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select name="role" className="form-select"
                                value={formData.role} onChange={handleChange}>
                                <option value="member">Member</option>
                                <option value="mentor">Mentor</option>
                                <option value="leader">Leader</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {formData.token && (
                            <div className="form-group">
                                <label className="form-label">Invite token</label>
                                <input
                                    type="text" name="token" className="form-input"
                                    value={formData.token} readOnly
                                    style={{ opacity: 0.6 }}
                                />
                            </div>
                        )}

                        <button
                            type="submit" className="btn btn-primary btn-full btn-lg"
                            style={{ marginTop: '0.5rem' }} disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                                    Creating account…
                                </>
                            ) : 'Create account →'}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;