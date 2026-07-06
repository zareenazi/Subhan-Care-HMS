import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { Mail, Lock, Activity, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [localError, setLocalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    if (!email) {
      errors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/role-redirect');
    } catch (err) {
      setLocalError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '420px' }}>

        <Card>
          <div className="auth-logo">
            <Activity className="auth-logo-icon" size={28} />
            <span>Subhan Care</span>
          </div>
          <div className="auth-header">
            <h2 className="auth-title">Welcome Back</h2>
            <p className="auth-subtitle">Sign in to access your hospital account</p>
          </div>

          {localError && (
            <div className="alert alert-danger">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="••••••••"
              icon={Lock}
              error={formErrors.password}
              disabled={isSubmitting}
              required
            />

            <div className="flex-between form-group" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="checkbox" id="rememberMe" style={{ cursor: 'pointer' }} />
                <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" loading={isSubmitting}>
              Sign In
            </Button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                style={{ fontWeight: 600, color: 'var(--primary-color)', textDecoration: 'none' }}
              >
                Create Account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
