import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import InputField from '../components/InputField';
import {
    Lock, Eye, Sun, Moon, CheckCircle, AlertCircle,
    ArrowLeft, Bell, Shield, Globe, Monitor, Smartphone,
    Mail, Key, User, LogOut, Save, X, Palette,
    Settings as SettingsIcon, Volume2, VolumeX,
    UserCircle, Calendar, Clock, MapPin, Phone,
    Briefcase, Building, Award, Stethoscope, CreditCard,
    FileText, Droplet, Heart, Home, Menu
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
        themeDescription: 'Choose between light and dark mode for the hospital portal.',
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',
        currentTheme: 'Current theme',
        light: 'Light',
        dark: 'Dark',
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
        oNegative: 'O-'
    },
    ur: {
        backToDashboard: 'ڈیش بورڈ پر واپس جائیں',
        settings: 'ترتیبات',
        saveChanges: 'تبدیلیاں محفوظ کریں',
        cancel: 'منسوخ کریں',
        loading: 'لوڈ ہو رہا ہے...',
        themePreference: 'تھیم کی ترجیح',
        themeDescription: 'ہسپتال پورٹل کے لیے لائٹ اور ڈارک موڈ میں سے انتخاب کریں۔',
        lightMode: 'لائٹ موڈ',
        darkMode: 'ڈارک موڈ',
        currentTheme: 'موجودہ تھیم',
        light: 'لائٹ',
        dark: 'ڈارک',
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
        oNegative: 'O-'
    }
};

