import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Card from '../../components/Card';
import {
  Mail,
  Lock,
  Activity,
  AlertCircle,
  User,
  Briefcase,
  CheckCircle,
} from 'lucide-react';

const ROLES = [
  { value: 'Admin', label: 'Administrator', description: 'Full system access & management' },
  { value: 'Doctor', label: 'Doctor', description: 'Patient records & appointments' },
  { value: 'Receptionist', label: 'Receptionist', description: 'Patient registration & scheduling' },
  { value: 'Pharmacist', label: 'Pharmacist', description: 'Medication & pharmacy management' },
  { value: 'Billing Staff', label: 'Billing Staff', description: 'Invoices & payment processing' },
];

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [localError, setLocalError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    }

    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    } else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter and one number.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!selectedRole) {
      errors.role = 'Please select a role.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signUp(email, password, name.trim(), selectedRole);
      setSuccessMessage(
        'Account created successfully! Please check your email to confirm your account, then sign in.'
      );
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      setLocalError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '480px' }}>
        <Card>
          <div className="auth-logo">
            <Activity className="auth-logo-icon" size={28} />
            <span>Subhan Care</span>
          </div>
          <div className="auth-header">
            <h2 className="auth-title">Create Your Account</h2>
            <p className="auth-subtitle">Register to access the hospital management system</p>
          </div>

          {localError && (
            <div className="alert alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{localError}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" style={{ display: 'flex' }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="auth-form">
              <InputField
                label="Full Name"
                type="text"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Ahmed Khan"
                icon={User}
                error={formErrors.name}
                disabled={isSubmitting}
                required
              />

              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. doctor@hospital.com"
                icon={Mail}
                error={formErrors.email}
                disabled={isSubmitting}
                required
              />

              <InputField
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters, 1 uppercase, 1 number"
                icon={Lock}
                error={formErrors.password}
                disabled={isSubmitting}
                required
              />

              <InputField
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                icon={Lock}
                error={formErrors.confirmPassword}
                disabled={isSubmitting}
                required
              />

              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={14} />
                  Select Your Role <span className="error-text" style={{ display: 'inline' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {ROLES.map((roleOption) => (
                    <button
                      key={roleOption.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(roleOption.value);
                        setFormErrors((prev) => ({ ...prev, role: undefined }));
                      }}
                      disabled={isSubmitting}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `2px solid ${selectedRole === roleOption.value ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        backgroundColor: selectedRole === roleOption.value
                          ? 'rgba(37, 99, 235, 0.08)'
                          : 'var(--card-bg)',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        opacity: isSubmitting ? 0.65 : 1,
                        gridColumn: roleOption.value === 'Billing Staff' ? 'span 2' : undefined,
                      }}
                    >
                      <div style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: selectedRole === roleOption.value ? 'var(--primary-color)' : 'var(--text-primary)',
                        marginBottom: '2px',
                      }}>
                        {roleOption.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {roleOption.description}
                      </div>
                    </button>
                  ))}
                </div>
                {formErrors.role && (
                  <span className="error-text" style={{ marginTop: '6px', display: 'block' }}>
                    {formErrors.role}
                  </span>
                )}
              </div>

              <Button type="submit" loading={isSubmitting} style={{ marginTop: '8px' }}>
                Create Account
              </Button>
            </form>
          )}

          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={{ fontWeight: 600, color: 'var(--primary-color)', textDecoration: 'none' }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
