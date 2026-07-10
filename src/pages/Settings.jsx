import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    Lock, Eye, Sun, Moon, CheckCircle, AlertCircle,
    ArrowLeft, Bell, Shield, Globe, Monitor, Smartphone,
    Mail, Key, User, LogOut, Save, X, Palette,
    Settings as SettingsIcon, Volume2, VolumeX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

const Settings = () => {
    const { user, updatePassword, signOut, profile } = useAuth();
    const navigate = useNavigate();

    // ===== THEME STATE =====
    const [theme, setTheme] = useState('light');

    // ===== PASSWORD STATE =====
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // ===== NOTIFICATIONS =====
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false
    });

    // ===== LANGUAGE =====
    const [language, setLanguage] = useState('en');

    // ===== LOADING =====
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== LOAD THEME =====
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    // ===== HANDLE THEME CHANGE =====
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    // ===== TOGGLE NOTIFICATION =====
    const toggleNotification = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // ===== VALIDATE PASSWORD =====
    const validateForm = () => {
        const errors = {};
        if (!newPassword) {
            errors.newPassword = 'Password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
            errors.newPassword = 'Must contain at least one uppercase letter and one number';
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== HANDLE PASSWORD SUBMIT =====
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await updatePassword(newPassword);
            setSuccessMsg('✅ Your security password has been changed successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(err.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    // ===== HANDLE SIGN OUT =====
    const handleSignOut = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (err) {
            setErrorMsg(err.message || 'Failed to sign out');
        }
    };

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'ur', label: 'Urdu' },
        { code: 'ar', label: 'Arabic' },
        { code: 'fr', label: 'French' },
        { code: 'es', label: 'Spanish' }
    ];

    const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
    const userEmail = user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    return (
        <DashboardLayout active="settings" title="Settings" showSearch={false}>
            <div style={{ maxWidth: '680px', margin: '0 auto', animation: 'slideUp 0.3s ease-out' }}>

                {/* ===== BACK BUTTON ===== */}
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={goBack}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>

                {/* ===== USER INFO ===== */}
                <div className="auth-card" style={{ padding: '24px', animation: 'none', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 600
                        }}>
                            {userInitial}
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>
                                {userName}
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                                {userEmail}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ===== THEME SETTINGS ===== */}
                <div className="auth-card" style={{ padding: '24px', animation: 'none', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Palette size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                            Theme Preference
                        </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Choose between light and dark mode for the hospital portal.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => handleThemeChange('light')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px',
                                border: theme === 'light' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                borderRadius: '10px',
                                background: theme === 'light' ? 'var(--primary-color)10' : 'var(--bg-primary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-family)',
                                color: theme === 'light' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                                fontWeight: theme === 'light' ? 600 : 400
                            }}
                        >
                            <Sun size={18} /> Light Mode
                            {theme === 'light' && <CheckCircle size={16} style={{ marginLeft: '4px' }} />}
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '12px',
                                border: theme === 'dark' ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                borderRadius: '10px',
                                background: theme === 'dark' ? 'var(--primary-color)10' : 'var(--bg-primary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-family)',
                                color: theme === 'dark' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                transition: 'all 0.2s ease',
                                fontWeight: theme === 'dark' ? 600 : 400
                            }}
                        >
                            <Moon size={18} /> Dark Mode
                            {theme === 'dark' && <CheckCircle size={16} style={{ marginLeft: '4px' }} />}
                        </button>
                    </div>
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 14px',
                        background: 'var(--bg-primary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <Monitor size={14} style={{ display: 'inline', marginRight: '6px' }} />
                        Current theme: <strong>{theme === 'light' ? '☀️ Light' : '🌙 Dark'}</strong>
                    </div>
                </div>

                {/* ===== LANGUAGE SETTINGS ===== */}
                <div className="auth-card" style={{ padding: '24px', animation: 'none', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Globe size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                            Language Preference
                        </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Select your preferred language for the interface.
                    </p>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-family)',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.label}</option>
                        ))}
                    </select>
                </div>

                {/* ===== NOTIFICATION SETTINGS ===== */}
                <div className="auth-card" style={{ padding: '24px', animation: 'none', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Bell size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                            Notification Preferences
                        </h3>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Configure how you want to receive notifications.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { key: 'email', label: 'Email Notifications', icon: Mail },
                            { key: 'push', label: 'Push Notifications', icon: Smartphone },
                            { key: 'sms', label: 'SMS Alerts', icon: Volume2 }
                        ].map(({ key, label, icon: Icon }) => (
                            <div key={key} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 14px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{label}</span>
                                </div>
                                <button
                                    onClick={() => toggleNotification(key)}
                                    style={{
                                        padding: '4px 14px',
                                        border: 'none',
                                        borderRadius: '20px',
                                        background: notifications[key] ? '#22C55E' : 'var(--border-color)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        fontFamily: 'var(--font-family)',
                                        transition: 'all 0.2s ease',
                                        minWidth: '50px'
                                    }}
                                >
                                    {notifications[key] ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== PASSWORD SETTINGS ===== */}
                <div className="auth-card" style={{ padding: '24px', animation: 'none', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Shield size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                            Security Credentials
                        </h3>
                    </div>

                    {successMsg && (
                        <div className="alert alert-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div className="alert alert-danger" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertCircle size={18} style={{ flexShrink: 0 }} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InputField
                            label="New Security Password"
                            name="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (formErrors.newPassword) setFormErrors(prev => ({ ...prev, newPassword: '' }));
                            }}
                            placeholder="Enter new strong password"
                            icon={Lock}
                            error={formErrors.newPassword}
                            disabled={loading}
                            required
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '4px'
                                    }}
                                >
                                    <Eye size={16} />
                                </button>
                            }
                        />

                        <InputField
                            label="Confirm New Password"
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                            }}
                            placeholder="Re-enter new password"
                            icon={Lock}
                            error={formErrors.confirmPassword}
                            disabled={loading}
                            required
                        />

                        <div style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            padding: '8px 12px',
                            background: 'var(--bg-primary)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <Key size={14} style={{ display: 'inline', marginRight: '6px' }} />
                            Password must be at least 8 characters with one uppercase letter and one number.
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <Button type="submit" loading={loading} style={{ width: '200px' }}>
                                <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
                                Change Password
                            </Button>
                        </div>
                    </form>
                </div>

                {/* ===== ACCOUNT ACTIONS ===== */}
                <div className="auth-card" style={{ padding: '24px', animation: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <LogOut size={20} style={{ color: 'var(--danger-color)' }} />
                        <h3 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                            Account Actions
                        </h3>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/my-profile')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 16px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                background: 'var(--bg-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s ease',
                                flex: 1
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                                e.currentTarget.style.background = 'var(--primary-color)10';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.background = 'var(--bg-primary)';
                            }}
                        >
                            <User size={16} /> View Profile
                        </button>
                        <button
                            onClick={handleSignOut}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 16px',
                                border: '1px solid var(--danger-color)',
                                borderRadius: '8px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-family)',
                                color: 'var(--danger-color)',
                                transition: 'all 0.2s ease',
                                flex: 1
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--danger-color)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--danger-color)';
                            }}
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>

                {/* ===== VERSION INFO ===== */}
                <div style={{
                    textAlign: 'center',
                    padding: '16px',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '16px'
                }}>
                    <SettingsIcon size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    Subhan Care Hospital v2.0.0 • © 2026
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;