import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { useTheme } from '../components/ThemeContext';

const Signup = () => {
    const [formData, setFormData] = useState({
        name:      '',
        email:     '',
        password:  '',
        role:      'member',
        secretKey: '',
    });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const needsKey = ['admin', 'leader', 'mentor'].includes(formData.role);

    const keyLabel = {
        admin:  '🔐 Admin Secret Key',
        leader: '🔑 Leader Access Key',
        mentor: '🪪 Mentor ID Key',
    };

    const keyPlaceholder = {
        admin:  'Enter admin secret key…',
        leader: 'Enter leader access key…',
        mentor: 'Enter mentor ID key…',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (needsKey && !formData.secretKey.trim()) {
            return setError(`Please enter the ${formData.role} secret key to continue.`);
        }

        setLoading(true);
        try {
            await API.post('/auth/signup', formData);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--bg)', padding: '1rem',
            transition: 'background 0.3s ease',
        }}>

            {/* ✅ Theme toggle — fixed top right */}
            <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{
                    position: 'fixed', top: '1rem', right: '1rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 20, padding: '0.4rem 0.9rem',
                    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                    color: 'var(--text-muted)', zIndex: 10, transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--primary-light)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                }}
            >
                <span>{isDark ? '☀️' : '🌙'}</span>
                {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>

            {/* Background glow */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
            }} />

            <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
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
                        Sign up
                    </h2>

                    {error && (
                        <div className="alert alert-error"><span>⚠</span> {error}</div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text" name="name" className="form-input"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                type="email" name="email" className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password" name="password" className="form-input"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                name="role" className="form-select"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="member">👤 Member</option>
                                <option value="leader">👑 Leader</option>
                                <option value="mentor">🎓 Mentor</option>
                                <option value="admin">🛡️ Admin</option>
                            </select>
                        </div>

                        {/* Secret key field */}
                        {needsKey && (
                            <div className="form-group" style={{
                                background: 'rgba(99,102,241,0.06)',
                                border: '1px solid rgba(99,102,241,0.25)',
                                borderRadius: 10, padding: '1rem',
                                marginBottom: '1rem',
                            }}>
                                <label className="form-label" style={{ color: 'var(--primary-light)' }}>
                                    {keyLabel[formData.role]}
                                </label>
                                <input
                                    type="password"
                                    name="secretKey"
                                    className="form-input"
                                    placeholder={keyPlaceholder[formData.role]}
                                    value={formData.secretKey}
                                    onChange={handleChange}
                                    required
                                />
                                <p style={{
                                    fontSize: '0.75rem', color: 'var(--text-muted)',
                                    marginTop: '0.5rem', marginBottom: 0,
                                }}>
                                    🔒 This key is provided by your organization admin.
                                    Contact your admin if you don't have it.
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            style={{ marginTop: '0.5rem' }}
                            disabled={loading}
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

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                    ProgressIQ · Organization Task Management
                </p>
            </div>
        </div>
    );
};

export default Signup;