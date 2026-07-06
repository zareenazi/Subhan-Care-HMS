import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Mail, ArrowLeft, Activity, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      // Navigate to OTP verification page and pass the email context
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.message || 'Failed to send password reset request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <Card>
        <div className="auth-logo">
          <Activity className="auth-logo-icon" size={28} />
          <span>Subhan Care</span>
        </div>
        <div className="auth-header">
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email to receive an OTP verification code</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <InputField
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. doctor@subhancare.com"
            icon={Mail}
            error={formErrors.email}
            disabled={isSubmitting}
            required
          />

          <div style={{ marginBottom: '20px' }}>
            <Button type="submit" loading={isSubmitting}>
              Send Verification Code
            </Button>
          </div>

          <div className="text-center">
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
