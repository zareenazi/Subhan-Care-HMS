import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    User, Mail, Phone, Shield, Bell, Moon, Sun,
    Globe, Lock, Key, Save, AlertCircle, Check,
    X, Edit2, UserCog, Database, Server,
    Clock, Calendar, Activity, Smartphone,
    Monitor, Wifi, RefreshCw, Loader,
    DollarSign, CreditCard, Building, Users,
    Trash2, Download, LogOut, Camera,
    History, Fingerprint, MessageSquare,
    Settings as SettingsIcon, ArrowLeft,
    Palette, Volume2, VolumeX, UserCircle,
    MapPin, Briefcase, Award, Stethoscope,
    FileText, Droplet, Heart, Home, Menu,
    Eye, Send, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

// ===== TRANSLATIONS =====
const translations = {
    en: {
        backToDashboard: 'Back to Dashboard',
        settings: 'Settings',
        saveChanges: 'Save Changes',
        cancel: 'Cancel',
        loading: 'Loading...',
        themePreference: 'Theme Preference',
        themeDescription: 'Choose between light, dark, or system default mode.',
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',
        systemMode: 'System Default',
        currentTheme: 'Current theme',
        light: 'Light',
        dark: 'Dark',
        system: 'System',
        profileInformation: 'Profile Information',
        profileSettings: 'Profile Settings',
        personalInformation: 'Personal Information',
        fullName: 'Full Name',
        phoneNumber: 'Phone Number',
        cnic: 'CNIC / ID Number',
        dateOfBirth: 'Date of Birth',
        gender: 'Gender',
        bloodGroup: 'Blood Group',
        religion: 'Religion',
        nationality: 'Nationality',
        employmentDetails: 'Employment Details',
        role: 'Role',
        department: 'Department',
        shift: 'Shift',
        joiningDate: 'Joining Date',
        salary: 'Salary',
        specialization: 'Specialization',
        qualification: 'Qualification',
        experience: 'Experience (Years)',
        licenseNumber: 'License Number',
        addressEmergency: 'Address & Emergency',
        address: 'Address',
        emergencyContact: 'Emergency Contact Name',
        emergencyPhone: 'Emergency Phone',
        bioAbout: 'Bio / About',
        bioPlaceholder: 'Tell us about yourself...',
        languagePreference: 'Language Preference',
        languageDescription: 'Select your preferred language for the interface.',
        notificationPreferences: 'Notification Preferences',
        notificationDescription: 'Configure how you want to receive notifications.',
        emailNotifications: 'Email Notifications',
        pushNotifications: 'Push Notifications',
        smsAlerts: 'SMS Alerts',
        on: 'ON',
        off: 'OFF',
        securityCredentials: 'Security Credentials',
        newPassword: 'New Security Password',
        confirmPassword: 'Confirm New Password',
        passwordPlaceholder: 'Enter new strong password',
        confirmPlaceholder: 'Re-enter new password',
        passwordHint: 'Password must be at least 8 characters with one uppercase letter and one number.',
        changePassword: 'Change Password',
        accountActions: 'Account Actions',
        viewProfile: 'View Profile',
        signOut: 'Sign Out',
        settingsSaved: '✅ Settings saved successfully!',
        passwordChanged: '✅ Password changed successfully!',
        saveError: 'Failed to save settings.',
        passwordError: 'Failed to change password.',
        signOutError: 'Failed to sign out',
        passwordRequired: 'Password is required',
        passwordLength: 'Password must be at least 8 characters',
        passwordStrength: 'Must contain at least one uppercase letter and one number',
        passwordMatch: 'Passwords do not match',
        version: 'Subhan Care Hospital v2.0.0 • © 2026',
        namePlaceholder: 'Your full name',
        phonePlaceholder: 'e.g. 03001234567',
        cnicPlaceholder: 'xxxxx-xxxxxxx-x',
        religionPlaceholder: 'e.g. Islam',
        nationalityPlaceholder: 'e.g. Pakistani',
        salaryPlaceholder: 'e.g. 50000',
        specializationPlaceholder: 'e.g. Cardiology',
        qualificationPlaceholder: 'e.g. MBBS, FCPS',
        experiencePlaceholder: 'e.g. 5',
        licensePlaceholder: 'e.g. PMC-12345',
        addressPlaceholder: 'Enter your address',
        emergencyContactPlaceholder: 'e.g. Sara Khan',
        emergencyPhonePlaceholder: 'e.g. 0300-9876543',
        selectRole: 'Select Role',
        selectDepartment: 'Select Department',
        selectShift: 'Select Shift',
        selectGender: 'Select Gender',
        selectBloodGroup: 'Select Blood Group',
        admin: 'Administrator',
        doctor: 'Doctor',
        receptionist: 'Receptionist',
        pharmacist: 'Pharmacist',
        billingStaff: 'Billing Staff',
        administration: 'Administration',
        medical: 'Medical',
        pharmacy: 'Pharmacy',
        billing: 'Billing',
        nursing: 'Nursing',
        laboratory: 'Laboratory',
        radiology: 'Radiology',
        inventory: 'Inventory',
        it: 'IT',
        security: 'Security',
        morning: 'Morning',
        evening: 'Evening',
        night: 'Night',
        rotating: 'Rotating',
        male: 'Male',
        female: 'Female',
        other: 'Other',
        aPositive: 'A+',
        aNegative: 'A-',
        bPositive: 'B+',
        bNegative: 'B-',
        abPositive: 'AB+',
        abNegative: 'AB-',
        oPositive: 'O+',
        oNegative: 'O-',
        security: 'Security',
        preferences: 'Preferences',
        notifications: 'Notifications',
        account: 'Account',
        twoFactorAuth: 'Two-Factor Authentication',
        twoFactorDesc: 'Adds an extra layer of security to your account',
        enabled: 'Enabled',
        disabled: 'Disabled',
        exportData: 'Export Data',
        exportDesc: 'Download a copy of your personal data in JSON format',
        deleteAccount: 'Delete Account',
        deleteDesc: 'Permanently delete your account and all associated data. This action cannot be undone.',
        confirmDelete: 'To confirm deletion, type DELETE below:',
        typeDelete: 'Type DELETE to confirm',
        confirmDeleteBtn: 'Confirm Delete',
        refresh: 'Refresh',
        currentPassword: 'Current Password',
        newPasswordLabel: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        theme: 'Theme',
        language: 'Language',
        dateFormat: 'Date Format',
        timeFormat: 'Time Format',
        currency: 'Currency',
        savePreferences: 'Save Preferences',
        pushNotificationsLabel: 'Push Notifications',
        pushNotificationsDesc: 'Receive push notifications for important updates',
        emailNotificationsLabel: 'Email Notifications',
        emailNotificationsDesc: 'Receive updates via email',
        smsNotificationsLabel: 'SMS Notifications',
        smsNotificationsDesc: 'Receive updates via SMS',
        saveSettings: 'Save Settings',
        accountManagement: 'Account Management',
        signOutDesc: 'Sign out of your account from this device',
        profileUpdated: '✅ Profile updated successfully!',
        preferencesSaved: '✅ Preferences saved successfully!',
        dataExported: '✅ Data exported successfully!',
        verifyCode: 'Verify Code',
        enterCode: 'Enter verification code',
        sendCode: 'Send Code',
        codeSent: '✅ Verification code sent to your email!',
        codeVerified: '✅ Two-factor authentication enabled!',
        codeInvalid: 'Invalid verification code. Please try again.',
        codeRequired: 'Please enter the verification code',
        resendCode: 'Resend Code',
        verifying: 'Verifying...',
        sending: 'Sending...'
    },
    ur: {
        backToDashboard: 'ڈیش بورڈ پر واپس جائیں',
        settings: 'ترتیبات',
        saveChanges: 'تبدیلیاں محفوظ کریں',
        cancel: 'منسوخ کریں',
        loading: 'لوڈ ہو رہا ہے...',
        themePreference: 'تھیم کی ترجیح',
        themeDescription: 'لائٹ، ڈارک، یا سسٹم ڈیفالٹ موڈ میں سے انتخاب کریں۔',
        lightMode: 'لائٹ موڈ',
        darkMode: 'ڈارک موڈ',
        systemMode: 'سسٹم ڈیفالٹ',
        currentTheme: 'موجودہ تھیم',
        light: 'لائٹ',
        dark: 'ڈارک',
        system: 'سسٹم',
        profileInformation: 'پروفائل کی معلومات',
        profileSettings: 'پروفائل کی ترتیبات',
        personalInformation: 'ذاتی معلومات',
        fullName: 'پورا نام',
        phoneNumber: 'فون نمبر',
        cnic: 'شناختی کارڈ نمبر',
        dateOfBirth: 'تاریخ پیدائش',
        gender: 'جنس',
        bloodGroup: 'بلڈ گروپ',
        religion: 'مذہب',
        nationality: 'قومیت',
        employmentDetails: 'ملازمت کی تفصیلات',
        role: 'کردار',
        department: 'شعبہ',
        shift: 'شفٹ',
        joiningDate: 'شامل ہونے کی تاریخ',
        salary: 'تنخواہ',
        specialization: 'تخصص',
        qualification: 'تعلیم',
        experience: 'تجربہ (سال)',
        licenseNumber: 'لائسنس نمبر',
        addressEmergency: 'پتہ اور ہنگامی رابطہ',
        address: 'پتہ',
        emergencyContact: 'ہنگامی رابطہ کا نام',
        emergencyPhone: 'ہنگامی فون نمبر',
        bioAbout: 'تعارف / کے بارے میں',
        bioPlaceholder: 'اپنے بارے میں بتائیں...',
        languagePreference: 'زبان کی ترجیح',
        languageDescription: 'انٹرفیس کے لیے اپنی پسندیدہ زبان منتخب کریں۔',
        notificationPreferences: 'اطلاعات کی ترجیحات',
        notificationDescription: 'ترتیب دیں کہ آپ کیسے اطلاعات وصول کرنا چاہتے ہیں۔',
        emailNotifications: 'ای میل اطلاعات',
        pushNotifications: 'پش اطلاعات',
        smsAlerts: 'ایس ایم ایس الرٹس',
        on: 'آن',
        off: 'آف',
        securityCredentials: 'سیکیورٹی اسناد',
        newPassword: 'نیا پاس ورڈ',
        confirmPassword: 'پاس ورڈ کی تصدیق کریں',
        passwordPlaceholder: 'نیا مضبوط پاس ورڈ درج کریں',
        confirmPlaceholder: 'پاس ورڈ دوبارہ درج کریں',
        passwordHint: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے جس میں ایک بڑا حرف اور ایک نمبر ہو۔',
        changePassword: 'پاس ورڈ تبدیل کریں',
        accountActions: 'اکاؤنٹ کے اعمال',
        viewProfile: 'پروفائل دیکھیں',
        signOut: 'سائن آؤٹ کریں',
        settingsSaved: '✅ ترتیبات کامیابی سے محفوظ ہو گئیں!',
        passwordChanged: '✅ پاس ورڈ کامیابی سے تبدیل ہو گیا!',
        saveError: 'ترتیبات محفوظ کرنے میں ناکام۔',
        passwordError: 'پاس ورڈ تبدیل کرنے میں ناکام۔',
        signOutError: 'سائن آؤٹ کرنے میں ناکام',
        passwordRequired: 'پاس ورڈ درکار ہے',
        passwordLength: 'پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے',
        passwordStrength: 'کم از کم ایک بڑا حرف اور ایک نمبر ہونا چاہیے',
        passwordMatch: 'پاس ورڈ مماثل نہیں ہیں',
        version: 'سبحان کیئر ہسپتال v2.0.0 • © 2026',
        namePlaceholder: 'آپ کا پورا نام',
        phonePlaceholder: 'مثال: 03001234567',
        cnicPlaceholder: 'xxxxx-xxxxxxx-x',
        religionPlaceholder: 'مثال: اسلام',
        nationalityPlaceholder: 'مثال: پاکستانی',
        salaryPlaceholder: 'مثال: 50000',
        specializationPlaceholder: 'مثال: امراض قلب',
        qualificationPlaceholder: 'مثال: ایم بی بی ایس، ایف سی پی ایس',
        experiencePlaceholder: 'مثال: 5',
        licensePlaceholder: 'مثال: PMC-12345',
        addressPlaceholder: 'اپنا پتہ درج کریں',
        emergencyContactPlaceholder: 'مثال: سارہ خان',
        emergencyPhonePlaceholder: 'مثال: 0300-9876543',
        selectRole: 'کردار منتخب کریں',
        selectDepartment: 'شعبہ منتخب کریں',
        selectShift: 'شفٹ منتخب کریں',
        selectGender: 'جنس منتخب کریں',
        selectBloodGroup: 'بلڈ گروپ منتخب کریں',
        admin: 'منتظم',
        doctor: 'ڈاکٹر',
        receptionist: 'استقبالیہ',
        pharmacist: 'فارماسسٹ',
        billingStaff: 'بلنگ اسٹاف',
        administration: 'انتظامیہ',
        medical: 'طبی',
        pharmacy: 'فارمیسی',
        billing: 'بلنگ',
        nursing: 'نرسنگ',
        laboratory: 'لیبارٹری',
        radiology: 'ریڈیولوجی',
        inventory: 'انوینٹری',
        it: 'آئی ٹی',
        security: 'سیکیورٹی',
        morning: 'صبح',
        evening: 'شام',
        night: 'رات',
        rotating: 'گردشی',
        male: 'مرد',
        female: 'خاتون',
        other: 'دیگر',
        aPositive: 'A+',
        aNegative: 'A-',
        bPositive: 'B+',
        bNegative: 'B-',
        abPositive: 'AB+',
        abNegative: 'AB-',
        oPositive: 'O+',
        oNegative: 'O-',
        security: 'سیکیورٹی',
        preferences: 'ترجیحات',
        notifications: 'اطلاعات',
        account: 'اکاؤنٹ',
        twoFactorAuth: 'دو عنصری توثیق',
        twoFactorDesc: 'آپ کے اکاؤنٹ میں سیکورٹی کی ایک اضافی پرت شامل کرتا ہے',
        enabled: 'فعال',
        disabled: 'غیر فعال',
        exportData: 'ڈیٹا ایکسپورٹ کریں',
        exportDesc: 'اپنے ذاتی ڈیٹا کی ایک کاپی JSON فارمیٹ میں ڈاؤن لوڈ کریں',
        deleteAccount: 'اکاؤنٹ حذف کریں',
        deleteDesc: 'اپنا اکاؤنٹ اور تمام متعلقہ ڈیٹا مستقل طور پر حذف کریں۔ یہ عمل واپس نہیں کیا جا سکتا۔',
        confirmDelete: 'حذف کرنے کی تصدیق کے لیے نیچے DELETE ٹائپ کریں:',
        typeDelete: 'تصدیق کے لیے DELETE ٹائپ کریں',
        confirmDeleteBtn: 'حذف کرنے کی تصدیق کریں',
        refresh: 'ریفریش',
        currentPassword: 'موجودہ پاس ورڈ',
        newPasswordLabel: 'نیا پاس ورڈ',
        confirmNewPassword: 'نئے پاس ورڈ کی تصدیق کریں',
        theme: 'تھیم',
        language: 'زبان',
        dateFormat: 'تاریخ کی شکل',
        timeFormat: 'وقت کی شکل',
        currency: 'کرنسی',
        savePreferences: 'ترجیحات محفوظ کریں',
        pushNotificationsLabel: 'پش اطلاعات',
        pushNotificationsDesc: 'اہم اپ ڈیٹس کے لیے پش اطلاعات وصول کریں',
        emailNotificationsLabel: 'ای میل اطلاعات',
        emailNotificationsDesc: 'ای میل کے ذریعے اپ ڈیٹس وصول کریں',
        smsNotificationsLabel: 'ایس ایم ایس اطلاعات',
        smsNotificationsDesc: 'ایس ایم ایس کے ذریعے اپ ڈیٹس وصول کریں',
        saveSettings: 'ترتیبات محفوظ کریں',
        accountManagement: 'اکاؤنٹ مینجمنٹ',
        signOutDesc: 'اس ڈیوائس سے اپنے اکاؤنٹ سے سائن آؤٹ کریں',
        profileUpdated: '✅ پروفائل کامیابی سے اپ ڈیٹ ہو گیا!',
        preferencesSaved: '✅ ترجیحات کامیابی سے محفوظ ہو گئیں!',
        dataExported: '✅ ڈیٹا کامیابی سے ایکسپورٹ ہو گیا!',
        verifyCode: 'کوڈ کی تصدیق کریں',
        enterCode: 'تصدیقی کوڈ درج کریں',
        sendCode: 'کوڈ بھیجیں',
        codeSent: '✅ تصدیقی کوڈ آپ کی ای میل پر بھیج دیا گیا!',
        codeVerified: '✅ دو عنصری توثیق فعال ہو گئی!',
        codeInvalid: 'غلط تصدیقی کوڈ۔ براہ کرم دوبارہ کوشش کریں۔',
        codeRequired: 'براہ کرم تصدیقی کوڈ درج کریں',
        resendCode: 'کوڈ دوبارہ بھیجیں',
        verifying: 'تصدیق ہو رہی ہے...',
        sending: 'بھیجا جا رہا ہے...'
    }
};

