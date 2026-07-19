import React from 'react';
import {
    LayoutDashboard, Users, Stethoscope, Calendar,
    FileText, CreditCard, Package, Pill,
    BarChart3, UserCog, BookOpen, LogOut,
    ChevronDown, Sun, Moon, X, Activity,
    Settings, Clipboard, Syringe, HeartPulse,
    Hospital, FileSpreadsheet, Wrench, Cog
} from 'lucide-react';

const Sidebar = ({
    active,
    onNavigate,
    user,
    onSignOut,
    theme,
    toggleTheme,
    onClose,
    isOpen
}) => {
    const navSections = [
        {
            title: 'Overview',
            items: [
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' }
            ]
        },
        {
            title: 'Clinical',
            items: [
                { id: 'patients', icon: Users, label: 'Patients' },
                { id: 'doctors', icon: Stethoscope, label: 'Doctors' },
                { id: 'appointments', icon: Calendar, label: 'Appointments' },
                { id: 'prescriptions', icon: FileText, label: 'Prescriptions' },
                { id: 'vitals', icon: Activity, label: 'Vitals' }
            ]
        },
        {
            title: 'Operations',
            items: [
                { id: 'billing', icon: CreditCard, label: 'Billing' },
                { id: 'inventory', icon: Package, label: 'Inventory' },
                { id: 'pharmacy', icon: Pill, label: 'Pharmacy' },
                { id: 'reports', icon: BarChart3, label: 'Reports' },
                { id: 'staff', icon: UserCog, label: 'Staff' }
            ]
        }
    ];

    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
    const userRole = user?.user_metadata?.role || 'User';
    const userInitial = userName.charAt(0).toUpperCase();

    const handleNavClick = (page) => {
        if (onNavigate) onNavigate(page);
        if (onClose) onClose();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* ===== CLOSE BUTTON - MOBILE ===== */}
            <div className="sidebar-close-btn">
                <button onClick={onClose} className="mobile-close-btn">
                    <X size={24} />
                </button>
            </div>

            {/* LOGO */}
            <div className="sidebar-brand">
                <div className="auth-logo">
                    <span className="auth-logo-icon">🏥 </span>
                    <span>   Subhan Care</span>
                </div>
            </div>

            {/* USER */}
            <div className="sidebar-user" style={{ cursor: 'pointer' }} onClick={() => handleNavClick('profile')}>
                <div className="sidebar-avatar">{userInitial}</div>
                <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{userName}</div>
                    <div className="sidebar-user-role">{userRole}</div>
                </div>
                <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </div>

            {/* NAVIGATION */}
            <nav className="sidebar-nav">
                {navSections.map((section, idx) => (
                    <div key={idx}>
                        <div className="sidebar-nav-section">{section.title}</div>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = active === item.id;
                            return (
                                <div
                                    key={item.id}
                                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleNavClick(item.id)}
                                >
                                    <Icon className="nav-icon" />
                                    <span className="nav-label">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* ===== FOOTER WITH SETTINGS ===== */}
            <div className="sidebar-footer">
                <button className="theme-toggle-btn" onClick={toggleTheme}>
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    <span className="theme-label">
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </button>

                {/* Settings */}
                <div
                    className={`sidebar-footer-item ${active === 'settings' ? 'active' : ''}`}
                    onClick={() => handleNavClick('settings')}
                    style={{ cursor: 'pointer' }}
                >
                    <Settings size={18} />
                    <span className="footer-label">Settings</span>
                </div>

                <div className="sidebar-footer-item" onClick={() => window.open('/handbook.pdf', '_blank')}>
                    <BookOpen size={18} />
                    <span className="footer-label">Need Training?</span>
                </div>

                <div
                    className="sidebar-footer-item"
                    style={{ color: 'var(--danger-color)', cursor: 'pointer' }}
                    onClick={onSignOut}
                >
                    <LogOut size={18} />
                    <span className="footer-label">Sign Out</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;