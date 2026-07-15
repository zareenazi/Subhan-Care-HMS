import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, User, Mail, Phone, Calendar, MapPin,
    Activity, Save, Bed, UserPlus, CheckCircle,
    AlertCircle, Loader, X, CreditCard, Droplet,
    Heart, Stethoscope, Pill, FileText, Home,
    Building, Globe, Clock, Shield, Users,
    Briefcase, Clipboard, Thermometer, Scissors,
    Syringe, AlertTriangle, GraduationCap,
    Languages, MessageCircle, Edit2, Plus,
    HeartPulse, Calendar as CalendarIcon,
    Clock as ClockIcon, Trash2, Printer,
    Eye, Search, Filter, ChevronDown
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const AddPatient = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const isEditMode = !!id;

    // ===== STATE =====
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [availableBeds, setAvailableBeds] = useState([]);
    const [loadingBeds, setLoadingBeds] = useState(false);
    const [touched, setTouched] = useState({});
    const [formErrors, setFormErrors] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [activeSection, setActiveSection] = useState('personal');
    const [isViewMode, setIsViewMode] = useState(true);

    // ===== PATIENT VIEW DATA =====
    const [patientData, setPatientData] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [vitals, setVitals] = useState([]);
    const [bedInfo, setBedInfo] = useState(null);
    const [activeTab, setActiveTab] = useState('appointments');

    // ===== MODAL STATES =====
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState(null);
    const [editingPrescription, setEditingPrescription] = useState(null);

    // ===== FORM DATA =====
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        cnic: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        religion: '',
        nationality: '',
        marital_status: '',
        occupation: '',
        education: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zip_code: '',
        medical_history: '',
        allergies: '',
        current_medications: '',
        chronic_conditions: '',
        past_surgeries: '',
        family_history: '',
        smoking_status: '',
        alcohol_consumption: '',
        blood_pressure: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        blood_sugar: '',
        weight: '',
        height: '',
        bmi: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: '',
        respiratory_rate: '',
        emergency_contact: '',
        emergency_phone: '',
        emergency_relationship: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_relationship: '',
        insurance_provider: '',
        insurance_policy_number: '',
        insurance_expiry: '',
        referred_by: '',
        referral_doctor: '',
        referral_hospital: '',
        requires_bed: false,
        bed_id: '',
        preferred_language: '',
        preferred_contact_method: '',
        notes: '',
        is_emergency: false,
        emergency_level: '',
        emergency_notes: '',
        consent_signed: false,
        consent_date: '',
        documents_attached: false,
        document_notes: '',
        billing_type: '',
        billing_notes: '',
        next_of_kin_name: '',
        next_of_kin_phone: '',
        next_of_kin_relationship: '',
        next_of_kin_address: '',
        occupation_details: '',
        living_situation: '',
        exercise_frequency: '',
        diet_type: '',
        sleep_pattern: '',
        immunization_status: '',
        last_vaccination: '',
        vaccination_notes: '',
        visit_reason: '',
        visit_type: '',
        visit_mode: '',
        arrival_time: '',
        referred_from: '',
        record_vitals: false,
    });

    // ===== APPOINTMENT FORM =====
    const [appointmentForm, setAppointmentForm] = useState({
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '10:00',
        doctor_name: '',
        department: '',
        reason: '',
        notes: '',
        status: 'scheduled'
    });

    // ===== PRESCRIPTION FORM =====
    const [prescriptionForm, setPrescriptionForm] = useState({
        doctor_name: '',
        diagnosis: '',
        medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
        instructions: '',
        notes: '',
        status: 'active'
    });

    // ===== VITALS FORM =====
    const [vitalsForm, setVitalsForm] = useState({
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        temperature: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        bmi: '',
        blood_sugar: '',
        respiratory_rate: '',
        notes: ''
    });

    const [formErrors2, setFormErrors2] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    // ===== TOAST =====
    const [toast, setToast] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    // ===== CONSTANTS =====
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genders = ['Male', 'Female', 'Other'];
    const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
    const smokingStatuses = ['Never Smoked', 'Former Smoker', 'Current Smoker', 'Occasional'];
    const alcoholConsumption = ['Never', 'Occasionally', 'Moderately', 'Regularly'];
    const languages = ['English', 'Urdu', 'Arabic', 'French', 'Spanish', 'German', 'Chinese', 'Russian', 'Hindi', 'Punjabi', 'Pashto', 'Sindhi', 'Balochi'];
    const contactMethods = ['Phone', 'Email', 'SMS', 'WhatsApp', 'Mail'];
    const relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];
    const emergencyLevels = ['Critical', 'Severe', 'Moderate', 'Mild'];
    const visitTypes = ['OPD', 'IPD', 'Emergency', 'Follow-up', 'Consultation', 'Surgery', 'Procedure'];
    const visitModes = ['Walk-in', 'Referral', 'Ambulance', 'Online Booking', 'Phone Appointment'];
    const billingTypes = ['Cash', 'Self Pay', 'Insurance', 'Corporate', 'Government', 'Charity', 'Other'];
    const exerciseFrequencies = ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'];
    const dietTypes = ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free', 'Diabetic', 'Low-Carb', 'Other'];
    const livingSituations = ['Own Home', 'Rented', 'With Family', 'Assisted Living', 'Other'];
    const immunizationStatuses = ['Up to Date', 'Partial', 'Not Immunized', 'Unknown'];
    const statusColors = {
        scheduled: { bg: '#DBEAFE', text: '#2563EB' },
        'in-progress': { bg: '#FEF3C7', text: '#D97706' },
        completed: { bg: '#DCFCE7', text: '#16A34A' },
        cancelled: { bg: '#FEE2E2', text: '#DC2626' },
        'no-show': { bg: '#FEF3C7', text: '#D97706' },
        active: { bg: '#DCFCE7', text: '#16A34A' },
        expired: { bg: '#FEE2E2', text: '#DC2626' }
    };
    const departments = ['General', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology', 'Ophthalmology', 'ENT', 'Gynecology', 'Urology', 'Psychiatry', 'Dentistry'];
    const timeSlots = [
        '08:00', '08:30', '09:00', '09:30',
        '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30',
        '18:00', '18:30', '19:00', '19:30',
        '20:00'
    ];

    // ===== SECTIONS =====
    const sections = [
        { id: 'personal', label: 'Personal', icon: User },
        { id: 'contact', label: 'Contact', icon: MapPin },
        { id: 'medical', label: 'Medical', icon: Heart },
        { id: 'emergency', label: 'Emergency', icon: AlertCircle },
        { id: 'guardian', label: 'Guardian', icon: Users },
        { id: 'insurance', label: 'Insurance', icon: CreditCard },
        { id: 'referral', label: 'Referral', icon: Stethoscope },
        { id: 'bed', label: 'Bed', icon: Bed },
        { id: 'additional', label: 'Additional', icon: FileText }
    ];

    // ===== VIEW TABS =====
    const viewTabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileText },
        { id: 'vitals', label: 'Vital Signs', icon: HeartPulse }
    ];

    // ===== TOAST FUNCTIONS =====
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
    };

    // ===== FETCH PATIENT DATA =====
    useEffect(() => {
        if (isEditMode) {
            fetchPatientData();
        }
    }, [id]);

    const fetchPatientData = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (patientError) throw patientError;

            if (patient) {
                setPatientData(patient);
                setFormData(patient);
                setIsViewMode(true);
            }

            const { data: appointmentsData, error: appointmentsError } = await supabase
                .from('appointments')
                .select('*')
                .eq('patient_id', id)
                .order('appointment_date', { ascending: false });

            if (!appointmentsError) {
                setAppointments(appointmentsData || []);
            }

            const { data: prescriptionsData, error: prescriptionsError } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('patient_id', id)
                .order('created_at', { ascending: false });

            if (!prescriptionsError) {
                setPrescriptions(prescriptionsData || []);
            }

            const { data: vitalsData, error: vitalsError } = await supabase
                .from('vitals')
                .select('*')
                .eq('patient_id', id)
                .order('recorded_at', { ascending: false })
                .limit(5);

            if (!vitalsError) {
                setVitals(vitalsData || []);
            }

            const { data: bedData, error: bedError } = await supabase
                .from('beds')
                .select('*')
                .eq('patient_id', id)
                .single();

            if (!bedError && bedData) {
                setBedInfo(bedData);
            }

        } catch (err) {
            console.error('Error fetching patient data:', err);
            setError('Failed to load patient data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // ===== FETCH AVAILABLE BEDS =====
    useEffect(() => {
        const fetchAvailableBeds = async () => {
            setLoadingBeds(true);
            try {
                const { data, error } = await supabase
                    .from('beds')
                    .select('*')
                    .order('room_number', { ascending: true });

                if (error) throw error;

                const available = (data || []).filter(bed =>
                    bed.status && bed.status.toLowerCase() === 'available'
                );

                setAvailableBeds(available);
            } catch (err) {
                console.error('Error fetching beds:', err);
                setError('Failed to load beds: ' + err.message);
            } finally {
                setLoadingBeds(false);
            }
        };

        fetchAvailableBeds();
    }, []);

    // ===== HANDLE RESIZE =====
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ===== VALIDATION =====
    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'name':
                if (!value || !value.trim()) {
                    error = 'Full name is required';
                } else if (value.trim().length < 3) {
                    error = 'Name must be at least 3 characters';
                }
                break;
            case 'phone':
                if (!value || !value.trim()) {
                    error = 'Phone number is required';
                } else if (!/^\+?[0-9\s-]{7,15}$/.test(value.trim())) {
                    error = 'Enter a valid phone number (7-15 digits)';
                }
                break;
            case 'gender':
                if (!value) error = 'Please select a gender';
                break;
            case 'blood_group':
                if (!value) error = 'Please select a blood group';
                break;
            case 'bed_id':
                if (formData.requires_bed && !value) {
                    error = 'Please select a bed for the patient';
                }
                break;
            case 'visit_reason':
                if (!value || !value.trim()) {
                    error = 'Reason for visit is required';
                }
                break;
            case 'consent_signed':
                if (!value) error = 'Patient consent is required';
                break;
            default:
                break;
        }
        return error;
    };

    const validateForm = () => {
        const errors = {};
        const requiredFields = ['name', 'phone', 'gender', 'blood_group', 'visit_reason'];

        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) errors[field] = error;
        });

        if (formData.requires_bed && !formData.bed_id) {
            errors.bed_id = 'Please select a bed for the patient';
        }

        if (!formData.consent_signed) {
            errors.consent_signed = 'Patient consent is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ===== HANDLE FORM CHANGES =====
    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        if (name === 'weight' || name === 'height') {
            const weight = name === 'weight' ? parseFloat(newValue) : parseFloat(formData.weight);
            const height = name === 'height' ? parseFloat(newValue) : parseFloat(formData.height);

            if (weight && height && height > 0) {
                const heightInMeters = height / 100;
                const bmi = weight / (heightInMeters * heightInMeters);
                if (!isNaN(bmi) && isFinite(bmi)) {
                    setFormData(prev => ({
                        ...prev,
                        bmi: bmi.toFixed(1)
                    }));
                }
            }
        }

        if (name === 'consent_signed' && checked) {
            setFormData(prev => ({
                ...prev,
                consent_date: new Date().toISOString().split('T')[0]
            }));
        }

        if (name === 'bed_id' && newValue) {
            setFormErrors(prev => ({ ...prev, bed_id: '' }));
        }

        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }

        setError(null);
    };

    // ===== HANDLE SUBMIT =====
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            setError('Please fix all validation errors before submitting.');
            const firstError = document.querySelector('.form-error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (formData.bed_id) {
                const { data: bedCheck, error: bedError } = await supabase
                    .from('beds')
                    .select('status')
                    .eq('id', formData.bed_id)
                    .single();

                if (bedError) throw bedError;

                if (bedCheck.status.toLowerCase() !== 'available') {
                    throw new Error('Selected bed is no longer available. Please choose another.');
                }
            }

            const patientData = {
                name: formData.name.trim(),
                email: formData.email ? formData.email.trim() : null,
                phone: formData.phone.trim(),
                cnic: formData.cnic ? formData.cnic.trim() : null,
                date_of_birth: formData.date_of_birth || null,
                gender: formData.gender || null,
                blood_group: formData.blood_group || null,
                religion: formData.religion || null,
                nationality: formData.nationality || null,
                marital_status: formData.marital_status || null,
                occupation: formData.occupation || null,
                education: formData.education || null,
                address: formData.address ? formData.address.trim() : null,
                city: formData.city || null,
                state: formData.state || null,
                country: formData.country || null,
                zip_code: formData.zip_code || null,
                medical_history: formData.medical_history ? formData.medical_history.trim() : null,
                allergies: formData.allergies ? formData.allergies.trim() : null,
                current_medications: formData.current_medications ? formData.current_medications.trim() : null,
                chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.trim() : null,
                past_surgeries: formData.past_surgeries ? formData.past_surgeries.trim() : null,
                family_history: formData.family_history ? formData.family_history.trim() : null,
                smoking_status: formData.smoking_status || null,
                alcohol_consumption: formData.alcohol_consumption || null,
                blood_pressure: formData.blood_pressure || null,
                blood_sugar: formData.blood_sugar || null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                height: formData.height ? parseFloat(formData.height) : null,
                bmi: formData.bmi ? parseFloat(formData.bmi) : null,
                emergency_contact: formData.emergency_contact ? formData.emergency_contact.trim() : null,
                emergency_phone: formData.emergency_phone ? formData.emergency_phone.trim() : null,
                emergency_relationship: formData.emergency_relationship || null,
                guardian_name: formData.guardian_name || null,
                guardian_phone: formData.guardian_phone || null,
                guardian_relationship: formData.guardian_relationship || null,
                insurance_provider: formData.insurance_provider || null,
                insurance_policy_number: formData.insurance_policy_number || null,
                insurance_expiry: formData.insurance_expiry || null,
                referred_by: formData.referred_by || null,
                referral_doctor: formData.referral_doctor || null,
                referral_hospital: formData.referral_hospital || null,
                bed_id: formData.bed_id || null,
                preferred_language: formData.preferred_language || null,
                preferred_contact_method: formData.preferred_contact_method || null,
                notes: formData.notes ? formData.notes.trim() : null,
                is_emergency: formData.is_emergency || false,
                emergency_level: formData.emergency_level || null,
                emergency_notes: formData.emergency_notes || null,
                consent_signed: formData.consent_signed || false,
                consent_date: formData.consent_date || null,
                documents_attached: formData.documents_attached || false,
                document_notes: formData.document_notes || null,
                billing_type: formData.billing_type || null,
                billing_notes: formData.billing_notes || null,
                next_of_kin_name: formData.next_of_kin_name || null,
                next_of_kin_phone: formData.next_of_kin_phone || null,
                next_of_kin_relationship: formData.next_of_kin_relationship || null,
                next_of_kin_address: formData.next_of_kin_address || null,
                occupation_details: formData.occupation_details || null,
                living_situation: formData.living_situation || null,
                exercise_frequency: formData.exercise_frequency || null,
                diet_type: formData.diet_type || null,
                sleep_pattern: formData.sleep_pattern || null,
                immunization_status: formData.immunization_status || null,
                last_vaccination: formData.last_vaccination || null,
                vaccination_notes: formData.vaccination_notes || null,
                visit_reason: formData.visit_reason ? formData.visit_reason.trim() : null,
                visit_type: formData.visit_type || null,
                visit_mode: formData.visit_mode || null,
                arrival_time: formData.arrival_time || null,
                referred_from: formData.referred_from || null,
                updated_at: new Date().toISOString(),
                updated_by: user?.id || null,
                status: formData.is_emergency ? 'emergency' : 'active'
            };

            if (isEditMode) {
                const result = await supabase
                    .from('patients')
                    .update(patientData)
                    .eq('id', id)
                    .select();

                if (result.error) throw result.error;

                if (formData.bed_id && formData.bed_id !== patientData.bed_id) {
                    if (patientData.bed_id) {
                        await supabase
                            .from('beds')
                            .update({ status: 'available', patient_id: null, occupied_at: null })
                            .eq('id', patientData.bed_id);
                    }
                    await supabase
                        .from('beds')
                        .update({
                            status: 'occupied',
                            patient_id: id,
                            occupied_at: new Date().toISOString()
                        })
                        .eq('id', formData.bed_id);
                }

                showToast('Patient updated successfully!', 'success');
                setIsViewMode(true);
                setActiveTab('appointments');
                fetchPatientData();
            } else {
                patientData.created_at = new Date().toISOString();
                patientData.created_by = user?.id || null;

                const { data: insertedPatient, error: supabaseError } = await supabase
                    .from('patients')
                    .insert([patientData])
                    .select();

                if (supabaseError) throw supabaseError;

                if (!insertedPatient || insertedPatient.length === 0) {
                    throw new Error('Failed to create patient record');
                }

                const newPatient = insertedPatient[0];

                if (formData.record_vitals) {
                    const vitalsData = {
                        patient_id: newPatient.id,
                        blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
                        blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
                        heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
                        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
                        weight: formData.weight ? parseFloat(formData.weight) : null,
                        height: formData.height ? parseFloat(formData.height) : null,
                        bmi: formData.bmi ? parseFloat(formData.bmi) : null,
                        oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
                        blood_sugar: formData.blood_sugar ? parseInt(formData.blood_sugar) : null,
                        respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
                        notes: `Initial vitals recorded during registration. Patient: ${formData.name}`,
                        recorded_at: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    };

                    const { error: vitalsError } = await supabase
                        .from('vitals')
                        .insert([vitalsData]);

                    if (vitalsError) {
                        console.error('Error recording vitals:', vitalsError);
                    } else {
                        window.dispatchEvent(new Event('vitalAdded'));
                    }
                }

                if (formData.bed_id) {
                    await supabase
                        .from('beds')
                        .update({
                            status: 'occupied',
                            patient_id: newPatient.id,
                            occupied_at: new Date().toISOString()
                        })
                        .eq('id', formData.bed_id);
                }

                await supabase
                    .from('patient_history')
                    .insert([{
                        patient_id: newPatient.id,
                        action: 'registered',
                        performed_by: user?.id || null,
                        details: {
                            name: formData.name,
                            visit_reason: formData.visit_reason,
                            is_emergency: formData.is_emergency,
                            bed_assigned: !!formData.bed_id,
                            vitals_recorded: formData.record_vitals
                        },
                        created_at: new Date().toISOString()
                    }]);

                window.dispatchEvent(new Event('patientAdded'));
                window.dispatchEvent(new Event('bedChanged'));

                showToast('Patient registered successfully!', 'success');
                setTimeout(() => {
                    navigate(`/patient/${newPatient.id}`);
                }, 1500);
            }

        } catch (err) {
            console.error('Error saving patient:', err);
            setError(err.message || 'Failed to save patient. Please try again.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    // ===== APPOINTMENT FUNCTIONS =====
    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const patientId = isEditMode ? id : patientData?.id;
            if (!patientId) {
                setError('Please save patient first before adding appointments');
                showToast('Please save patient first', 'error');
                setActionLoading(false);
                return;
            }

            const appointmentData = {
                patient_id: patientId,
                ...appointmentForm,
                updated_at: new Date().toISOString()
            };

            let result;
            if (editingAppointment) {
                result = await supabase
                    .from('appointments')
                    .update(appointmentData)
                    .eq('id', editingAppointment.id);
            } else {
                appointmentData.created_at = new Date().toISOString();
                result = await supabase
                    .from('appointments')
                    .insert([appointmentData]);
            }

            if (result.error) throw result.error;

            showToast(
                editingAppointment ? 'Appointment updated successfully!' : 'Appointment booked successfully!',
                'success'
            );
            setShowAppointmentModal(false);
            setEditingAppointment(null);
            resetAppointmentForm();
            await fetchPatientData();
            window.dispatchEvent(new Event('appointmentAdded'));

        } catch (err) {
            console.error('Error saving appointment:', err);
            setError('Failed to save appointment: ' + err.message);
            showToast('Failed to save appointment', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const resetAppointmentForm = () => {
        setAppointmentForm({
            appointment_date: new Date().toISOString().split('T')[0],
            appointment_time: '10:00',
            doctor_name: '',
            department: '',
            reason: '',
            notes: '',
            status: 'scheduled'
        });
        setFormErrors2({});
    };

    const handleEditAppointment = (appointment) => {
        setEditingAppointment(appointment);
        setAppointmentForm({
            appointment_date: appointment.appointment_date || new Date().toISOString().split('T')[0],
            appointment_time: appointment.appointment_time || '10:00',
            doctor_name: appointment.doctor_name || '',
            department: appointment.department || '',
            reason: appointment.reason || '',
            notes: appointment.notes || '',
            status: appointment.status || 'scheduled'
        });
        setShowAppointmentModal(true);
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointmentId);

            if (error) throw error;
            showToast('Appointment deleted successfully!', 'success');
            await fetchPatientData();
        } catch (err) {
            console.error('Error deleting appointment:', err);
            showToast('Failed to delete appointment', 'error');
        }
    };

    // ===== PRESCRIPTION FUNCTIONS =====
    const handlePrescriptionSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const patientId = isEditMode ? id : patientData?.id;
            if (!patientId) {
                setError('Please save patient first before adding prescriptions');
                showToast('Please save patient first', 'error');
                setActionLoading(false);
                return;
            }

            const medCount = prescriptionForm.medications.filter(m => m.name.trim()).length;

            const prescriptionData = {
                patient_id: patientId,
                doctor_name: prescriptionForm.doctor_name,
                diagnosis: prescriptionForm.diagnosis,
                medications: prescriptionForm.medications,
                instructions: prescriptionForm.instructions || '',
                notes: prescriptionForm.notes || '',
                status: prescriptionForm.status || 'active',
                medication_count: medCount,
                updated_at: new Date().toISOString()
            };

            let result;
            if (editingPrescription) {
                result = await supabase
                    .from('prescriptions')
                    .update(prescriptionData)
                    .eq('id', editingPrescription.id);
            } else {
                prescriptionData.created_at = new Date().toISOString();
                result = await supabase
                    .from('prescriptions')
                    .insert([prescriptionData]);
            }

            if (result.error) throw result.error;

            showToast(
                editingPrescription ? 'Prescription updated successfully!' : 'Prescription added successfully!',
                'success'
            );
            setShowPrescriptionModal(false);
            setEditingPrescription(null);
            resetPrescriptionForm();
            await fetchPatientData();
            window.dispatchEvent(new Event('prescriptionAdded'));

        } catch (err) {
            console.error('Error saving prescription:', err);
            setError('Failed to save prescription: ' + err.message);
            showToast('Failed to save prescription', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const resetPrescriptionForm = () => {
        setPrescriptionForm({
            doctor_name: '',
            diagnosis: '',
            medications: [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
            instructions: '',
            notes: '',
            status: 'active'
        });
        setFormErrors2({});
    };

    const handleEditPrescription = (prescription) => {
        setEditingPrescription(prescription);
        setPrescriptionForm({
            doctor_name: prescription.doctor_name || '',
            diagnosis: prescription.diagnosis || '',
            medications: prescription.medications || [{ name: '', dosage: '', frequency: '', duration: '', notes: '' }],
            instructions: prescription.instructions || '',
            notes: prescription.notes || '',
            status: prescription.status || 'active'
        });
        setShowPrescriptionModal(true);
    };

    const handleDeletePrescription = async (prescriptionId) => {
        if (!window.confirm('Are you sure you want to delete this prescription?')) return;

        try {
            const { error } = await supabase
                .from('prescriptions')
                .delete()
                .eq('id', prescriptionId);

            if (error) throw error;
            showToast('Prescription deleted successfully!', 'success');
            await fetchPatientData();
        } catch (err) {
            console.error('Error deleting prescription:', err);
            showToast('Failed to delete prescription', 'error');
        }
    };

    const addMedication = () => {
        setPrescriptionForm({
            ...prescriptionForm,
            medications: [...prescriptionForm.medications, { name: '', dosage: '', frequency: '', duration: '', notes: '' }]
        });
    };

    const removeMedication = (index) => {
        if (prescriptionForm.medications.length <= 1) return;
        const medications = prescriptionForm.medications.filter((_, i) => i !== index);
        setPrescriptionForm({ ...prescriptionForm, medications });
    };

    const updateMedication = (index, field, value) => {
        const medications = [...prescriptionForm.medications];
        medications[index][field] = value;
        setPrescriptionForm({ ...prescriptionForm, medications });
    };

    // ===== VITALS FUNCTIONS =====
    const handleVitalsSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        setError(null);

        try {
            const patientId = isEditMode ? id : patientData?.id;
            if (!patientId) {
                setError('Please save patient first before recording vitals');
                showToast('Please save patient first', 'error');
                setActionLoading(false);
                return;
            }

            let bmi = '';
            if (vitalsForm.weight && vitalsForm.height) {
                const heightInMeters = parseFloat(vitalsForm.height) / 100;
                const weightInKg = parseFloat(vitalsForm.weight);
                if (heightInMeters > 0 && weightInKg > 0) {
                    bmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
                }
            }

            const vitalsData = {
                patient_id: patientId,
                blood_pressure_systolic: vitalsForm.blood_pressure_systolic ? parseInt(vitalsForm.blood_pressure_systolic) : null,
                blood_pressure_diastolic: vitalsForm.blood_pressure_diastolic ? parseInt(vitalsForm.blood_pressure_diastolic) : null,
                heart_rate: vitalsForm.heart_rate ? parseInt(vitalsForm.heart_rate) : null,
                temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : null,
                oxygen_saturation: vitalsForm.oxygen_saturation ? parseInt(vitalsForm.oxygen_saturation) : null,
                weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : null,
                height: vitalsForm.height ? parseFloat(vitalsForm.height) : null,
                bmi: bmi || null,
                blood_sugar: vitalsForm.blood_sugar ? parseInt(vitalsForm.blood_sugar) : null,
                respiratory_rate: vitalsForm.respiratory_rate ? parseInt(vitalsForm.respiratory_rate) : null,
                notes: vitalsForm.notes || `Vitals recorded for ${formData.name}`,
                recorded_at: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('vitals')
                .insert([vitalsData]);

            if (error) throw error;

            showToast('Vitals recorded successfully!', 'success');
            setShowVitalsModal(false);
            resetVitalsForm();
            await fetchPatientData();
            window.dispatchEvent(new Event('vitalAdded'));

        } catch (err) {
            console.error('Error saving vitals:', err);
            setError('Failed to save vitals: ' + err.message);
            showToast('Failed to save vitals', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const resetVitalsForm = () => {
        setVitalsForm({
            blood_pressure_systolic: '',
            blood_pressure_diastolic: '',
            heart_rate: '',
            temperature: '',
            oxygen_saturation: '',
            weight: '',
            height: '',
            bmi: '',
            blood_sugar: '',
            respiratory_rate: '',
            notes: ''
        });
    };

    // ===== STATUS BADGE =====
    const getStatusBadge = (status) => {
        const color = statusColors[status] || statusColors.scheduled;
        return (
            <span style={{
                padding: '2px 10px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 600,
                background: color.bg,
                color: color.text,
                border: `1px solid ${color.text}30`
            }}>
                {status?.replace('-', ' ').charAt(0).toUpperCase() + status?.replace('-', ' ').slice(1) || 'Scheduled'}
            </span>
        );
    };

    // ===== RENDER VIEW TABS =====
    const renderViewTabs = () => {
        if (!isEditMode && !patientData) return null;

        return (
            <>
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '20px',
                    background: 'var(--card-bg)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    overflowX: 'auto',
                    flexWrap: 'nowrap'
                }}>
                    {viewTabs.map(tab => {
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
                                    fontSize: '0.85rem',
                                    fontFamily: 'var(--font-family)',
                                    fontWeight: isActive ? 600 : 400,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Icon size={18} />
                                {tab.label}
                                {tab.id === 'appointments' && appointments.length > 0 && (
                                    <span style={{
                                        background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-primary)',
                                        padding: '1px 8px',
                                        borderRadius: '10px',
                                        fontSize: '0.65rem',
                                        fontWeight: 600
                                    }}>
                                        {appointments.length}
                                    </span>
                                )}
                                {tab.id === 'prescriptions' && prescriptions.length > 0 && (
                                    <span style={{
                                        background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-primary)',
                                        padding: '1px 8px',
                                        borderRadius: '10px',
                                        fontSize: '0.65rem',
                                        fontWeight: 600
                                    }}>
                                        {prescriptions.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => {
                            setIsViewMode(false);
                            setActiveTab('overview');
                        }}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontFamily: 'var(--font-family)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginLeft: 'auto',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                </div>

                <div style={{ minHeight: '300px' }}>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'appointments' && renderAppointments()}
                    {activeTab === 'prescriptions' && renderPrescriptions()}
                    {activeTab === 'vitals' && renderVitals()}
                </div>
            </>
        );
    };

    // ===== RENDER OVERVIEW =====
    const renderOverview = () => {
        const data = patientData || formData;
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <User size={18} style={{ color: 'var(--primary-color)' }} />
                        Personal Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Full Name</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                {data.name}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Gender</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                {data.gender || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Date of Birth</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                {data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Blood Group</span>
                            <span style={{ fontWeight: 700, color: 'var(--danger-color)', fontSize: '0.9rem' }}>
                                {data.blood_group || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Status</span>
                            <span style={{
                                padding: '2px 12px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: data.status === 'emergency' ? '#FEE2E2' : '#DCFCE7',
                                color: data.status === 'emergency' ? '#DC2626' : '#16A34A'
                            }}>
                                {data.status || 'Active'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Phone</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                {data.phone || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <MapPin size={18} style={{ color: 'var(--warning-color)' }} />
                        Contact & Emergency
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Email</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                {data.email || 'N/A'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Address</span>
                            <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', textAlign: 'right' }}>
                                {data.address || 'N/A'}
                            </span>
                        </div>
                        {data.emergency_contact && (
                            <div style={{
                                marginTop: '8px',
                                padding: '10px',
                                background: '#FEF3C7',
                                borderRadius: '8px',
                                border: '1px solid #F59E0B30'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Emergency Contact</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                        {data.emergency_contact}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {data.emergency_phone}
                                    </span>
                                </div>
                            </div>
                        )}
                        {data.insurance_provider && (
                            <div style={{
                                marginTop: '8px',
                                padding: '10px',
                                background: '#DBEAFE',
                                borderRadius: '8px',
                                border: '1px solid #2563EB30'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Insurance</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                                        {data.insurance_provider}
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                        {data.insurance_policy_number}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '14px',
                    padding: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Heart size={18} style={{ color: 'var(--danger-color)' }} />
                        Medical Information
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {data.medical_history && (
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Medical History</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {data.medical_history}
                                </div>
                            </div>
                        )}
                        {data.allergies && (
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Allergies</div>
                                <div style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--danger-color)',
                                    marginTop: '2px',
                                    fontWeight: 500
                                }}>
                                    {data.allergies}
                                </div>
                            </div>
                        )}
                        {data.current_medications && (
                            <div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current Medications</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {data.current_medications}
                                </div>
                            </div>
                        )}
                        {bedInfo ? (
                            <div style={{
                                marginTop: '8px',
                                padding: '10px',
                                background: '#DCFCE7',
                                borderRadius: '8px',
                                border: '1px solid #16A34A30'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bed</span>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        Room {bedInfo.room_number}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                        {!data.medical_history && !data.allergies && !data.current_medications && !bedInfo && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                                No medical information recorded
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ===== RENDER APPOINTMENTS (FIXED) =====
    const renderAppointments = () => {
        const patientId = isEditMode ? id : patientData?.id;

        return (
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Calendar size={20} style={{ color: 'var(--primary-color)' }} />
                        Appointments ({appointments.length})
                    </h3>
                    <button
                        onClick={() => {
                            console.log('Book Appointment clicked');
                            if (!patientId) {
                                showToast('Patient not found', 'error');
                                return;
                            }
                            setEditingAppointment(null);
                            resetAppointmentForm();
                            setShowAppointmentModal(true);
                        }}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Plus size={16} /> Book Appointment
                    </button>
                </div>

                {appointments.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <Calendar size={40} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: '8px' }}>No appointments found for this patient.</p>
                        <button
                            onClick={() => {
                                console.log('Book an Appointment clicked');
                                if (!patientId) {
                                    showToast('Patient not found', 'error');
                                    return;
                                }
                                setEditingAppointment(null);
                                resetAppointmentForm();
                                setShowAppointmentModal(true);
                            }}
                            style={{
                                marginTop: '12px',
                                padding: '8px 20px',
                                background: 'var(--primary-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Book an Appointment
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {appointments.map((app, index) => (
                            <div
                                key={app.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '14px 18px',
                                    background: index % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-primary)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    transition: 'all 0.2s ease',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flex: 1,
                                    minWidth: '150px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'var(--primary-color)15',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary-color)'
                                    }}>
                                        <CalendarIcon size={18} />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)'
                                        }}>
                                            {app.appointment_date ? new Date(app.appointment_date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : 'N/A'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <Clock size={12} />
                                            {app.appointment_time || '10:00 AM'}
                                            {app.doctor_name && (
                                                <>
                                                    <span>•</span>
                                                    <Stethoscope size={12} />
                                                    Dr. {app.doctor_name}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                }}>
                                    {app.department && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            padding: '2px 10px',
                                            borderRadius: '10px',
                                            background: '#DBEAFE',
                                            color: '#2563EB'
                                        }}>
                                            {app.department}
                                        </span>
                                    )}
                                    {getStatusBadge(app.status)}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    marginLeft: 'auto'
                                }}>
                                    <button
                                        onClick={() => handleEditAppointment(app)}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAppointment(app.id)}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ===== RENDER PRESCRIPTIONS (FIXED) =====
    const renderPrescriptions = () => {
        const patientId = isEditMode ? id : patientData?.id;

        return (
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <FileText size={20} style={{ color: 'var(--warning-color)' }} />
                        Prescriptions ({prescriptions.length})
                    </h3>
                    <button
                        onClick={() => {
                            console.log('New Prescription clicked');
                            if (!patientId) {
                                showToast('Patient not found', 'error');
                                return;
                            }
                            setEditingPrescription(null);
                            resetPrescriptionForm();
                            setShowPrescriptionModal(true);
                        }}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--warning-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Plus size={16} /> New Prescription
                    </button>
                </div>

                {prescriptions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <FileText size={40} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: '8px' }}>No prescriptions found for this patient.</p>
                        <button
                            onClick={() => {
                                console.log('Create Prescription clicked');
                                if (!patientId) {
                                    showToast('Patient not found', 'error');
                                    return;
                                }
                                setEditingPrescription(null);
                                resetPrescriptionForm();
                                setShowPrescriptionModal(true);
                            }}
                            style={{
                                marginTop: '12px',
                                padding: '8px 20px',
                                background: 'var(--warning-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Create Prescription
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {prescriptions.map((presc, index) => (
                            <div
                                key={presc.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '14px 18px',
                                    background: index % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-primary)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    transition: 'all 0.2s ease',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flex: 1,
                                    minWidth: '150px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: 'var(--warning-color)15',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--warning-color)'
                                    }}>
                                        <Pill size={18} />
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)'
                                        }}>
                                            {presc.diagnosis || 'General Prescription'}
                                        </div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span>{presc.medications?.filter(m => m.name).length || 0} medications</span>
                                            {presc.doctor_name && (
                                                <>
                                                    <span>•</span>
                                                    <span>Dr. {presc.doctor_name}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{presc.created_at ? new Date(presc.created_at).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    flexWrap: 'wrap'
                                }}>
                                    {presc.medications?.slice(0, 2).map((med, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                fontSize: '0.65rem',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                background: '#F3F4F6',
                                                color: 'var(--text-secondary)'
                                            }}
                                        >
                                            {med.name}
                                        </span>
                                    ))}
                                    {presc.medications?.length > 2 && (
                                        <span style={{
                                            fontSize: '0.6rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            +{presc.medications.length - 2} more
                                        </span>
                                    )}
                                    {getStatusBadge(presc.status)}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    marginLeft: 'auto'
                                }}>
                                    <button
                                        onClick={() => handleEditPrescription(presc)}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePrescription(presc.id)}
                                        style={{
                                            padding: '4px 8px',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ===== RENDER VITALS =====
    const renderVitals = () => {
        const patientId = isEditMode ? id : patientData?.id;

        return (
            <div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <HeartPulse size={20} style={{ color: 'var(--danger-color)' }} />
                        Vital Signs ({vitals.length})
                    </h3>
                    <button
                        onClick={() => {
                            if (!patientId) {
                                showToast('Patient not found', 'error');
                                return;
                            }
                            resetVitalsForm();
                            setShowVitalsModal(true);
                        }}
                        style={{
                            padding: '8px 16px',
                            background: 'var(--danger-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Plus size={16} /> Record Vitals
                    </button>
                </div>

                {vitals.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        color: 'var(--text-muted)',
                        background: 'var(--bg-primary)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <HeartPulse size={40} style={{ opacity: 0.3 }} />
                        <p style={{ marginTop: '8px' }}>No vital signs recorded</p>
                        <button
                            onClick={() => {
                                if (!patientId) {
                                    showToast('Patient not found', 'error');
                                    return;
                                }
                                resetVitalsForm();
                                setShowVitalsModal(true);
                            }}
                            style={{
                                marginTop: '12px',
                                padding: '8px 20px',
                                background: 'var(--danger-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Record First Vitals
                        </button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '12px'
                    }}>
                        {vitals.map((vital, index) => (
                            <div
                                key={vital.id}
                                style={{
                                    padding: '16px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: 'var(--shadow-sm)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <Calendar size={12} />
                                        {vital.recorded_at ? new Date(vital.recorded_at).toLocaleDateString() : 'N/A'}
                                    </span>
                                    <span style={{
                                        fontSize: '0.6rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: '#DBEAFE',
                                        color: '#2563EB'
                                    }}>
                                        #{vitals.length - index}
                                    </span>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '8px'
                                }}>
                                    {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BP</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                                            </div>
                                        </div>
                                    )}
                                    {vital.heart_rate && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>HR</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.heart_rate}
                                            </div>
                                        </div>
                                    )}
                                    {vital.temperature && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Temp</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.temperature}°C
                                            </div>
                                        </div>
                                    )}
                                    {vital.oxygen_saturation && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>O₂</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.oxygen_saturation}%
                                            </div>
                                        </div>
                                    )}
                                    {vital.weight && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Weight</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.weight} kg
                                            </div>
                                        </div>
                                    )}
                                    {vital.bmi && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>BMI</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.bmi}
                                            </div>
                                        </div>
                                    )}
                                    {vital.blood_sugar && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Sugar</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.blood_sugar}
                                            </div>
                                        </div>
                                    )}
                                    {vital.respiratory_rate && (
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>RR</div>
                                            <div style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)'
                                            }}>
                                                {vital.respiratory_rate}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {vital.notes && (
                                    <div style={{
                                        marginTop: '8px',
                                        fontSize: '0.7rem',
                                        color: 'var(--text-muted)',
                                        borderTop: '1px solid var(--border-color)',
                                        paddingTop: '6px'
                                    }}>
                                        {vital.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // ===== RENDER INPUT =====
    const renderInput = (name, label, type = 'text', placeholder = '', required = false, options = null) => {
        const hasError = formErrors[name] && touched[name];
        const value = formData[name] || '';

        if (type === 'select' && options) {
            return (
                <div className="form-group" key={name}>
                    <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>*</span>}
                    </label>
                    <select
                        name={name}
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={hasError ? 'form-error' : ''}
                        style={{
                            width: '100%',
                            height: '48px',
                            padding: '0 16px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: isMobile ? '16px' : '0.95rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            appearance: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="">Select {label}</option>
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
                <div className="form-group" key={name} style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <label style={{
                        display: 'block',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: '6px'
                    }}>
                        {label} {required && <span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>*</span>}
                    </label>
                    <textarea
                        name={name}
                        value={value}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        rows={isMobile ? 4 : 3}
                        className={hasError ? 'form-error' : ''}
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                            borderRadius: '12px',
                            fontSize: isMobile ? '16px' : '0.95rem',
                            fontFamily: 'inherit',
                            outline: 'none',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            resize: 'vertical',
                            minHeight: isMobile ? '100px' : '80px',
                            boxSizing: 'border-box'
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

        if (type === 'checkbox') {
            return (
                <div className="form-group" key={name} style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 0'
                    }}>
                        <input
                            type="checkbox"
                            name={name}
                            checked={value}
                            onChange={handleChange}
                            className={hasError ? 'form-error' : ''}
                            style={{
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                accentColor: 'var(--primary-color)',
                                flexShrink: 0
                            }}
                        />
                        <label style={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}>
                            {label} {required && <span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>*</span>}
                        </label>
                    </div>
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
            <div className="form-group" key={name}>
                <label style={{
                    display: 'block',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px'
                }}>
                    {label} {required && <span style={{ color: 'var(--danger-color)', fontWeight: 700 }}>*</span>}
                </label>
                <input
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={hasError ? 'form-error' : ''}
                    style={{
                        width: '100%',
                        height: '48px',
                        padding: '0 16px',
                        border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                        borderRadius: '12px',
                        fontSize: isMobile ? '16px' : '0.95rem',
                        fontFamily: 'inherit',
                        outline: 'none',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        boxSizing: 'border-box'
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

    // ===== RENDER BED ASSIGNMENT =====
    const renderBedAssignment = () => {
        const hasError = formErrors.bed_id && touched.bed_id;

        return (
            <div style={{
                background: 'var(--bg-primary)',
                borderRadius: '12px',
                padding: isMobile ? '14px' : '16px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
                    <Bed size={16} style={{ color: 'var(--pink-color)' }} />
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                    }}>Bed Assignment (Optional)</span>
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        background: 'var(--border-color)',
                        padding: '2px 8px',
                        borderRadius: '10px'
                    }}>
                        {availableBeds.length} beds available
                    </span>
                </div>

                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '10px'
                    }}>
                        <input
                            type="checkbox"
                            name="requires_bed"
                            checked={formData.requires_bed}
                            onChange={handleChange}
                            style={{
                                width: '18px',
                                height: '18px',
                                cursor: 'pointer',
                                accentColor: 'var(--primary-color)',
                                flexShrink: 0
                            }}
                        />
                        <label style={{
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}>
                            Patient requires bed admission
                        </label>
                    </div>

                    {formData.requires_bed && (
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                color: 'var(--text-secondary)',
                                marginBottom: '6px'
                            }}>
                                Select Available Bed <span style={{ color: 'var(--danger-color)' }}>*</span>
                            </label>

                            {loadingBeds ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    background: 'var(--bg-primary)',
                                    borderRadius: '10px',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.85rem'
                                }}>
                                    <Loader size={16} className="spinner" />
                                    Loading beds...
                                </div>
                            ) : availableBeds.length === 0 ? (
                                <div style={{
                                    padding: '12px 16px',
                                    background: '#FEF2F2',
                                    borderRadius: '10px',
                                    border: '1px solid #FECACA',
                                    color: '#DC2626',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <AlertCircle size={16} />
                                    <span>No beds available at the moment. Please check back later.</span>
                                </div>
                            ) : (
                                <>
                                    <select
                                        name="bed_id"
                                        value={formData.bed_id}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        className={hasError ? 'form-error' : ''}
                                        style={{
                                            width: '100%',
                                            height: '48px',
                                            padding: '0 14px',
                                            border: hasError ? '2px solid var(--danger-color)' : '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: isMobile ? '16px' : '0.9rem',
                                            fontFamily: 'inherit',
                                            outline: 'none',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Select a bed</option>
                                        {availableBeds.map(bed => (
                                            <option key={bed.id} value={bed.id}>
                                                Room {bed.room_number} 🟢 Available
                                            </option>
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
                                            {formErrors.bed_id}
                                        </div>
                                    )}

                                    {formData.bed_id && (
                                        <div style={{
                                            marginTop: '6px',
                                            fontSize: '0.75rem',
                                            color: 'var(--success-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <CheckCircle size={14} />
                                            Bed will be marked as occupied after registration
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ===== RENDER SECTION =====
    const renderSection = (sectionId) => {
        switch (sectionId) {
            case 'personal':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <User size={18} style={{ color: 'var(--primary-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Personal Information</span>
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                background: 'var(--border-color)',
                                padding: '2px 8px',
                                borderRadius: '10px'
                            }}>Required *</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('name', 'Full Name', 'text', 'Enter full name', true)}
                            {renderInput('email', 'Email Address', 'email', 'patient@example.com', false)}
                            {renderInput('phone', 'Phone Number', 'text', '+92 300 1234567', true)}
                            {renderInput('cnic', 'CNIC / ID Number', 'text', 'xxxxx-xxxxxxx-x', false)}
                            {renderInput('date_of_birth', 'Date of Birth', 'date', '', false)}
                            {renderInput('gender', 'Gender', 'select', '', true, genders)}
                            {renderInput('blood_group', 'Blood Group', 'select', '', true, bloodGroups)}
                            {renderInput('religion', 'Religion', 'text', 'e.g. Islam', false)}
                            {renderInput('nationality', 'Nationality', 'text', 'e.g. Pakistani', false)}
                            {renderInput('marital_status', 'Marital Status', 'select', '', false, maritalStatuses)}
                            {renderInput('occupation', 'Occupation', 'text', 'e.g. Doctor, Engineer', false)}
                            {renderInput('education', 'Education', 'text', 'e.g. MBBS, B.Sc.', false)}
                        </div>
                    </div>
                );

            case 'contact':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <MapPin size={18} style={{ color: 'var(--warning-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Contact Information</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('address', 'Address', 'textarea', 'Enter complete address', false)}
                            {renderInput('city', 'City', 'text', 'e.g. Islamabad', false)}
                            {renderInput('state', 'State/Province', 'text', 'e.g. Punjab', false)}
                            {renderInput('country', 'Country', 'text', 'e.g. Pakistan', false)}
                            {renderInput('zip_code', 'ZIP Code', 'text', 'e.g. 44000', false)}
                        </div>
                    </div>
                );

            case 'medical':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <Heart size={18} style={{ color: 'var(--danger-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Medical Information</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('medical_history', 'Medical History', 'textarea', 'Previous conditions, surgeries, chronic diseases...', false)}
                            {renderInput('allergies', 'Allergies', 'textarea', 'Known allergies to medications, foods, etc.', false)}
                            {renderInput('current_medications', 'Current Medications', 'textarea', 'List of current medications with dosages', false)}
                            {renderInput('chronic_conditions', 'Chronic Conditions', 'textarea', 'e.g. Diabetes, Hypertension', false)}
                            {renderInput('past_surgeries', 'Past Surgeries', 'textarea', 'List of previous surgeries with dates', false)}
                            {renderInput('family_history', 'Family History', 'textarea', 'Family medical history', false)}
                            {renderInput('smoking_status', 'Smoking Status', 'select', '', false, smokingStatuses)}
                            {renderInput('alcohol_consumption', 'Alcohol Consumption', 'select', '', false, alcoholConsumption)}

                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    marginTop: '8px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <Heart size={18} style={{ color: '#EF4444' }} />
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Vital Signs (Optional)</span>
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.65rem',
                                        color: 'var(--text-muted)',
                                        background: 'var(--border-color)',
                                        padding: '2px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        <input
                                            type="checkbox"
                                            name="record_vitals"
                                            checked={formData.record_vitals}
                                            onChange={handleChange}
                                            style={{
                                                marginRight: '4px',
                                                accentColor: 'var(--primary-color)'
                                            }}
                                        />
                                        Record now
                                    </span>
                                </div>

                                {formData.record_vitals && (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {renderInput('blood_pressure_systolic', 'BP (Systolic)', 'number', 'e.g. 120', false)}
                                        {renderInput('blood_pressure_diastolic', 'BP (Diastolic)', 'number', 'e.g. 80', false)}
                                        {renderInput('heart_rate', 'Heart Rate (bpm)', 'number', 'e.g. 72', false)}
                                        {renderInput('temperature', 'Temperature (°C)', 'number', 'e.g. 36.5', false)}
                                        {renderInput('oxygen_saturation', 'O₂ Saturation (%)', 'number', 'e.g. 98', false)}
                                        {renderInput('respiratory_rate', 'Respiratory Rate', 'number', 'e.g. 16', false)}
                                    </div>
                                )}
                            </div>

                            {renderInput('blood_pressure', 'Blood Pressure (Text)', 'text', 'e.g. 120/80', false)}
                            {renderInput('blood_sugar', 'Blood Sugar', 'text', 'e.g. 120 mg/dL', false)}
                            {renderInput('weight', 'Weight (kg)', 'text', 'e.g. 70', false)}
                            {renderInput('height', 'Height (cm)', 'text', 'e.g. 170', false)}
                            {renderInput('bmi', 'BMI (Auto-calculated)', 'text', 'Auto-calculated from weight & height', false)}
                        </div>
                    </div>
                );

            case 'emergency':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <Phone size={18} style={{ color: 'var(--purple-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Emergency Contact</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('emergency_contact', 'Contact Name', 'text', 'Emergency contact person', false)}
                            {renderInput('emergency_phone', 'Emergency Phone', 'text', 'Emergency contact number', false)}
                            {renderInput('emergency_relationship', 'Relationship', 'select', '', false, relationships)}
                        </div>

                        <div style={{
                            marginTop: '16px',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <AlertTriangle size={18} style={{ color: 'var(--danger-color)' }} />
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)'
                                }}>Emergency Alerts</span>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                gap: '16px'
                            }}>
                                {renderInput('is_emergency', 'Mark as Emergency', 'checkbox', '', false)}
                                {formData.is_emergency && (
                                    <>
                                        {renderInput('emergency_level', 'Emergency Level', 'select', '', true, emergencyLevels)}
                                        {renderInput('emergency_notes', 'Emergency Notes', 'textarea', 'Describe the emergency situation', false)}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 'guardian':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <Users size={18} style={{ color: 'var(--teal-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Guardian Information (Optional)</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('guardian_name', 'Guardian Name', 'text', 'Full name of guardian', false)}
                            {renderInput('guardian_phone', 'Guardian Phone', 'text', 'Guardian contact number', false)}
                            {renderInput('guardian_relationship', 'Relationship', 'select', '', false, relationships)}
                        </div>

                        <div style={{
                            marginTop: '16px',
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '16px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '12px'
                            }}>
                                <Shield size={18} style={{ color: 'var(--primary-color)' }} />
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)'
                                }}>Next of Kin (Optional)</span>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                gap: '16px'
                            }}>
                                {renderInput('next_of_kin_name', 'Next of Kin Name', 'text', 'Full name', false)}
                                {renderInput('next_of_kin_phone', 'Next of Kin Phone', 'text', 'Contact number', false)}
                                {renderInput('next_of_kin_relationship', 'Relationship', 'select', '', false, relationships)}
                                {renderInput('next_of_kin_address', 'Address', 'textarea', 'Complete address', false)}
                            </div>
                        </div>
                    </div>
                );

            case 'insurance':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <CreditCard size={18} style={{ color: 'var(--pink-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Insurance & Billing Information (Optional)</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('insurance_provider', 'Insurance Provider', 'text', 'e.g. State Life Insurance', false)}
                            {renderInput('insurance_policy_number', 'Policy Number', 'text', 'Insurance policy number', false)}
                            {renderInput('insurance_expiry', 'Insurance Expiry', 'date', '', false)}
                            {renderInput('billing_type', 'Billing Type', 'select', '', false, billingTypes)}
                            {renderInput('billing_notes', 'Billing Notes', 'textarea', 'Any billing related notes', false)}
                        </div>
                    </div>
                );

            case 'referral':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <Stethoscope size={18} style={{ color: 'var(--secondary-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Referral & Visit Information</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('visit_reason', 'Reason for Visit', 'textarea', 'What brings the patient today?', true)}
                            {renderInput('visit_type', 'Visit Type', 'select', '', false, visitTypes)}
                            {renderInput('visit_mode', 'Visit Mode', 'select', '', false, visitModes)}
                            {renderInput('arrival_time', 'Arrival Time', 'datetime-local', '', false)}
                            {renderInput('referred_by', 'Referred By', 'text', 'Who referred this patient?', false)}
                            {renderInput('referral_doctor', 'Referral Doctor', 'text', 'Name of referring doctor', false)}
                            {renderInput('referral_hospital', 'Referral Hospital', 'text', 'Name of referring hospital', false)}
                            {renderInput('referred_from', 'Referred From', 'text', 'Hospital/Clinic name', false)}
                        </div>
                    </div>
                );

            case 'bed':
                return renderBedAssignment();

            case 'additional':
                return (
                    <div style={{
                        background: 'var(--bg-primary)',
                        borderRadius: '14px',
                        padding: isMobile ? '16px' : '20px',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px'
                        }}>
                            <FileText size={18} style={{ color: 'var(--primary-color)' }} />
                            <span style={{
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                            }}>Additional Information</span>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '16px'
                        }}>
                            {renderInput('preferred_language', 'Preferred Language', 'select', '', false, languages)}
                            {renderInput('preferred_contact_method', 'Preferred Contact', 'select', '', false, contactMethods)}
                            {renderInput('notes', 'Notes', 'textarea', 'Any additional notes about the patient', false)}

                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    marginTop: '8px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <Activity size={18} style={{ color: 'var(--secondary-color)' }} />
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Social History</span>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: '16px'
                                }}>
                                    {renderInput('occupation_details', 'Occupation Details', 'text', 'Describe occupation', false)}
                                    {renderInput('living_situation', 'Living Situation', 'select', '', false, livingSituations)}
                                    {renderInput('exercise_frequency', 'Exercise Frequency', 'select', '', false, exerciseFrequencies)}
                                    {renderInput('diet_type', 'Diet Type', 'select', '', false, dietTypes)}
                                    {renderInput('sleep_pattern', 'Sleep Pattern', 'text', 'e.g. 7-8 hours', false)}
                                </div>
                            </div>

                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    marginTop: '8px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <Syringe size={18} style={{ color: 'var(--primary-color)' }} />
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Immunization Status</span>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: '16px'
                                }}>
                                    {renderInput('immunization_status', 'Immunization Status', 'select', '', false, immunizationStatuses)}
                                    {renderInput('last_vaccination', 'Last Vaccination Date', 'date', '', false)}
                                    {renderInput('vaccination_notes', 'Vaccination Notes', 'textarea', 'Additional vaccination details', false)}
                                </div>
                            </div>

                            <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    marginTop: '8px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid var(--border-color)'
                                }}>
                                    <CheckCircle size={18} style={{ color: 'var(--success-color)' }} />
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>Consent & Documents</span>
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                                    gap: '16px'
                                }}>
                                    {renderInput('consent_signed', 'I confirm that I have obtained patient consent', 'checkbox', '', true)}
                                    {formData.consent_signed && renderInput('consent_date', 'Consent Date', 'date', '', false)}
                                    {renderInput('documents_attached', 'Documents Attached', 'checkbox', '', false)}
                                    {renderInput('document_notes', 'Document Notes', 'textarea', 'List of attached documents', false)}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // ===== MAIN RENDER =====
    if (loading && isEditMode) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader size={40} className="spinner" style={{ color: 'var(--primary-color)' }} />
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading patient data...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            padding: isMobile ? '16px' : '32px',
        }}>
            <div style={{
                maxWidth: '1100px',
                margin: '0 auto',
            }}>
                {/* ===== TOAST ===== */}
                {toast.show && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 10000,
                        animation: 'slideInRight 0.5s ease-out',
                        maxWidth: '450px',
                        width: '100%'
                    }}>
                        <div style={{
                            padding: '16px 20px',
                            borderRadius: '12px',
                            background: toast.type === 'success' ? '#22C55E' : '#EF4444',
                            color: 'white',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
                                {toast.message}
                            </div>
                            <button
                                onClick={() => setToast({ show: false, message: '', type: 'success' })}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    opacity: 0.8
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== BACK BUTTON ===== */}
                <button
                    onClick={() => navigate(isEditMode ? `/patient/${id}` : -1)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        marginBottom: '24px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontFamily: 'var(--font-family)',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <ArrowLeft size={18} /> {isEditMode ? 'Back to Patient' : 'Back'}
                </button>

                {/* ===== MAIN CARD ===== */}
                <div style={{
                    background: 'var(--card-bg)',
                    borderRadius: '20px',
                    boxShadow: 'var(--shadow-md)',
                    padding: isMobile ? '20px' : '36px',
                    border: '1px solid var(--border-color)'
                }}>
                    {/* ===== HEADER ===== */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '28px',
                        paddingBottom: '20px',
                        borderBottom: '2px solid var(--border-color)',
                        flexWrap: 'wrap'
                    }}>
                        <div style={{
                            padding: '12px',
                            borderRadius: '14px',
                            background: 'var(--primary-color)15',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {isEditMode ? <User size={24} style={{ color: 'var(--primary-color)' }} /> : <UserPlus size={24} style={{ color: 'var(--primary-color)' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h1 style={{
                                fontSize: isMobile ? '1.3rem' : '1.6rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {isEditMode ? `Patient Profile: ${formData.name}` : 'Register New Patient'}
                            </h1>
                            <p style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-muted)',
                                marginTop: '2px'
                            }}>
                                {isEditMode ? 'View and manage patient information, appointments, prescriptions and vitals' : 'Fill in the patient\'s personal, medical, and contact information'}
                            </p>
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                        }}>
                            {patientData?.status && (
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    background: patientData.status === 'emergency' ? '#FEE2E2' : '#DCFCE7',
                                    color: patientData.status === 'emergency' ? '#DC2626' : '#16A34A'
                                }}>
                                    {patientData.status === 'emergency' ? '🚨 Emergency' : '✅ Active'}
                                </span>
                            )}
                            <span style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                background: 'var(--bg-primary)',
                                padding: '4px 10px',
                                borderRadius: '10px'
                            }}>
                                {availableBeds.length} beds available
                            </span>
                        </div>
                    </div>

                    {/* ===== ERROR MESSAGE ===== */}
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 18px',
                            marginBottom: '20px',
                            borderRadius: '12px',
                            background: 'var(--danger-color)15',
                            border: '1px solid var(--danger-color)30',
                            color: 'var(--danger-color)'
                        }}>
                            <AlertCircle size={20} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.95rem' }}>{error}</span>
                        </div>
                    )}

                    {/* ===== VIEW MODE TABS ===== */}
                    {isEditMode && isViewMode && renderViewTabs()}

                    {/* ===== FORM (Edit Mode) ===== */}
                    {(!isViewMode || !isEditMode) && (
                        <>
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                                marginBottom: '24px',
                                overflowX: 'auto',
                                padding: '4px 0',
                                flexWrap: isMobile ? 'nowrap' : 'wrap'
                            }}>
                                {sections.map(section => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    const hasErrors = Object.keys(formErrors).some(key =>
                                        key.includes(section.id) ||
                                        (section.id === 'personal' && ['name', 'email', 'phone', 'cnic', 'date_of_birth', 'gender', 'blood_group'].includes(key)) ||
                                        (section.id === 'bed' && ['requires_bed', 'bed_id'].includes(key))
                                    );

                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '8px 14px',
                                                border: isActive ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                                                borderRadius: '10px',
                                                background: isActive ? 'var(--primary-color)10' : 'transparent',
                                                cursor: 'pointer',
                                                fontSize: isMobile ? '0.75rem' : '0.8rem',
                                                fontFamily: 'var(--font-family)',
                                                color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                                transition: 'all 0.2s ease',
                                                whiteSpace: 'nowrap',
                                                position: 'relative'
                                            }}
                                        >
                                            <Icon size={isMobile ? 14 : 16} />
                                            <span>{isMobile ? section.label.substring(0, 6) : section.label}</span>
                                            {hasErrors && (
                                                <span style={{
                                                    position: 'absolute',
                                                    top: '-4px',
                                                    right: '-4px',
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: 'var(--danger-color)'
                                                }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSubmit} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px'
                            }}>
                                {renderSection(activeSection)}

                                <div style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    gap: '12px',
                                    marginTop: '8px',
                                    paddingTop: '20px',
                                    borderTop: '2px solid var(--border-color)'
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isEditMode) {
                                                setIsViewMode(true);
                                                setActiveTab('appointments');
                                                fetchPatientData();
                                            } else {
                                                navigate(-1);
                                            }
                                        }}
                                        style={{
                                            padding: isMobile ? '14px 20px' : '12px 24px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '12px',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: isMobile ? '1rem' : '0.95rem',
                                            fontFamily: 'var(--font-family)',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s ease',
                                            width: isMobile ? '100%' : 'auto',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>

                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        flex: 1,
                                        justifyContent: isMobile ? 'stretch' : 'flex-end',
                                        flexDirection: isMobile ? 'column' : 'row'
                                    }}>
                                        {activeSection !== sections[sections.length - 1].id && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentIndex = sections.findIndex(s => s.id === activeSection);
                                                    if (currentIndex < sections.length - 1) {
                                                        setActiveSection(sections[currentIndex + 1].id);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                }}
                                                style={{
                                                    padding: isMobile ? '14px 20px' : '12px 24px',
                                                    border: '1.5px solid var(--border-color)',
                                                    borderRadius: '12px',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    fontSize: isMobile ? '1rem' : '0.95rem',
                                                    fontFamily: 'var(--font-family)',
                                                    color: 'var(--text-secondary)',
                                                    transition: 'all 0.2s ease',
                                                    width: isMobile ? '100%' : 'auto',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                Next Section <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            style={{
                                                padding: isMobile ? '14px 20px' : '12px 28px',
                                                border: 'none',
                                                borderRadius: '12px',
                                                background: loading ? 'var(--primary-color)70' : 'var(--primary-color)',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                fontSize: isMobile ? '1rem' : '0.95rem',
                                                fontFamily: 'var(--font-family)',
                                                color: 'white',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                opacity: loading ? 0.7 : 1,
                                                transition: 'all 0.2s ease',
                                                width: isMobile ? '100%' : 'auto',
                                                boxShadow: loading ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.3)'
                                            }}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader size={18} className="spinner" />
                                                    {isEditMode ? 'Updating...' : 'Registering...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={18} />
                                                    {isEditMode ? 'Update Patient' : 'Register Patient'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* ===== APPOINTMENT MODAL ===== */}
            {showAppointmentModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '20px',
                        padding: '28px',
                        maxWidth: '550px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Calendar size={20} style={{ color: 'var(--primary-color)' }} />
                                {editingAppointment ? 'Edit Appointment' : 'Book Appointment'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAppointmentModal(false);
                                    setEditingAppointment(null);
                                    resetAppointmentForm();
                                }}
                                style={{
                                    padding: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    borderRadius: '8px'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleAppointmentSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Date <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={appointmentForm.appointment_date}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_date: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Time <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <select
                                        value={appointmentForm.appointment_time}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointment_time: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                        required
                                    >
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Doctor Name <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Dr. John Doe"
                                        value={appointmentForm.doctor_name}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor_name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Department
                                    </label>
                                    <select
                                        value={appointmentForm.department}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, department: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Reason
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Reason for visit"
                                        value={appointmentForm.reason}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, reason: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Status
                                    </label>
                                    <select
                                        value={appointmentForm.status}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="no-show">No Show</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Notes
                                    </label>
                                    <textarea
                                        placeholder="Additional notes..."
                                        value={appointmentForm.notes}
                                        onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                                        rows={3}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '24px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAppointmentModal(false);
                                        setEditingAppointment(null);
                                        resetAppointmentForm();
                                    }}
                                    style={{
                                        padding: '10px 24px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{
                                        padding: '10px 28px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        background: actionLoading ? 'var(--primary-color)70' : 'var(--primary-color)',
                                        color: 'white',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: actionLoading ? 0.7 : 1
                                    }}
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader size={18} className="spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {editingAppointment ? 'Update' : 'Book'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== PRESCRIPTION MODAL ===== */}
            {showPrescriptionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '20px',
                        padding: '28px',
                        maxWidth: '650px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <FileText size={20} style={{ color: 'var(--warning-color)' }} />
                                {editingPrescription ? 'Edit Prescription' : 'New Prescription'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowPrescriptionModal(false);
                                    setEditingPrescription(null);
                                    resetPrescriptionForm();
                                }}
                                style={{
                                    padding: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    borderRadius: '8px'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handlePrescriptionSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Doctor Name <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Dr. John Doe"
                                        value={prescriptionForm.doctor_name}
                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctor_name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Diagnosis <span style={{ color: 'var(--danger-color)' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Upper Respiratory Tract Infection"
                                        value={prescriptionForm.diagnosis}
                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                        required
                                    />
                                </div>

                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '8px'
                                    }}>
                                        <label style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            color: 'var(--text-secondary)'
                                        }}>
                                            Medications <span style={{ color: 'var(--danger-color)' }}>*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addMedication}
                                            style={{
                                                padding: '4px 12px',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: 'var(--primary-color)'
                                            }}
                                        >
                                            <Plus size={14} /> Add Medication
                                        </button>
                                    </div>

                                    {prescriptionForm.medications.map((med, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                padding: '12px',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '10px',
                                                marginBottom: '8px',
                                                background: 'var(--bg-primary)'
                                            }}
                                        >
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: '8px'
                                            }}>
                                                <div>
                                                    <label style={{
                                                        display: 'block',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-muted)',
                                                        marginBottom: '2px'
                                                    }}>
                                                        Medication Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Paracetamol"
                                                        value={med.name}
                                                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            background: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{
                                                        display: 'block',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-muted)',
                                                        marginBottom: '2px'
                                                    }}>
                                                        Dosage
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 500mg"
                                                        value={med.dosage}
                                                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            background: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{
                                                        display: 'block',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-muted)',
                                                        marginBottom: '2px'
                                                    }}>
                                                        Frequency
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 3x daily"
                                                        value={med.frequency}
                                                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            background: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{
                                                        display: 'block',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-muted)',
                                                        marginBottom: '2px'
                                                    }}>
                                                        Duration
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. 7 days"
                                                        value={med.duration}
                                                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            background: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <label style={{
                                                        display: 'block',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 500,
                                                        color: 'var(--text-muted)',
                                                        marginBottom: '2px'
                                                    }}>
                                                        Notes
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Take with food"
                                                        value={med.notes}
                                                        onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '6px 10px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px',
                                                            fontSize: '0.85rem',
                                                            background: 'var(--bg-primary)',
                                                            color: 'var(--text-primary)',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            {prescriptionForm.medications.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedication(index)}
                                                    style={{
                                                        marginTop: '8px',
                                                        padding: '4px 10px',
                                                        border: '1px solid var(--danger-color)',
                                                        borderRadius: '6px',
                                                        background: 'transparent',
                                                        cursor: 'pointer',
                                                        fontSize: '0.7rem',
                                                        color: 'var(--danger-color)'
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Instructions
                                    </label>
                                    <textarea
                                        placeholder="Instructions for the patient..."
                                        value={prescriptionForm.instructions}
                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Notes
                                    </label>
                                    <textarea
                                        placeholder="Additional notes..."
                                        value={prescriptionForm.notes}
                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Status
                                    </label>
                                    <select
                                        value={prescriptionForm.status}
                                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, status: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '10px',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            appearance: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="expired">Expired</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '24px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPrescriptionModal(false);
                                        setEditingPrescription(null);
                                        resetPrescriptionForm();
                                    }}
                                    style={{
                                        padding: '10px 24px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{
                                        padding: '10px 28px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        background: actionLoading ? 'var(--warning-color)70' : 'var(--warning-color)',
                                        color: 'white',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: actionLoading ? 0.7 : 1
                                    }}
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader size={18} className="spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {editingPrescription ? 'Update' : 'Save'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== VITALS MODAL ===== */}
            {showVitalsModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '20px',
                        padding: '28px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <HeartPulse size={20} style={{ color: 'var(--danger-color)' }} />
                                Record Vital Signs
                            </h2>
                            <button
                                onClick={() => {
                                    setShowVitalsModal(false);
                                    resetVitalsForm();
                                }}
                                style={{
                                    padding: '8px',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    borderRadius: '8px'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleVitalsSubmit}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '12px'
                            }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        BP Systolic
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="120"
                                        value={vitalsForm.blood_pressure_systolic}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_systolic: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        BP Diastolic
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="80"
                                        value={vitalsForm.blood_pressure_diastolic}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure_diastolic: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Heart Rate (bpm)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="72"
                                        value={vitalsForm.heart_rate}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, heart_rate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Temperature (°C)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="36.5"
                                        value={vitalsForm.temperature}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        O₂ Saturation (%)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="98"
                                        value={vitalsForm.oxygen_saturation}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, oxygen_saturation: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="70"
                                        value={vitalsForm.weight}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, weight: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Height (cm)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="175"
                                        value={vitalsForm.height}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, height: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Blood Sugar
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="120"
                                        value={vitalsForm.blood_sugar}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, blood_sugar: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Respiratory Rate
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="16"
                                        value={vitalsForm.respiratory_rate}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, respiratory_rate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        BMI (Auto-calculated)
                                    </label>
                                    <input
                                        type="text"
                                        value={vitalsForm.bmi}
                                        readOnly
                                        placeholder="Auto-calculated from weight & height"
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            cursor: 'not-allowed'
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '4px'
                                    }}>
                                        Notes
                                    </label>
                                    <textarea
                                        placeholder="Additional notes..."
                                        value={vitalsForm.notes}
                                        onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                                        rows={2}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1.5px solid var(--border-color)',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            background: 'var(--bg-primary)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                marginTop: '24px',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowVitalsModal(false);
                                        resetVitalsForm();
                                    }}
                                    style={{
                                        padding: '10px 24px',
                                        border: '1.5px solid var(--border-color)',
                                        borderRadius: '10px',
                                        background: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    style={{
                                        padding: '10px 28px',
                                        border: 'none',
                                        borderRadius: '10px',
                                        background: actionLoading ? 'var(--danger-color)70' : 'var(--danger-color)',
                                        color: 'white',
                                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        opacity: actionLoading ? 0.7 : 1
                                    }}
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader size={18} className="spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Record Vitals
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                input:focus, select:focus, textarea:focus {
                    outline: none;
                }
                
                input::placeholder, textarea::placeholder {
                    color: var(--text-muted);
                }

                .form-error {
                    border-color: var(--danger-color) !important;
                }

                @media (max-width: 768px) {
                    input, select, textarea {
                        font-size: 16px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddPatient;