import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from './ThemeContext';

const ROLE_NAVS = {
    admin: [
        { icon: '📊', label: 'Dashboard', path: '/admin-dashboard'            },
        { icon: '👥', label: 'Users',     path: '/admin-dashboard?tab=users'  },
        { icon: '📁', label: 'Projects',  path: '/admin-dashboard?tab=teams'  },
    ],
    leader: [
        { icon: '📊', label: 'Dashboard',    path: '/leader-dashboard' },
        { icon: '✅', label: 'Manage Tasks', path: '/leader-tasks'     },
    ],
    mentor: [
        { icon: '📊', label: 'Dashboard', path: '/mentor-dashboard' },
    ],
    member: [
        { icon: '📊', label: 'Dashboard', path: '/member-dashboard' },
    ],
};

const ROLE_COLORS = {
    admin:  '#f59e0b',
    leader: '#6366f1',
    mentor: '#10b981',
    member: '#22d3ee',
};

export default function Sidebar({ active }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    const username = localStorage.getItem('username') || 'User';
    const role     = localStorage.getItem('role')     || 'member';
    const navItems = ROLE_NAVS[role] || ROLE_NAVS.member;

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // ✅ Smart active detection using path + query param
    const isActive = (item) => {
        const currentPath  = location.pathname;
        const currentQuery = location.search;
        const [itemPath, itemQuery] = item.path.split('?');

        if (itemQuery) {
            return currentPath === itemPath && currentQuery === `?${itemQuery}`;
        }
        return currentPath === itemPath && !currentQuery;
    };

    const initials = username.slice(0, 2).toUpperCase();

    return (
        <aside className="sidebar">

            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">⚡</div>
                <div className="sidebar-logo-text">Progress<span>IQ</span></div>
            </div>

            {/* Role badge */}
            <div style={{ paddingLeft: '0.8rem', marginBottom: '1rem' }}>
                <span className="badge" style={{
                    background:    `${ROLE_COLORS[role]}18`,
                    color:          ROLE_COLORS[role],
                    fontSize:      '0.68rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                }}>
                    {role}
                </span>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="section-title" style={{ paddingLeft: '0.8rem' }}>Menu</div>
                {navItems.map((item) => (
                    <button
                        key={item.label}
                        className={`nav-item ${isActive(item) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                        style={{ transition: 'all 0.2s' }}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">

                {/* ✅ Theme toggle */}
                <button
                    className="nav-item"
                    onClick={toggleTheme}
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    style={{ marginBottom: '0.25rem' }}
                >
                    <span className="nav-icon">{isDark ? '☀️' : '🌙'}</span>
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>

                {/* User info */}
                <div className="sidebar-user">
                    <div className="avatar avatar-sm">{initials}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{username}</div>
                        <div className="sidebar-user-role">{role}</div>
                    </div>
                </div>

                {/* Logout */}
                <button
                    className="nav-item"
                    style={{ marginTop: '0.25rem', color: '#f87171' }}
                    onClick={handleLogout}
                >
                    <span className="nav-icon">🚪</span>
                    Logout
                </button>
            </div>

        </aside>
    );
}