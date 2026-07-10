import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, ChevronDown, User, Settings, LogOut, Sun, Moon, ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import SidebarOverlay from './SidebarOverlay';

const DashboardLayout = ({
    children,
    active,
    title = 'Management',
    showSearch = true,
    showBack = false,
    onBack = null
}) => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useState('light');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Get live details from profile if available, else user metadata
    const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
    const userRole = profile?.role || user?.user_metadata?.role || 'User';
    const userEmail = profile?.email || user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    // Theme initialization and toggle
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // Live Clock & Date update
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            setCurrentDate(now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));
            setCurrentTime(now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }));
        };
        updateDateTime();
        const interval = setInterval(updateDateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close Profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleSignOut = async () => {
        setIsDropdownOpen(false);
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    // ===== SIDEBAR FUNCTIONS =====
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="dashboard-layout">
            <Sidebar
                active={active}
                onNavigate={(page) => navigate(`/${page}`)}
                user={user}
                onSignOut={handleSignOut}
                theme={theme}
                toggleTheme={toggleTheme}
                onClose={closeSidebar}
                isOpen={sidebarOpen}
            />
            <SidebarOverlay show={sidebarOpen} onClick={closeSidebar} />

            <div className="main-content">
                <header className="dashboard-header">
                    <div className="header-left">
                        <button
                            className="hamburger-btn"
                            onClick={toggleSidebar}
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={22} />
                        </button>
                        <h1>{title}</h1>

                        {/* ===== BACK BUTTON ===== */}
                        {showBack && (
                            <button
                                onClick={onBack || (() => window.history.back())}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-family)',
                                    color: 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    marginLeft: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = 'var(--hover-bg)';
                                    e.target.style.color = 'var(--text-primary)';
                                    e.target.style.borderColor = 'var(--primary-color)';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'transparent';
                                    e.target.style.color = 'var(--text-secondary)';
                                    e.target.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                        )}

                        {showSearch && (
                            <form onSubmit={handleSearch} className="header-search-form">
                                <Search size={18} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search patients, doctors..."
                                    className="search-input"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </form>
                        )}
                    </div>
                    <div className="header-right">
                        <span className="header-date">{currentDate}</span>
                        <span className="header-time">{currentTime}</span>

                        {/* Profile Dropdown */}
                        <div className="profile-dropdown" ref={dropdownRef}>
                            <div className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <div className="header-avatar">{userInitial}</div>
                                <div className="profile-info">
                                    <div className="profile-name">{userName}</div>
                                    <div className="profile-role">{userRole}</div>
                                </div>
                                <ChevronDown size={16} className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                            </div>

                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <div className="dropdown-avatar">{userInitial}</div>
                                        <div>
                                            <div className="dropdown-name">{userName}</div>
                                            <div className="dropdown-email">{userEmail}</div>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <div className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}>
                                        <User size={18} />
                                        <span>My Profile</span>
                                    </div>
                                    <div className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}>
                                        <Settings size={18} />
                                        <span>Settings</span>
                                    </div>
                                    <div className="dropdown-divider" />
                                    <div className="dropdown-item danger" onClick={handleSignOut}>
                                        <LogOut size={18} />
                                        <span>Sign Out</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;