const Settings = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    // ===== STATE =====
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [currentLanguage, setCurrentLanguage] = useState(localStorage.getItem('language') || 'en');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [touched, setTouched] = useState({});
    const [formErrors, setFormErrors] = useState({});

    // ===== 2FA STATE =====
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [show2FADialog, setShow2FADialog] = useState(false);
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [isVerifyingCode, setIsVerifyingCode] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [generatedCode, setGeneratedCode] = useState('');

    const t = translations[currentLanguage] || translations.en;

    // ===== PASSWORD STATE =====
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // ===== PROFILE SETTINGS (COMPLETE) =====
    const [profile, setProfile] = useState({
        name: user?.user_metadata?.name || '',
        email: user?.email || '',
        phone: user?.user_metadata?.phone || '',
        role: user?.user_metadata?.role || 'User',
        department: '',
        hospital: 'Subhan Care Clinic',
        bio: '',
        smsNotifications: false,
        emailNotifications: true,
        notifications: true,
        twoFactorAuth: false,
        cnic: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        religion: '',
        nationality: '',
        shift: 'Morning',
        joining_date: '',
        salary: '',
        specialization: '',
        qualification: '',
        experience: '',
        license_number: '',
        address: '',
        emergency_contact: '',
        emergency_phone: ''
    });

    // ===== PREFERENCES =====
    const [preferences, setPreferences] = useState({
        theme: localStorage.getItem('theme') || 'light',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        currency: 'PKR',
        language: 'English'
    });

    // ===== NOTIFICATIONS =====
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false
    });

    // ===== LOGIN HISTORY =====
    const [loginHistory] = useState([
        { device: 'Chrome on Windows', ip: '192.168.1.1', time: new Date(), active: true },
        { device: 'Safari on iPhone', ip: '192.168.1.2', time: new Date(Date.now() - 86400000), active: false }
    ]);

    // ===== TABS =====
    const tabs = [
        { id: 'profile', label: t.profileSettings || 'Profile', icon: User },
        { id: 'security', label: t.security || 'Security', icon: Shield },
        { id: 'preferences', label: t.preferences || 'Preferences', icon: Globe },
        { id: 'notifications', label: t.notifications || 'Notifications', icon: Bell },
        { id: 'account', label: t.account || 'Account', icon: UserCog }
    ];

    // ===== RESPONSIVE =====
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== APPLY THEME =====
    const applyTheme = (themeValue) => {
        const currentTheme = themeValue || preferences.theme || theme;

        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else if (currentTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else if (currentTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            localStorage.setItem('theme', 'system');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    };

    // ===== INITIAL THEME APPLICATION =====
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        setPreferences(prev => ({ ...prev, theme: savedTheme }));
        applyTheme(savedTheme);
    }, []);

    // ===== SYSTEM THEME LISTENER =====
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            const currentTheme = preferences.theme || theme;
            if (currentTheme === 'system') {
                if (e.matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [preferences.theme, theme]);

    // ===== RESEND TIMER =====
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    // ===== LOAD PROFILE =====
    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        setFetchLoading(true);
        setErrorMsg('');
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.log('Profile table not found or no data, using metadata');
                const meta = user?.user_metadata || {};
                setProfile(prev => ({
                    ...prev,
                    name: meta.name || user?.email?.split('@')[0] || 'Staff User',
                    email: user?.email || '',
                    phone: meta.phone || '',
                    role: meta.role || 'User',
                    department: meta.department || '',
                    hospital: meta.hospital || 'Subhan Care Clinic',
                    bio: meta.bio || '',
                    twoFactorAuth: meta.two_factor_auth || false,
                    cnic: meta.cnic || '',
                    date_of_birth: meta.date_of_birth || '',
                    gender: meta.gender || '',
                    blood_group: meta.blood_group || '',
                    religion: meta.religion || '',
                    nationality: meta.nationality || '',
                    shift: meta.shift || 'Morning',
                    joining_date: meta.joining_date || '',
                    salary: meta.salary || '',
                    specialization: meta.specialization || '',
                    qualification: meta.qualification || '',
                    experience: meta.experience || '',
                    license_number: meta.license_number || '',
                    address: meta.address || '',
                    emergency_contact: meta.emergency_contact || '',
                    emergency_phone: meta.emergency_phone || ''
                }));
                setIs2FAEnabled(meta.two_factor_auth || false);
            } else if (data) {
                setProfile({
                    name: data.name || user?.user_metadata?.name || '',
                    email: data.email || user?.email || '',
                    phone: data.phone || user?.user_metadata?.phone || '',
                    role: data.role || user?.user_metadata?.role || 'User',
                    department: data.department || '',
                    hospital: data.hospital || 'Subhan Care Clinic',
                    bio: data.bio || '',
                    smsNotifications: data.sms_notifications || false,
                    emailNotifications: data.email_notifications !== undefined ? data.email_notifications : true,
                    notifications: data.notifications !== undefined ? data.notifications : true,
                    twoFactorAuth: data.two_factor_auth || false,
                    cnic: data.cnic || '',
                    date_of_birth: data.date_of_birth || '',
                    gender: data.gender || '',
                    blood_group: data.blood_group || '',
                    religion: data.religion || '',
                    nationality: data.nationality || '',
                    shift: data.shift || 'Morning',
                    joining_date: data.joining_date || '',
                    salary: data.salary || '',
                    specialization: data.specialization || '',
                    qualification: data.qualification || '',
                    experience: data.experience || '',
                    license_number: data.license_number || '',
                    address: data.address || '',
                    emergency_contact: data.emergency_contact || '',
                    emergency_phone: data.emergency_phone || ''
                });
                setIs2FAEnabled(data.two_factor_auth || false);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            setErrorMsg('Could not load profile data');
        } finally {
            setFetchLoading(false);
        }
    };

    // ===== GENERATE 2FA CODE =====
    const generate2FACode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString();
    };

    // ===== SEND 2FA CODE - Supabase OTP (UPDATED) =====
    const handleSend2FACode = async () => {
        setIsSendingCode(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const code = generate2FACode();
            setGeneratedCode(code);

            // 🔥 Supabase OTP se email bhejein (Client-side par kaam karega!)
            const { error } = await supabase.auth.signInWithOtp({
                email: user.email,
                options: {
                    emailRedirectTo: window.location.origin + '/settings',
                    data: {
                        code: code,
                        purpose: '2fa_verification'
                    }
                }
            });

            if (error) {
                console.error('OTP error:', error);
                // Fallback: code screen par dikhao
                setSuccessMsg(`📋 Your verification code is: ${code}`);
            } else {
                setSuccessMsg(`✅ Verification code sent to ${user.email}!`);
            }

            setCodeSent(true);
            setResendTimer(60);
            setTwoFactorCode('');
            setTimeout(() => setSuccessMsg(''), 5000);
        } catch (err) {
            console.error('Send error:', err);
            setErrorMsg('Failed to send verification code. Please try again.');
        } finally {
            setIsSendingCode(false);
        }
    };

    // ===== VERIFY 2FA CODE =====
    const handleVerify2FACode = async () => {
        if (!twoFactorCode.trim()) {
            setErrorMsg(t.codeRequired || 'Please enter the verification code');
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        if (twoFactorCode !== generatedCode) {
            setErrorMsg(t.codeInvalid || 'Invalid verification code. Please try again.');
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        setIsVerifyingCode(true);
        setErrorMsg('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    two_factor_auth: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            await supabase.auth.updateUser({
                data: {
                    two_factor_auth: true
                }
            });

            setProfile(prev => ({ ...prev, twoFactorAuth: true }));
            setIs2FAEnabled(true);
            setShow2FADialog(false);
            setTwoFactorCode('');
            setCodeSent(false);
            setGeneratedCode('');

            setSuccessMsg(t.codeVerified || '✅ Two-factor authentication enabled!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg('Failed to enable two-factor authentication: ' + err.message);
            console.error('Verify error:', err);
        } finally {
            setIsVerifyingCode(false);
        }
    };

    // ===== DISABLE 2FA =====
    const handleDisable2FA = async () => {
        if (!window.confirm('Are you sure you want to disable two-factor authentication?')) {
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    two_factor_auth: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            await supabase.auth.updateUser({
                data: {
                    two_factor_auth: false
                }
            });

            setProfile(prev => ({ ...prev, twoFactorAuth: false }));
            setIs2FAEnabled(false);

            setSuccessMsg('✅ Two-factor authentication disabled!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg('Failed to disable two-factor authentication: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ===== TOGGLE 2FA =====
    const handleToggle2FA = () => {
        if (is2FAEnabled) {
            handleDisable2FA();
        } else {
            setShow2FADialog(true);
            setGeneratedCode('');
            setCodeSent(false);
            setTwoFactorCode('');
        }
    };

    // ===== SAVE PROFILE =====
    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();

        if (!profile.name.trim()) {
            setErrorMsg('Please enter your name');
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { error: metadataError } = await supabase.auth.updateUser({
                data: {
                    name: profile.name,
                    phone: profile.phone,
                    role: profile.role,
                    department: profile.department,
                    hospital: profile.hospital,
                    bio: profile.bio,
                    two_factor_auth: profile.twoFactorAuth,
                    cnic: profile.cnic,
                    date_of_birth: profile.date_of_birth,
                    gender: profile.gender,
                    blood_group: profile.blood_group,
                    religion: profile.religion,
                    nationality: profile.nationality,
                    shift: profile.shift,
                    joining_date: profile.joining_date,
                    salary: profile.salary,
                    specialization: profile.specialization,
                    qualification: profile.qualification,
                    experience: profile.experience,
                    license_number: profile.license_number,
                    address: profile.address,
                    emergency_contact: profile.emergency_contact,
                    emergency_phone: profile.emergency_phone
                }
            });

            if (metadataError) throw metadataError;

            const profileData = {
                id: user.id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                role: profile.role,
                department: profile.department,
                hospital: profile.hospital,
                bio: profile.bio,
                sms_notifications: profile.smsNotifications,
                email_notifications: profile.emailNotifications,
                notifications: profile.notifications,
                two_factor_auth: profile.twoFactorAuth,
                cnic: profile.cnic,
                date_of_birth: profile.date_of_birth,
                gender: profile.gender,
                blood_group: profile.blood_group,
                religion: profile.religion,
                nationality: profile.nationality,
                shift: profile.shift,
                joining_date: profile.joining_date,
                salary: profile.salary,
                specialization: profile.specialization,
                qualification: profile.qualification,
                experience: profile.experience,
                license_number: profile.license_number,
                address: profile.address,
                emergency_contact: profile.emergency_contact,
                emergency_phone: profile.emergency_phone,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(profileData);

            if (error && error.code !== '42P01') {
                throw error;
            }

            setSuccessMsg(t.profileUpdated || '✅ Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Save error:', err);
            setErrorMsg('Failed to update profile: ' + err.message);
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    // ===== HANDLE PROFILE CHANGE =====
    const handleProfileChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleProfileBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    // ===== VALIDATE FIELD =====
    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'name':
                if (!value || !value.trim()) {
                    error = 'Full name is required';
                } else if (value.trim().length < 2) {
                    error = 'Name must be at least 2 characters';
                }
                break;
            case 'phone':
                if (value && value.trim() && !/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = 'Enter a valid phone number';
                }
                break;
            case 'cnic':
                if (value && value.trim() && !/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(value.trim())) {
                    error = 'Enter valid CNIC format (xxxxx-xxxxxxx-x)';
                }
                break;
            case 'experience':
                if (value && value.trim() && !/^[0-9]+$/.test(value.trim())) {
                    error = 'Experience must be a number';
                }
                break;
            case 'salary':
                if (value && value.trim() && !/^[0-9,]+$/.test(value.trim().replace(/,/g, ''))) {
                    error = 'Salary must be a number';
                }
                break;
            case 'emergency_phone':
                if (value && value.trim() && !/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = 'Enter a valid emergency phone number';
                }
                break;
            default:
                break;
        }
        return error;
    };

    // ===== PASSWORD HANDLERS =====
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validatePasswordForm = () => {
        const errors = {};
        if (!passwordData.currentPassword) {
            errors.currentPassword = 'Current password is required';
        }
        if (!passwordData.newPassword) {
            errors.newPassword = 'New password is required';
        } else if (passwordData.newPassword.length < 8) {
            errors.newPassword = 'Password must be at least 8 characters';
        } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(passwordData.newPassword)) {
            errors.newPassword = 'Must contain at least one uppercase letter and one number';
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;

        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) {
                if (error.message.includes('password')) {
                    throw new Error('Current password is incorrect or new password is not valid');
                }
                throw error;
            }

            setSuccessMsg(t.passwordChanged || '✅ Password updated successfully!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(t.passwordError || 'Failed to update password: ' + err.message);
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            setSaving(false);
        }
    };

    // ===== HANDLE PREFERENCE CHANGE =====
    const handlePreferenceChange = (e) => {
        const { name, value } = e.target;
        setPreferences(prev => ({ ...prev, [name]: value }));
        if (name === 'theme') {
            setTheme(value);
            if (value === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else if (value === 'light') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            } else if (value === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (prefersDark) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                localStorage.setItem('theme', 'system');
            }
        }
    };

    // ===== THEME HANDLERS =====
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        setPreferences(prev => ({ ...prev, theme: newTheme }));
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (newTheme === 'light') {
            document.documentElement.removeAttribute('data-theme');
        } else if (newTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }
    };

    // ===== TOGGLE NOTIFICATION =====
    const toggleNotification = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        setProfile(prev => ({
            ...prev,
            [`${key}Notifications`]: !prev[`${key}Notifications`]
        }));
    };

    // ===== HANDLE LANGUAGE CHANGE =====
    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setCurrentLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
        window.dispatchEvent(new Event('languageChanged'));
    };

    // ===== EXPORT DATA =====
    const handleExportData = () => {
        const data = {
            user: {
                name: profile.name,
                email: profile.email,
                phone: profile.phone,
                role: profile.role,
                department: profile.department,
                hospital: profile.hospital,
                bio: profile.bio,
                cnic: profile.cnic,
                date_of_birth: profile.date_of_birth,
                gender: profile.gender,
                blood_group: profile.blood_group,
                religion: profile.religion,
                nationality: profile.nationality,
                shift: profile.shift,
                joining_date: profile.joining_date,
                salary: profile.salary,
                specialization: profile.specialization,
                qualification: profile.qualification,
                experience: profile.experience,
                license_number: profile.license_number,
                address: profile.address,
                emergency_contact: profile.emergency_contact,
                emergency_phone: profile.emergency_phone,
                twoFactorAuth: is2FAEnabled
            },
            preferences: preferences,
            notifications: notifications,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccessMsg(t.dataExported || '✅ Data exported successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    // ===== DELETE ACCOUNT =====
    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            setErrorMsg('Please type "DELETE" to confirm');
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            try {
                await supabase.from('profiles').delete().eq('id', user.id);
            } catch (e) { }

            const { error } = await supabase.auth.admin.deleteUser(user.id);
            if (error) throw error;

            await signOut();
            navigate('/login');
        } catch (err) {
            setErrorMsg('Failed to delete account: ' + err.message);
            setSaving(false);
        }
    };

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== RENDER INPUT =====
    const renderSettingsInput = (name, label, type = 'text', placeholder = '', required = false, options = null) => {
        const hasError = formErrors[name] && touched[name];
        const value = profile[name] || '';

        if (type === 'select' && options) {
            return (
                <div className="form-group" key={name} style={{ marginBottom: '14px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <select
                        name={name}
                        value={value}
                        onChange={handleProfileChange}
                        onBlur={handleProfileBlur}
                        style={{
                            width: '100%',
                            height: '42px',
                            padding: '0 14px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            appearance: 'none',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">Select</option>
                        {options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                    {hasError && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={14} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        if (type === 'textarea') {
            return (
                <div className="form-group" key={name} style={{ marginBottom: '14px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <textarea
                        name={name}
                        value={value}
                        onChange={handleProfileChange}
                        onBlur={handleProfileBlur}
                        placeholder={placeholder}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            resize: 'vertical',
                            minHeight: '80px',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease'
                        }}
                    />
                    {hasError && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={14} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        if (type === 'date') {
            return (
                <div className="form-group" key={name} style={{ marginBottom: '14px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: '4px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                    </label>
                    <input
                        name={name}
                        type="date"
                        value={value}
                        onChange={handleProfileChange}
                        onBlur={handleProfileBlur}
                        style={{
                            width: '100%',
                            height: '42px',
                            padding: '0 14px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            boxSizing: 'border-box',
                            transition: 'all 0.2s ease'
                        }}
                    />
                    {hasError && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--danger-color)',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <AlertCircle size={14} />
                            {formErrors[name]}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="form-group" key={name} style={{ marginBottom: '14px' }}>
                <label style={{
                    display: 'block',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                }}>
                    {label} {required && <span style={{ color: 'var(--danger-color)' }}>*</span>}
                </label>
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleProfileChange}
                    onBlur={handleProfileBlur}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 14px',
                        border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxSizing: 'border-box',
                        transition: 'all 0.2s ease'
                    }}
                />
                {hasError && (
                    <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--danger-color)',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <AlertCircle size={14} />
                        {formErrors[name]}
                    </div>
                )}
            </div>
        );
    };

    // ===== OPTIONS =====
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genders = ['Male', 'Female', 'Other'];
    const shifts = ['Morning', 'Evening', 'Night', 'Rotating'];
    const roles = ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Billing Staff', 'User'];
    const departments = ['Administration', 'Medical', 'Pharmacy', 'Billing', 'Nursing',
        'Laboratory', 'Radiology', 'Inventory', 'IT', 'Security'];
    const languages = [
        { code: 'en', label: 'English' },
        { code: 'ur', label: 'اردو' }
    ];

    const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
    const userEmail = user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    // ===== RENDER 2FA DIALOG =====
    const render2FADialog = () => {
        if (!show2FADialog) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}>
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    padding: isMobile ? '20px' : '32px',
                    maxWidth: '450px',
                    width: '100%',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <ShieldCheck size={24} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                {t.twoFactorAuth || 'Two-Factor Authentication'}
                            </h3>
                        </div>
                        <button
                            onClick={() => {
                                setShow2FADialog(false);
                                setCodeSent(false);
                                setGeneratedCode('');
                                setTwoFactorCode('');
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                fontSize: '1.5rem'
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                        {t.twoFactorDesc || 'Adds an extra layer of security to your account'}
                    </p>

                    {!codeSent ? (
                        <button
                            onClick={handleSend2FACode}
                            disabled={isSendingCode}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: 'none',
                                borderRadius: '10px',
                                background: isSendingCode ? 'var(--primary-color)70' : 'var(--primary-color)',
                                color: 'white',
                                cursor: isSendingCode ? 'not-allowed' : 'pointer',
                                fontSize: '0.95rem',
                                fontFamily: 'var(--font-family)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Send size={18} />
                            {isSendingCode ? t.sending || 'Sending...' : t.sendCode || 'Send Code'}
                        </button>
                    ) : (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.85rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '4px'
                                }}>
                                    {t.enterCode || 'Enter verification code'}
                                </label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={twoFactorCode}
                                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        style={{
                                            flex: 1,
                                            height: '48px',
                                            padding: '0 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '1.1rem',
                                            fontFamily: 'var(--font-family)',
                                            outline: 'none',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            textAlign: 'center',
                                            letterSpacing: '4px',
                                            fontWeight: 600
                                        }}
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '8px',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    <span>
                                        {resendTimer > 0 ? (
                                            `Resend available in ${resendTimer}s`
                                        ) : (
                                            <button
                                                onClick={handleSend2FACode}
                                                disabled={isSendingCode}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: 'var(--primary-color)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    fontFamily: 'var(--font-family)',
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                {t.resendCode || 'Resend Code'}
                                            </button>
                                        )}
                                    </span>
                                    <span>Code sent to {user.email}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={handleVerify2FACode}
                                    disabled={isVerifyingCode || !twoFactorCode.trim()}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        background: isVerifyingCode || !twoFactorCode.trim() ? 'var(--primary-color)70' : 'var(--primary-color)',
                                        color: 'white',
                                        cursor: isVerifyingCode || !twoFactorCode.trim() ? 'not-allowed' : 'pointer',
                                        fontSize: '0.95rem',
                                        fontFamily: 'var(--font-family)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <ShieldCheck size={18} />
                                    {isVerifyingCode ? t.verifying || 'Verifying...' : t.verifyCode || 'Verify Code'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShow2FADialog(false);
                                        setCodeSent(false);
                                        setGeneratedCode('');
                                        setTwoFactorCode('');
                                    }}
                                    style={{
                                        padding: '12px 20px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        fontFamily: 'var(--font-family)',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    {t.cancel || 'Cancel'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // ============================================================
    // ===== MAIN RENDER =====
    // ============================================================

    if (fetchLoading) {
        return (
            <DashboardLayout active="settings" title={t.settings || 'Settings'} showSearch={false}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '60vh',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>{t.loading || 'Loading settings...'}</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout active="settings" title={t.settings || 'Settings'} showSearch={false}>
            <div style={{
                maxWidth: '1100px',
                margin: '0 auto',
                padding: isMobile ? '0 12px' : '0 24px'
            }}>
                {/* BACK BUTTON */}
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={goBack}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: isMobile ? '12px 18px' : '10px 20px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: isMobile ? '0.85rem' : '0.9rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)',
                            transition: 'all 0.2s ease',
                            width: isMobile ? '100%' : 'auto',
                            justifyContent: isMobile ? 'center' : 'flex-start',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <ArrowLeft size={18} /> {t.backToDashboard || 'Back to Dashboard'}
                    </button>
                </div>

                {/* USER INFO */}
                <div style={{
                    padding: isMobile ? '16px 20px' : '24px 32px',
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        flex: 1
                    }}>
                        <div style={{
                            width: isMobile ? '56px' : '80px',
                            height: isMobile ? '56px' : '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary-color), #7C3AED)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? '1.3rem' : '2rem',
                            fontWeight: 600,
                            flexShrink: 0,
                            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.25)'
                        }}>
                            {userInitial}
                        </div>
                        <div>
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '1rem' : '1.3rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>
                                {userName}
                            </h3>
                            <p style={{
                                fontSize: isMobile ? '0.8rem' : '0.95rem',
                                color: 'var(--text-muted)',
                                margin: '4px 0 0 0'
                            }}>
                                {userEmail}
                            </p>
                            <p style={{
                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                color: 'var(--text-secondary)',
                                margin: '2px 0 0 0'
                            }}>
                                {t.role || 'Role'}: {profile.role || 'User'}
                                {is2FAEnabled && (
                                    <span style={{
                                        marginLeft: '10px',
                                        background: 'var(--success-color)20',
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.65rem',
                                        color: 'var(--success-color)',
                                        fontWeight: 600
                                    }}>
                                        🔒 2FA Enabled
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadProfile}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-family)',
                            color: 'var(--text-secondary)'
                        }}
                    >
                        <RefreshCw size={14} /> {t.refresh || 'Refresh'}
                    </button>
                </div>

                {/* MESSAGES */}
                {errorMsg && (
                    <div style={{
                        padding: '10px 14px', borderRadius: '8px', display: 'flex',
                        alignItems: 'center', gap: '8px', marginBottom: '16px',
                        background: '#EF444415', border: '1px solid #EF444430',
                        color: '#EF4444', fontSize: '0.85rem'
                    }}>
                        <AlertCircle size={16} /> {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div style={{
                        padding: '10px 14px', borderRadius: '8px', display: 'flex',
                        alignItems: 'center', gap: '8px', marginBottom: '16px',
                        background: '#22C55E15', border: '1px solid #22C55E30',
                        color: '#16A34A', fontSize: '0.85rem'
                    }}>
                        <Check size={16} /> {successMsg}
                    </div>
                )}

                {/* TABS */}
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '20px',
                    background: 'var(--bg-primary)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    overflowX: 'auto',
                    flexWrap: 'nowrap'
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: isActive ? 'var(--primary-color)' : 'transparent',
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '0.75rem' : '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: isActive ? 600 : 400,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Icon size={isMobile ? 16 : 18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ===== PROFILE TAB ===== */}
                {activeTab === 'profile' && (
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                            <UserCircle size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '1rem' : '1.1rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>{t.profileInformation || 'Profile Information'}</h3>
                        </div>

                        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {/* Personal Information */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '12px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '10px'
                                }}>
                                    <User size={16} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.personalInformation || 'Personal Information'}</span>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: isMobile ? '12px' : '16px'
                                }}>
                                    {renderSettingsInput('name', t.fullName || 'Full Name', 'text', t.namePlaceholder || 'Your full name', true)}
                                    <div className="form-group" style={{ marginBottom: '14px' }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)',
                                            marginBottom: '4px'
                                        }}>Email</label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            style={{
                                                width: '100%',
                                                height: '42px',
                                                padding: '0 14px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '10px',
                                                fontSize: '0.9rem',
                                                fontFamily: 'inherit',
                                                outline: 'none',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-muted)',
                                                boxSizing: 'border-box',
                                                cursor: 'not-allowed',
                                                opacity: 0.7
                                            }}
                                        />
                                    </div>
                                    {renderSettingsInput('phone', t.phoneNumber || 'Phone Number', 'text', t.phonePlaceholder || 'e.g. 03001234567')}
                                    {renderSettingsInput('cnic', t.cnic || 'CNIC / ID Number', 'text', t.cnicPlaceholder || 'xxxxx-xxxxxxx-x')}
                                    {renderSettingsInput('date_of_birth', t.dateOfBirth || 'Date of Birth', 'date', '')}
                                    {renderSettingsInput('gender', t.gender || 'Gender', 'select', '', false, genders)}
                                    {renderSettingsInput('blood_group', t.bloodGroup || 'Blood Group', 'select', '', false, bloodGroups)}
                                    {renderSettingsInput('religion', t.religion || 'Religion', 'text', t.religionPlaceholder || 'e.g. Islam')}
                                    {renderSettingsInput('nationality', t.nationality || 'Nationality', 'text', t.nationalityPlaceholder || 'e.g. Pakistani')}
                                </div>
                            </div>

                            {/* Employment Details */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '12px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '10px'
                                }}>
                                    <Briefcase size={16} style={{ color: 'var(--secondary-color)' }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.employmentDetails || 'Employment Details'}</span>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: isMobile ? '12px' : '16px'
                                }}>
                                    {renderSettingsInput('role', t.role || 'Role', 'select', '', true, roles)}
                                    {renderSettingsInput('department', t.department || 'Department', 'select', '', false, departments)}
                                    {renderSettingsInput('shift', t.shift || 'Shift', 'select', '', false, shifts)}
                                    {renderSettingsInput('joining_date', t.joiningDate || 'Joining Date', 'date', '')}
                                    {renderSettingsInput('salary', t.salary || 'Salary', 'text', t.salaryPlaceholder || 'e.g. 50000')}
                                    {renderSettingsInput('specialization', t.specialization || 'Specialization', 'text', t.specializationPlaceholder || 'e.g. Cardiology')}
                                    {renderSettingsInput('qualification', t.qualification || 'Qualification', 'text', t.qualificationPlaceholder || 'e.g. MBBS, FCPS')}
                                    {renderSettingsInput('experience', t.experience || 'Experience (Years)', 'text', t.experiencePlaceholder || 'e.g. 5')}
                                    {renderSettingsInput('license_number', t.licenseNumber || 'License Number', 'text', t.licensePlaceholder || 'e.g. PMC-12345')}
                                </div>
                            </div>

                            {/* Address & Emergency Contact */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '12px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '10px'
                                }}>
                                    <MapPin size={16} style={{ color: 'var(--warning-color)' }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.addressEmergency || 'Address & Emergency'}</span>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: isMobile ? '12px' : '16px'
                                }}>
                                    {renderSettingsInput('address', t.address || 'Address', 'textarea', t.addressPlaceholder || 'Enter your address')}
                                    {renderSettingsInput('emergency_contact', t.emergencyContact || 'Emergency Contact Name', 'text', t.emergencyContactPlaceholder || 'e.g. Sara Khan')}
                                    {renderSettingsInput('emergency_phone', t.emergencyPhone || 'Emergency Phone', 'text', t.emergencyPhonePlaceholder || 'e.g. 0300-9876543')}
                                </div>
                            </div>

                            {/* Bio */}
                            <div style={{
                                background: 'var(--bg-primary)',
                                borderRadius: '12px',
                                padding: isMobile ? '12px' : '16px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '10px'
                                }}>
                                    <FileText size={16} style={{ color: 'var(--purple-color)' }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t.bioAbout || 'Bio / About'}</span>
                                </div>

                                {renderSettingsInput('bio', t.bioAbout || 'Bio / About', 'textarea', t.bioPlaceholder || 'Tell us about yourself...')}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                marginTop: '8px',
                                paddingTop: '18px',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <Button type="submit" loading={saving} style={{
                                    width: isMobile ? '100%' : 'auto',
                                    padding: isMobile ? '14px 24px' : '12px 36px',
                                    fontSize: isMobile ? '1rem' : '0.95rem',
                                    borderRadius: '10px'
                                }}>
                                    <Save size={isMobile ? 18 : 18} style={{ display: 'inline', marginRight: '8px' }} />
                                    {t.saveChanges || 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ===== SECURITY TAB ===== */}
                {activeTab === 'security' && (
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                            <Shield size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '1rem' : '1.1rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>{t.security || 'Security Settings'}</h3>
                        </div>

                        {/* Two-Factor Authentication */}
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <ShieldCheck size={16} style={{ color: 'var(--primary-color)' }} />
                                        {t.twoFactorAuth || 'Two-Factor Authentication'}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {t.twoFactorDesc || 'Adds an extra layer of security to your account'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleToggle2FA}
                                    disabled={saving}
                                    style={{
                                        padding: '8px 20px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: is2FAEnabled ? '#EF4444' : 'var(--primary-color)',
                                        color: 'white',
                                        cursor: saving ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem',
                                        fontFamily: 'var(--font-family)',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: saving ? 0.7 : 1
                                    }}
                                >
                                    {is2FAEnabled ? (
                                        <>
                                            <Lock size={14} /> {t.disabled || 'Disable'}
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={14} /> {t.enabled || 'Enable'}
                                        </>
                                    )}
                                </button>
                            </div>
                            {is2FAEnabled && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '10px 14px',
                                    background: 'var(--success-color)15',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    color: 'var(--success-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Check size={16} />
                                    Two-factor authentication is <strong>enabled</strong> on your account
                                </div>
                            )}
                        </div>

                        {/* Change Password */}
                        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <InputField
                                label={t.currentPassword || 'Current Password'}
                                name="currentPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter current password"
                                icon={Lock}
                                error={formErrors.currentPassword}
                                disabled={saving}
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
                                label={t.newPasswordLabel || 'New Password'}
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder={t.passwordPlaceholder || 'Enter new strong password'}
                                icon={Key}
                                error={formErrors.newPassword}
                                disabled={saving}
                                required
                            />

                            <InputField
                                label={t.confirmNewPassword || 'Confirm New Password'}
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder={t.confirmPlaceholder || 'Re-enter new password'}
                                icon={Key}
                                error={formErrors.confirmPassword}
                                disabled={saving}
                                required
                            />

                            <div style={{
                                fontSize: isMobile ? '0.7rem' : '0.75rem',
                                color: 'var(--text-muted)',
                                padding: '10px 14px',
                                background: 'var(--bg-primary)',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <Key size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                {t.passwordHint || 'Password must be at least 8 characters with one uppercase letter and one number.'}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: isMobile ? 'center' : 'flex-end',
                                marginTop: '4px'
                            }}>
                                <Button type="submit" loading={saving} style={{
                                    width: isMobile ? '100%' : '200px',
                                    padding: isMobile ? '14px 24px' : '12px 24px',
                                    fontSize: isMobile ? '1rem' : '0.9rem',
                                    borderRadius: '10px'
                                }}>
                                    <Lock size={isMobile ? 18 : 16} style={{ display: 'inline', marginRight: '8px' }} />
                                    {t.changePassword || 'Change Password'}
                                </Button>
                            </div>
                        </form>

                        {/* Login History */}
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            <h4 style={{
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                marginBottom: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--text-primary)'
                            }}>
                                <History size={16} style={{ color: 'var(--primary-color)' }} />
                                Login History
                            </h4>
                            {loginHistory.map((entry, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px 0',
                                    borderBottom: index < loginHistory.length - 1 ? '1px solid var(--border-color)' : 'none'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{entry.device}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{entry.ip}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {new Date(entry.time).toLocaleString()}
                                        </div>
                                        <span style={{
                                            fontSize: '0.65rem',
                                            color: entry.active ? 'var(--success-color)' : 'var(--text-muted)',
                                            fontWeight: 600
                                        }}>
                                            {entry.active ? '● Active' : '○ Inactive'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== PREFERENCES TAB ===== */}
                {activeTab === 'preferences' && (
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                            <Globe size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '1rem' : '1.1rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>{t.preferences || 'Preferences'}</h3>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {/* Theme - FIXED */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.theme || 'Theme'}</label>
                                <select
                                    name="theme"
                                    value={preferences.theme}
                                    onChange={handlePreferenceChange}
                                    style={{
                                        width: '100%', height: '40px', padding: '0 12px',
                                        border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                        fontFamily: 'var(--font-family)', fontSize: '0.85rem',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="light">☀️ {t.lightMode || 'Light'}</option>
                                    <option value="dark">🌙 {t.darkMode || 'Dark'}</option>
                                    <option value="system">💻 {t.systemMode || 'System Default'}</option>
                                </select>
                                <div style={{
                                    marginTop: '8px',
                                    padding: '8px 12px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <Monitor size={14} />
                                    {t.currentTheme || 'Current theme'}: <strong style={{ color: 'var(--text-primary)' }}>
                                        {preferences.theme === 'light' ? '☀️ ' + (t.light || 'Light') :
                                            preferences.theme === 'dark' ? '🌙 ' + (t.dark || 'Dark') :
                                                '💻 ' + (t.system || 'System')}
                                    </strong>
                                </div>
                            </div>

                            {/* Language */}
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.language || 'Language'}</label>
                                <select
                                    value={currentLanguage}
                                    onChange={handleLanguageChange}
                                    style={{
                                        width: '100%', height: '40px', padding: '0 12px',
                                        border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                        fontFamily: 'var(--font-family)', fontSize: '0.85rem',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="en">🇬🇧 English</option>
                                    <option value="ur">🇵🇰 اردو</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.dateFormat || 'Date Format'}</label>
                                <select
                                    name="dateFormat"
                                    value={preferences.dateFormat}
                                    onChange={handlePreferenceChange}
                                    style={{
                                        width: '100%', height: '40px', padding: '0 12px',
                                        border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                        fontFamily: 'var(--font-family)', fontSize: '0.85rem',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.timeFormat || 'Time Format'}</label>
                                <select
                                    name="timeFormat"
                                    value={preferences.timeFormat}
                                    onChange={handlePreferenceChange}
                                    style={{
                                        width: '100%', height: '40px', padding: '0 12px',
                                        border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                        fontFamily: 'var(--font-family)', fontSize: '0.85rem',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="12h">12-hour (AM/PM)</option>
                                    <option value="24h">24-hour</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.currency || 'Currency'}</label>
                                <select
                                    name="currency"
                                    value={preferences.currency}
                                    onChange={handlePreferenceChange}
                                    style={{
                                        width: '100%', height: '40px', padding: '0 12px',
                                        border: '1.5px solid var(--border-color)', borderRadius: '8px',
                                        fontFamily: 'var(--font-family)', fontSize: '0.85rem',
                                        background: 'var(--bg-primary)', color: 'var(--text-primary)',
                                        outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    <option value="PKR">🇵🇰 PKR</option>
                                    <option value="USD">🇺🇸 USD</option>
                                    <option value="EUR">🇪🇺 EUR</option>
                                    <option value="GBP">🇬🇧 GBP</option>
                                </select>
                            </div>
                        </div>

                        {/* Theme Toggle Buttons */}
                        <div style={{
                            marginTop: '16px',
                            display: 'flex',
                            gap: '12px',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={() => handleThemeChange('light')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: preferences.theme === 'light' ? '2px solid var(--primary-color)' : '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: preferences.theme === 'light' ? 'var(--primary-color)10' : 'var(--bg-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: preferences.theme === 'light' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    fontWeight: preferences.theme === 'light' ? 600 : 400
                                }}
                            >
                                <Sun size={18} /> {t.lightMode || 'Light Mode'}
                                {preferences.theme === 'light' && <Check size={16} style={{ color: 'var(--primary-color)' }} />}
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: preferences.theme === 'dark' ? '2px solid var(--primary-color)' : '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: preferences.theme === 'dark' ? 'var(--primary-color)10' : 'var(--bg-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: preferences.theme === 'dark' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    fontWeight: preferences.theme === 'dark' ? 600 : 400
                                }}
                            >
                                <Moon size={18} /> {t.darkMode || 'Dark Mode'}
                                {preferences.theme === 'dark' && <Check size={16} style={{ color: 'var(--primary-color)' }} />}
                            </button>
                            <button
                                onClick={() => handleThemeChange('system')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    padding: '10px 16px',
                                    border: preferences.theme === 'system' ? '2px solid var(--primary-color)' : '1.5px solid var(--border-color)',
                                    borderRadius: '10px',
                                    background: preferences.theme === 'system' ? 'var(--primary-color)10' : 'var(--bg-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    color: preferences.theme === 'system' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    fontWeight: preferences.theme === 'system' ? 600 : 400
                                }}
                            >
                                <Monitor size={18} /> {t.systemMode || 'System Default'}
                                {preferences.theme === 'system' && <Check size={16} style={{ color: 'var(--primary-color)' }} />}
                            </button>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setSuccessMsg(t.preferencesSaved || '✅ Preferences saved successfully!');
                                    setTimeout(() => setSuccessMsg(''), 3000);
                                }}
                                style={{
                                    padding: '8px 24px', border: 'none', borderRadius: '8px',
                                    background: 'var(--primary-color)',
                                    color: 'white', cursor: 'pointer',
                                    fontSize: '0.85rem', fontFamily: 'var(--font-family)',
                                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Save size={16} /> {t.savePreferences || 'Save Preferences'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== NOTIFICATIONS TAB ===== */}
                {activeTab === 'notifications' && (
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                            <Bell size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '1rem' : '1.1rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>{t.notificationPreferences || 'Notification Preferences'}</h3>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '12px'
                        }}>
                            {/* Push Notifications */}
                            <div style={{
                                padding: '16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)',
                                gridColumn: '1 / -1'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Bell size={14} style={{ color: 'var(--primary-color)' }} />
                                            {t.pushNotifications || 'Push Notifications'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {t.pushNotificationsDesc || 'Receive push notifications for important updates'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('push')}
                                        style={{
                                            padding: isMobile ? '8px 20px' : '6px 18px',
                                            border: 'none',
                                            borderRadius: '20px',
                                            background: notifications.push ? '#22C55E' : 'var(--border-color)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '0.75rem' : '0.7rem',
                                            fontWeight: 600,
                                            fontFamily: 'var(--font-family)',
                                            transition: 'all 0.2s ease',
                                            minWidth: isMobile ? '70px' : '60px'
                                        }}
                                    >
                                        {notifications.push ? (t.on || 'ON') : (t.off || 'OFF')}
                                    </button>
                                </div>
                            </div>

                            {/* Email Notifications */}
                            <div style={{
                                padding: '16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Mail size={14} style={{ color: 'var(--primary-color)' }} />
                                            {t.emailNotifications || 'Email Notifications'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {t.emailNotificationsDesc || 'Receive updates via email'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('email')}
                                        style={{
                                            padding: isMobile ? '8px 20px' : '6px 18px',
                                            border: 'none',
                                            borderRadius: '20px',
                                            background: notifications.email ? '#22C55E' : 'var(--border-color)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '0.75rem' : '0.7rem',
                                            fontWeight: 600,
                                            fontFamily: 'var(--font-family)',
                                            transition: 'all 0.2s ease',
                                            minWidth: isMobile ? '70px' : '60px'
                                        }}
                                    >
                                        {notifications.email ? (t.on || 'ON') : (t.off || 'OFF')}
                                    </button>
                                </div>
                            </div>

                            {/* SMS Notifications */}
                            <div style={{
                                padding: '16px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Smartphone size={14} style={{ color: 'var(--primary-color)' }} />
                                            {t.smsAlerts || 'SMS Alerts'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {t.smsNotificationsDesc || 'Receive updates via SMS'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleNotification('sms')}
                                        style={{
                                            padding: isMobile ? '8px 20px' : '6px 18px',
                                            border: 'none',
                                            borderRadius: '20px',
                                            background: notifications.sms ? '#22C55E' : 'var(--border-color)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '0.75rem' : '0.7rem',
                                            fontWeight: 600,
                                            fontFamily: 'var(--font-family)',
                                            transition: 'all 0.2s ease',
                                            minWidth: isMobile ? '70px' : '60px'
                                        }}
                                    >
                                        {notifications.sms ? (t.on || 'ON') : (t.off || 'OFF')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                style={{
                                    padding: '8px 24px', border: 'none', borderRadius: '8px',
                                    background: saving ? 'var(--primary-color)70' : 'var(--primary-color)',
                                    color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '0.85rem', fontFamily: 'var(--font-family)',
                                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                <Save size={16} /> {saving ? 'Saving...' : t.saveSettings || 'Save Settings'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== ACCOUNT TAB ===== */}
                {activeTab === 'account' && (
                    <div style={{
                        padding: isMobile ? '16px' : '24px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                            <UserCog size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '1rem' : '1.1rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>{t.accountManagement || 'Account Management'}</h3>
                        </div>

                        {/* Export Data */}
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Database size={16} style={{ color: 'var(--primary-color)' }} />
                                        {t.exportData || 'Export Data'}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {t.exportDesc || 'Download a copy of your personal data in JSON format'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleExportData}
                                    style={{
                                        padding: '8px 20px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: 'var(--primary-color)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontFamily: 'var(--font-family)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Download size={16} /> {t.exportData || 'Export Data'}
                                </button>
                            </div>
                        </div>

                        {/* Sign Out */}
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <LogOut size={16} style={{ color: 'var(--warning-color)' }} />
                                        {t.signOut || 'Sign Out'}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {t.signOutDesc || 'Sign out of your account from this device'}
                                    </p>
                                </div>
                                <button
                                    onClick={signOut}
                                    style={{
                                        padding: '8px 20px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '8px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontFamily: 'var(--font-family)',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <LogOut size={16} /> {t.signOut || 'Sign Out'}
                                </button>
                            </div>
                        </div>

                        {/* Delete Account */}
                        <div style={{
                            padding: '16px',
                            background: '#EF444415',
                            borderRadius: '12px',
                            border: '1px solid #EF444430'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 500, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444' }}>
                                        <AlertCircle size={16} style={{ color: '#EF4444' }} />
                                        {t.deleteAccount || 'Delete Account'}
                                    </h4>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        {t.deleteDesc || 'Permanently delete your account and all associated data. This action cannot be undone.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        padding: '8px 20px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: '#EF4444',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        fontFamily: 'var(--font-family)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Trash2 size={16} /> {t.deleteAccount || 'Delete Account'}
                                </button>
                            </div>

                            {showDeleteConfirm && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                        ⚠️ To confirm deletion, type <strong>DELETE</strong> below:
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            placeholder="Type DELETE to confirm"
                                            style={{
                                                flex: 1,
                                                height: '40px',
                                                padding: '0 12px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                fontFamily: 'var(--font-family)',
                                                fontSize: '0.85rem',
                                                background: 'var(--bg-primary)',
                                                color: 'var(--text-primary)',
                                                outline: 'none',
                                                minWidth: '150px'
                                            }}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={saving || deleteConfirmText !== 'DELETE'}
                                            style={{
                                                padding: '8px 20px',
                                                border: 'none',
                                                borderRadius: '8px',
                                                background: saving || deleteConfirmText !== 'DELETE' ? '#EF444470' : '#EF4444',
                                                color: 'white',
                                                cursor: saving || deleteConfirmText !== 'DELETE' ? 'not-allowed' : 'pointer',
                                                fontSize: '0.8rem',
                                                fontFamily: 'var(--font-family)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                opacity: saving || deleteConfirmText !== 'DELETE' ? 0.6 : 1
                                            }}
                                        >
                                            <Trash2 size={16} /> {saving ? 'Deleting...' : t.confirmDeleteBtn || 'Confirm Delete'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeleteConfirmText('');
                                            }}
                                            style={{
                                                padding: '8px 20px',
                                                border: '1.5px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontFamily: 'var(--font-family)',
                                                color: 'var(--text-secondary)'
                                            }}
                                        >
                                            {t.cancel || 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== 2FA DIALOG ===== */}
                {render2FADialog()}

                {/* ===== VERSION INFO ===== */}
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: '24px'
                }}>
                    <SettingsIcon size={16} style={{ display: 'inline', marginRight: '8px' }} />
                    Subhan Care Hospital v2.0.0 • © 2026
                </div>
            </div>

            <style>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 768px) {
                    .form-group input, .form-group select, .form-group textarea {
                        font-size: 16px !important;
                    }
                }
                input:focus, select:focus, textarea:focus {
                    outline: none;
                }
                input::placeholder, textarea::placeholder {
                    color: var(--text-muted);
                }
            `}</style>
        </DashboardLayout>
    );
};

export default Settings;