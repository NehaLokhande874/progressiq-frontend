import React from 'react';
import { useTheme } from './ThemeContext';

const ThemeToggle = ({ style = {} }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: '0.35rem 0.75rem',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
                ...style,
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
            <span style={{ fontSize: '0.95rem' }}>{isDark ? '☀️' : '🌙'}</span>
            {isDark ? 'Light' : 'Dark'}
        </button>
    );
};

export default ThemeToggle;