const Settings = () => {
    const { user, updatePassword, signOut, profile } = useAuth();
    const navigate = useNavigate();

    // ===== THEME STATE =====
    const [theme, setTheme] = useState('light');

    // ===== LANGUAGE STATE =====
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const t = translations[currentLanguage] || translations.en;

    // ===== PASSWORD STATE =====
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // ===== PROFILE SETTINGS =====
    const [profileSettings, setProfileSettings] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
        date_of_birth: '',
        gender: '',
        role: '',
        department: '',
        specialization: '',
        experience: '',
        qualification: '',
        license_number: '',
        address: '',
        bio: '',
        blood_group: '',
        religion: '',
        nationality: '',
        emergency_contact: '',
        emergency_phone: '',
        shift: 'Morning',
        joining_date: '',
        salary: '',
        notification_email: true,
        notification_push: true,
        notification_sms: false,
        language: 'en'
    });

    // ===== NOTIFICATIONS =====
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false
    });

    // ===== LOADING =====
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [touched, setTouched] = useState({});
    const [formErrorsSettings, setFormErrorsSettings] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // ===== GO BACK =====
    const goBack = () => {
        navigate(-1);
    };

    // ===== HANDLE RESIZE =====
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== LOAD THEME =====
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    // ===== LOAD LANGUAGE =====
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language') || 'en';
        setCurrentLanguage(savedLanguage);
    }, []);

    // ===== LOAD PROFILE SETTINGS =====
    useEffect(() => {
        const loadSettings = async () => {
            setFetchLoading(true);
            try {
                if (!user?.id) {
                    setFetchLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.log('Profile not found, using auth metadata');
                    const meta = user?.user_metadata || {};
                    setProfileSettings({
                        name: meta.name || user?.email?.split('@')[0] || 'Staff User',
                        email: user?.email || '',
                        phone: meta.phone || '',
                        cnic: meta.cnic || '',
                        date_of_birth: meta.date_of_birth || '',
                        gender: meta.gender || '',
                        role: meta.role || 'Receptionist',
                        department: meta.department || '',
                        specialization: meta.specialization || '',
                        experience: meta.experience || '',
                        qualification: meta.qualification || '',
                        license_number: meta.license_number || '',
                        address: meta.address || '',
                        bio: meta.bio || '',
                        blood_group: meta.blood_group || '',
                        religion: meta.religion || '',
                        nationality: meta.nationality || '',
                        emergency_contact: meta.emergency_contact || '',
                        emergency_phone: meta.emergency_phone || '',
                        shift: meta.shift || 'Morning',
                        joining_date: meta.joining_date || '',
                        salary: meta.salary || '',
                        notification_email: true,
                        notification_push: true,
                        notification_sms: false,
                        language: currentLanguage
                    });
                } else {
                    setProfileSettings({
                        name: data.name || '',
                        email: data.email || user?.email || '',
                        phone: data.phone || '',
                        cnic: data.cnic || '',
                        date_of_birth: data.date_of_birth || '',
                        gender: data.gender || '',
                        role: data.role || 'Receptionist',
                        department: data.department || '',
                        specialization: data.specialization || '',
                        experience: data.experience || '',
                        qualification: data.qualification || '',
                        license_number: data.license_number || '',
                        address: data.address || '',
                        bio: data.bio || '',
                        blood_group: data.blood_group || '',
                        religion: data.religion || '',
                        nationality: data.nationality || '',
                        emergency_contact: data.emergency_contact || '',
                        emergency_phone: data.emergency_phone || '',
                        shift: data.shift || 'Morning',
                        joining_date: data.joining_date || '',
                        salary: data.salary || '',
                        notification_email: true,
                        notification_push: true,
                        notification_sms: false,
                        language: currentLanguage
                    });
                }

                const savedNotifications = localStorage.getItem('notificationSettings');
                if (savedNotifications) {
                    try {
                        const parsed = JSON.parse(savedNotifications);
                        setNotifications(parsed);
                        setProfileSettings(prev => ({
                            ...prev,
                            notification_email: parsed.email !== undefined ? parsed.email : true,
                            notification_push: parsed.push !== undefined ? parsed.push : true,
                            notification_sms: parsed.sms !== undefined ? parsed.sms : false
                        }));
                    } catch (e) { }
                }

            } catch (err) {
                console.error('Error loading settings:', err);
            } finally {
                setFetchLoading(false);
            }
        };

        loadSettings();
    }, [user, currentLanguage]);

    // ===== HANDLE THEME CHANGE =====
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        window.dispatchEvent(new Event('themeChanged'));
    };

    // ===== HANDLE LANGUAGE CHANGE =====
    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value;
        setCurrentLanguage(newLanguage);
        localStorage.setItem('language', newLanguage);
        setProfileSettings(prev => ({ ...prev, language: newLanguage }));
        window.dispatchEvent(new Event('languageChanged'));
    };

    // ===== HANDLE PROFILE SETTINGS CHANGE =====
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileSettings(prev => ({ ...prev, [name]: value }));
        if (formErrorsSettings[name]) {
            setFormErrorsSettings(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleProfileBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateSettingsField(name, value);
        setFormErrorsSettings(prev => ({ ...prev, [name]: error }));
    };

    // ===== VALIDATE SETTINGS =====
    const validateSettingsField = (name, value) => {
        let error = '';

        switch (name) {
            case 'name':
                if (!value || !value.trim()) {
                    error = t.nameRequired || 'Full name is required';
                } else if (value.trim().length < 2) {
                    error = t.nameLength || 'Name must be at least 2 characters';
                }
                break;

            case 'phone':
                if (value && value.trim() && !/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = t.phoneInvalid || 'Enter a valid phone number';
                }
                break;

            case 'cnic':
                if (value && value.trim() && !/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(value.trim())) {
                    error = t.cnicInvalid || 'Enter valid CNIC format (xxxxx-xxxxxxx-x)';
                }
                break;

            case 'experience':
                if (value && value.trim() && !/^[0-9]+$/.test(value.trim())) {
                    error = t.experienceNumber || 'Experience must be a number';
                }
                break;

            case 'salary':
                if (value && value.trim() && !/^[0-9,]+$/.test(value.trim().replace(/,/g, ''))) {
                    error = t.salaryNumber || 'Salary must be a number';
                }
                break;

            case 'emergency_phone':
                if (value && value.trim() && !/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = t.phoneInvalid || 'Enter a valid emergency phone number';
                }
                break;

            default:
                break;
        }

        return error;
    };

    // ===== SAVE PROFILE SETTINGS =====
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const dateOfBirth = profileSettings.date_of_birth && profileSettings.date_of_birth.trim() !== ''
                ? profileSettings.date_of_birth
                : null;

            const joiningDate = profileSettings.joining_date && profileSettings.joining_date.trim() !== ''
                ? profileSettings.joining_date
                : null;

            const profileData = {
                name: profileSettings.name.trim(),
                phone: profileSettings.phone || '',
                cnic: profileSettings.cnic || '',
                date_of_birth: dateOfBirth,
                gender: profileSettings.gender || '',
                role: profileSettings.role || 'Receptionist',
                department: profileSettings.department || '',
                specialization: profileSettings.specialization || '',
                experience: profileSettings.experience || '',
                qualification: profileSettings.qualification || '',
                license_number: profileSettings.license_number || '',
                address: profileSettings.address || '',
                bio: profileSettings.bio || '',
                blood_group: profileSettings.blood_group || '',
                religion: profileSettings.religion || '',
                nationality: profileSettings.nationality || '',
                emergency_contact: profileSettings.emergency_contact || '',
                emergency_phone: profileSettings.emergency_phone || '',
                shift: profileSettings.shift || 'Morning',
                joining_date: joiningDate,
                salary: profileSettings.salary || '',
                language: currentLanguage,
                updated_at: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(profileData)
                .eq('id', user.id);

            if (updateError) {
                if (updateError.code === 'PGRST116' || updateError.message.includes('not found')) {
                    const { error: insertError } = await supabase
                        .from('profiles')
                        .insert([{
                            id: user.id,
                            ...profileData,
                            created_at: new Date().toISOString()
                        }]);

                    if (insertError) throw insertError;
                } else {
                    throw updateError;
                }
            }

            await supabase.auth.updateUser({
                data: {
                    name: profileSettings.name.trim(),
                    phone: profileSettings.phone || '',
                    cnic: profileSettings.cnic || '',
                    date_of_birth: dateOfBirth,
                    gender: profileSettings.gender || '',
                    role: profileSettings.role || 'Receptionist',
                    department: profileSettings.department || '',
                    specialization: profileSettings.specialization || '',
                    experience: profileSettings.experience || '',
                    qualification: profileSettings.qualification || '',
                    license_number: profileSettings.license_number || '',
                    address: profileSettings.address || '',
                    bio: profileSettings.bio || '',
                    blood_group: profileSettings.blood_group || '',
                    religion: profileSettings.religion || '',
                    nationality: profileSettings.nationality || '',
                    emergency_contact: profileSettings.emergency_contact || '',
                    emergency_phone: profileSettings.emergency_phone || '',
                    shift: profileSettings.shift || 'Morning',
                    joining_date: joiningDate,
                    salary: profileSettings.salary || '',
                    language: currentLanguage
                }
            });

            const notificationData = {
                email: profileSettings.notification_email,
                push: profileSettings.notification_push,
                sms: profileSettings.notification_sms
            };
            localStorage.setItem('notificationSettings', JSON.stringify(notificationData));
            setNotifications(notificationData);

            setSuccessMsg(t.settingsSaved || '✅ Settings saved successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);

        } catch (err) {
            console.error('Error saving settings:', err);
            setErrorMsg(t.saveError || 'Failed to save settings.');
        } finally {
            setLoading(false);
        }
    };

    // ===== TOGGLE NOTIFICATION =====
    const toggleNotification = (key) => {
        setNotifications(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
        setProfileSettings(prev => ({
            ...prev,
            [`notification_${key}`]: !prev[`notification_${key}`]
        }));
    };

    // ===== VALIDATE PASSWORD =====
    const validatePasswordForm = () => {
        const errors = {};
        if (!newPassword) {
            errors.newPassword = t.passwordRequired || 'Password is required';
        } else if (newPassword.length < 8) {
            errors.newPassword = t.passwordLength || 'Password must be at least 8 characters';
        } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(newPassword)) {
            errors.newPassword = t.passwordStrength || 'Must contain at least one uppercase letter and one number';
        }

        if (newPassword !== confirmPassword) {
            errors.confirmPassword = t.passwordMatch || 'Passwords do not match';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== HANDLE PASSWORD SUBMIT =====
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;
        setLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            await updatePassword(newPassword);
            setSuccessMsg(t.passwordChanged || '✅ Password changed successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setErrorMsg(t.passwordError || 'Failed to change password.');
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
            setErrorMsg(t.signOutError || 'Failed to sign out');
        }
    };

    // ===== RENDER INPUT =====
    const renderSettingsInput = (name, label, type = 'text', placeholder = '', required = false, options = null) => {
        const hasError = formErrorsSettings[name] && touched[name];
        const value = profileSettings[name] || '';

        const handleFocus = (e) => {
            if (!hasError) {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
            }
        };

        const handleBlurWithStyles = (e) => {
            handleProfileBlur(e);
            if (!hasError) {
                e.target.style.borderColor = 'var(--border-color)';
                e.target.style.boxShadow = 'none';
            }
        };

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
                        onBlur={handleBlurWithStyles}
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
                        onFocus={handleFocus}
                    >
                        <option value="">{t.selectRole || 'Select'}</option>
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
                            {formErrorsSettings[name]}
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
                        onBlur={handleBlurWithStyles}
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
                        onFocus={handleFocus}
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
                            {formErrorsSettings[name]}
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
                        onBlur={handleBlurWithStyles}
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
                        onFocus={handleFocus}
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
                            {formErrorsSettings[name]}
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
                    onBlur={handleBlurWithStyles}
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
                    onFocus={handleFocus}
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
                        {formErrorsSettings[name]}
                    </div>
                )}
            </div>
        );
    };

    // ===== LANGUAGE OPTIONS =====
    const languages = [
        { code: 'en', label: 'English' },
        { code: 'ur', label: 'اردو' }
    ];

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genders = ['Male', 'Female', 'Other'];
    const shifts = ['Morning', 'Evening', 'Night', 'Rotating'];
    const roles = ['Admin', 'Doctor', 'Receptionist', 'Pharmacist', 'Billing Staff'];
    const departments = ['Administration', 'Medical', 'Pharmacy', 'Billing', 'Nursing',
        'Laboratory', 'Radiology', 'Inventory', 'IT', 'Security'];

    const userName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Guest';
    const userEmail = user?.email || '';
    const userInitial = userName.charAt(0).toUpperCase();

    if (fetchLoading) {
        return (
            <DashboardLayout active="settings" title="Settings" showSearch={false}>
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

                {/* ===== BACK BUTTON ===== */}
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--hover-bg)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--card-bg)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    >
                        <ArrowLeft size={18} /> {t.backToDashboard || 'Back to Dashboard'}
                    </button>
                </div>

                {/* ===== USER INFO - Desktop Size ===== */}
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
                        </div>
                    </div>
                </div>

                {/* ===== SETTINGS GRID - 2 COLUMNS ON DESKTOP ===== */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: '24px',
                    marginBottom: '24px'
                }}>
                    {/* ===== THEME SETTINGS ===== */}
                    <div style={{
                        padding: isMobile ? '16px' : '20px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)',
                        height: 'fit-content'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <Palette size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '0.95rem' : '1.05rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>{t.themePreference || 'Theme Preference'}</h3>
                        </div>
                        <p style={{
                            fontSize: isMobile ? '0.75rem' : '0.85rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '16px',
                            lineHeight: 1.6
                        }}>
                            {t.themeDescription || 'Choose between light and dark mode for the hospital portal.'}
                        </p>
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: isMobile ? '10px' : '12px'
                        }}>
                            <button
                                onClick={() => handleThemeChange('light')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: isMobile ? '12px' : '14px',
                                    border: theme === 'light' ? '2px solid var(--primary-color)' : '1.5px solid var(--border-color)',
                                    borderRadius: '12px',
                                    background: theme === 'light' ? 'var(--primary-color)10' : 'var(--bg-primary)',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '0.9rem' : '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    color: theme === 'light' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    fontWeight: theme === 'light' ? 600 : 400
                                }}
                            >
                                <Sun size={isMobile ? 18 : 20} /> {t.lightMode || 'Light Mode'}
                                {theme === 'light' && <CheckCircle size={18} style={{ marginLeft: '6px' }} />}
                            </button>
                            <button
                                onClick={() => handleThemeChange('dark')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: isMobile ? '12px' : '14px',
                                    border: theme === 'dark' ? '2px solid var(--primary-color)' : '1.5px solid var(--border-color)',
                                    borderRadius: '12px',
                                    background: theme === 'dark' ? 'var(--primary-color)10' : 'var(--bg-primary)',
                                    cursor: 'pointer',
                                    fontSize: isMobile ? '0.9rem' : '0.9rem',
                                    fontFamily: 'var(--font-family)',
                                    color: theme === 'dark' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    transition: 'all 0.2s ease',
                                    fontWeight: theme === 'dark' ? 600 : 400
                                }}
                            >
                                <Moon size={isMobile ? 18 : 20} /> {t.darkMode || 'Dark Mode'}
                                {theme === 'dark' && <CheckCircle size={18} style={{ marginLeft: '6px' }} />}
                            </button>
                        </div>
                        <div style={{
                            marginTop: '12px',
                            padding: '10px 14px',
                            background: 'var(--bg-primary)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <Monitor size={16} style={{ flexShrink: 0 }} />
                            {t.currentTheme || 'Current theme'}: <strong style={{ color: 'var(--text-primary)' }}>{theme === 'light' ? '☀️ ' + (t.light || 'Light') : '🌙 ' + (t.dark || 'Dark')}</strong>
                        </div>
                    </div>

                    {/* ===== LANGUAGE SETTINGS ===== */}
                    <div style={{
                        padding: isMobile ? '16px' : '20px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-sm)',
                        height: 'fit-content'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <Globe size={20} style={{ color: 'var(--primary-color)' }} />
                            <h3 style={{
                                fontWeight: 600,
                                fontSize: isMobile ? '0.95rem' : '1.05rem',
                                margin: 0,
                                color: 'var(--text-primary)'
                            }}>{t.languagePreference || 'Language Preference'}</h3>
                        </div>
                        <p style={{
                            fontSize: isMobile ? '0.75rem' : '0.85rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '16px',
                            lineHeight: 1.6
                        }}>
                            {t.languageDescription || 'Select your preferred language for the interface.'}
                        </p>
                        <select
                            name="language"
                            value={currentLanguage}
                            onChange={handleLanguageChange}
                            style={{
                                width: '100%',
                                height: isMobile ? '44px' : '44px',
                                padding: '0 16px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                fontSize: isMobile ? '16px' : '0.9rem',
                                fontFamily: 'var(--font-family)',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'border-color 0.2s ease'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = 'var(--primary-color)';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ===== PROFILE SETTINGS ===== */}
                <div style={{
                    padding: isMobile ? '16px' : '24px',
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '24px'
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

                    {successMsg && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px 18px',
                            background: 'var(--success-color)15',
                            border: '1px solid var(--success-color)30',
                            borderRadius: '10px',
                            color: 'var(--success-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: isMobile ? '0.85rem' : '0.9rem'
                        }}>
                            <CheckCircle size={20} style={{ flexShrink: 0 }} />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {errorMsg && (
                        <div style={{
                            marginBottom: '16px',
                            padding: '12px 18px',
                            background: 'var(--danger-color)15',
                            border: '1px solid var(--danger-color)30',
                            borderRadius: '10px',
                            color: 'var(--danger-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: isMobile ? '0.85rem' : '0.9rem'
                        }}>
                            <AlertCircle size={20} style={{ flexShrink: 0 }} />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                            <Button type="submit" loading={loading} style={{
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

                {/* ===== NOTIFICATION SETTINGS ===== */}
                <div style={{
                    padding: isMobile ? '16px' : '20px',
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Bell size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{
                            fontWeight: 600,
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            margin: 0,
                            color: 'var(--text-primary)'
                        }}>{t.notificationPreferences || 'Notification Preferences'}</h3>
                    </div>
                    <p style={{
                        fontSize: isMobile ? '0.75rem' : '0.85rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        lineHeight: 1.6
                    }}>
                        {t.notificationDescription || 'Configure how you want to receive notifications.'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { key: 'email', label: t.emailNotifications || 'Email Notifications', icon: Mail },
                            { key: 'push', label: t.pushNotifications || 'Push Notifications', icon: Smartphone },
                            { key: 'sms', label: t.smsAlerts || 'SMS Alerts', icon: Volume2 }
                        ].map(({ key, label, icon: Icon }) => (
                            <div key={key} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: isMobile ? '12px 16px' : '14px 18px',
                                background: 'var(--bg-primary)',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Icon size={18} style={{ color: 'var(--text-muted)' }} />
                                    <span style={{
                                        fontSize: isMobile ? '0.9rem' : '0.95rem',
                                        color: 'var(--text-primary)'
                                    }}>{label}</span>
                                </div>
                                <button
                                    onClick={() => toggleNotification(key)}
                                    style={{
                                        padding: isMobile ? '8px 20px' : '6px 18px',
                                        border: 'none',
                                        borderRadius: '20px',
                                        background: notifications[key] ? '#22C55E' : 'var(--border-color)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: isMobile ? '0.75rem' : '0.7rem',
                                        fontWeight: 600,
                                        fontFamily: 'var(--font-family)',
                                        transition: 'all 0.2s ease',
                                        minWidth: isMobile ? '70px' : '60px'
                                    }}
                                >
                                    {notifications[key] ? (t.on || 'ON') : (t.off || 'OFF')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== PASSWORD SETTINGS ===== */}
                <div style={{
                    padding: isMobile ? '16px' : '24px',
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <Shield size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{
                            fontWeight: 600,
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            margin: 0,
                            color: 'var(--text-primary)'
                        }}>{t.securityCredentials || 'Security Credentials'}</h3>
                    </div>

                    <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <InputField
                            label={t.newPassword || 'New Security Password'}
                            name="newPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (formErrors.newPassword) setFormErrors(prev => ({ ...prev, newPassword: '' }));
                            }}
                            placeholder={t.passwordPlaceholder || 'Enter new strong password'}
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
                            label={t.confirmPassword || 'Confirm New Password'}
                            name="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: '' }));
                            }}
                            placeholder={t.confirmPlaceholder || 'Re-enter new password'}
                            icon={Lock}
                            error={formErrors.confirmPassword}
                            disabled={loading}
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
                            <Button type="submit" loading={loading} style={{
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
                </div>

                {/* ===== ACCOUNT ACTIONS ===== */}
                <div style={{
                    padding: isMobile ? '16px' : '20px',
                    background: 'var(--card-bg)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <LogOut size={20} style={{ color: 'var(--danger-color)' }} />
                        <h3 style={{
                            fontWeight: 600,
                            fontSize: isMobile ? '1rem' : '1.1rem',
                            margin: 0,
                            color: 'var(--text-primary)'
                        }}>{t.accountActions || 'Account Actions'}</h3>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '12px' : '16px'
                    }}>
                        <button
                            onClick={() => navigate('/my-profile')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: isMobile ? '14px 20px' : '12px 24px',
                                border: '1.5px solid var(--border-color)',
                                borderRadius: '10px',
                                background: 'var(--bg-primary)',
                                cursor: 'pointer',
                                fontSize: isMobile ? '0.95rem' : '0.9rem',
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
                            <User size={isMobile ? 18 : 18} /> {t.viewProfile || 'View Profile'}
                        </button>
                        <button
                            onClick={handleSignOut}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: isMobile ? '14px 20px' : '12px 24px',
                                border: '1.5px solid var(--danger-color)',
                                borderRadius: '10px',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: isMobile ? '0.95rem' : '0.9rem',
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
                            <LogOut size={isMobile ? 18 : 18} /> {t.signOut || 'Sign Out'}
                        </button>
                    </div>
                </div>

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
                    {t.version || 'Subhan Care Hospital v2.0.0 • © 2026'}
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