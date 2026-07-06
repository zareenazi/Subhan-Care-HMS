import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { ShieldCheck, ArrowLeft, Activity, AlertCircle } from 'lucide-react';

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resetPassword, error: authError, setError: setAuthError } = useAuth();

  // Try to retrieve email from router state or fallback to local storage
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [resendTimer, setResendTimer] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    const passedEmail = location.state?.email || localStorage.getItem('subhancare_reset_email');
    if (!passedEmail) {
      navigate('/forgot-password');
    } else {
      setEmail(passedEmail);
    }
  }, [location, navigate]);

  // Count down resend timer
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index, value) => {
    // Only allow single numeric digits
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); // Get last typed character
    setOtp(newOtp);

    // Auto-focus next input if a digit was entered
    if (value && index < 7) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Focus previous input on Backspace if current box is empty
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();

    // Check if pasted value is a 6-digit number
    if (/^\d{8}$/.test(pasteData)) {
      const pasteArray = pasteData.split('');
      setOtp(pasteArray);
      // Focus the last input box
      inputRefs.current[7].focus();
    }
  };

  const handleResend = async () => {
    setError(null);
    setAuthError(null);
    setResendSuccess(false);

    try {
      await resetPassword(email);
      setResendSuccess(true);
      setResendTimer(60);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setAuthError(null);

    const otpCode = otp.join('');
    if (otpCode.length !== 8) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email, otpCode);
      // On success, proceed to Reset Password page
      navigate('/reset-password');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
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
          <h2 className="auth-title">Verify OTP</h2>
          <p className="auth-subtitle">
            Enter the 6-digit code sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
          </p>
        </div>

        {(error || authError) && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error || authError}</span>
          </div>
        )}

        {resendSuccess && (
          <div className="alert alert-success">
            <span>A new verification code has been sent successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
                disabled={isSubmitting}
                required
              />
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Button type="submit" loading={isSubmitting}>
              Verify & Proceed
            </Button>
          </div>

          <div className="text-center" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Didn't receive the code?{' '}
            {resendTimer > 0 ? (
              <span>Resend in {resendTimer}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="btn-link"
                style={{ background: 'none', border: 'none', font: 'inherit', fontWeight: '600' }}
              >
                Resend Code
              </button>
            )}
          </div>

          <div className="text-center" style={{ marginTop: '20px' }}>
            <Link to="/forgot-password" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
              <ArrowLeft size={16} />
              Change Email
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default OtpVerification;
