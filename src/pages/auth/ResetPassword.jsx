import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Lock, Activity, Check, X, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  // Password complexity regex validation
  const validations = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please ensure your password meets all complexity requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper component to render complexity checklist indicators
  const ValidationIndicator = ({ text, isValid }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: isValid ? 'var(--secondary-color)' : 'var(--text-secondary)', marginBottom: '4px' }}>
      {isValid ? <Check size={14} /> : <X size={14} style={{ color: 'var(--danger-color)' }} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="auth-container">
      <Card>
        <div className="auth-logo">
          <Activity className="auth-logo-icon" size={28} />
          <span>Subhan Care</span>
        </div>
        <div className="auth-header">
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Set a secure new password for your account</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>Password updated successfully! Redirecting you to sign in...</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <InputField
              label="New Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              icon={Lock}
              disabled={isSubmitting}
              required
            />

            <InputField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              icon={Lock}
              disabled={isSubmitting}
              required
            />

            {/* Checklist of requirements */}
            <div style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '20px', backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
              <p style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Password must contain:</p>
              <ValidationIndicator text="At least 8 characters" isValid={validations.length} />
              <ValidationIndicator text="At least one uppercase letter (A-Z)" isValid={validations.hasUpper} />
              <ValidationIndicator text="At least one lowercase letter (a-z)" isValid={validations.hasLower} />
              <ValidationIndicator text="At least one number (0-9)" isValid={validations.hasNumber} />
              <ValidationIndicator text="At least one special character (@, $, !, etc.)" isValid={validations.hasSpecial} />
            </div>

            <Button type="submit" loading={isSubmitting} disabled={!isPasswordValid || password !== confirmPassword}>
              Update Password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
