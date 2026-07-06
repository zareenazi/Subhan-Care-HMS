import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity } from 'lucide-react';
import Button from '../../components/Button';

const RoleRedirect = () => {
  const { user, role, loading, signOut, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (role) {
      switch (role) {
        case 'Admin':
          navigate('/admin/dashboard');
          break;
        case 'Doctor':
          navigate('/doctor/dashboard');
          break;
        case 'Receptionist':
          navigate('/receptionist/dashboard');
          break;
        case 'Pharmacist':
          navigate('/pharmacist/dashboard');
          break;
        case 'Billing Staff':
          navigate('/billing/dashboard');
          break;
        default:
          // Unknown role or no role profiles match
          console.warn('Unknown user role:', role);
          break;
      }
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="auth-container">
        <div style={{ textAlign: 'center' }}>
          <Activity className="auth-logo-icon" size={48} style={{ animation: 'spin 2s linear infinite', marginBottom: '16px' }} />
          <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            Determining system access permissions...
          </p>
        </div>
      </div>
    );
  }

  // If loading is done, user exists but role could not match any routing paths
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2 className="auth-title" style={{ color: 'var(--danger-color)', marginBottom: '12px' }}>
          Role Resolution Error
        </h2>
        <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
          Your user account is authenticated, but no access role (Admin, Doctor, etc.) has been assigned to your profile yet.
        </p>
        {error && (
          <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Detail: {error}
          </p>
        )}
        <Button onClick={signOut} variant="danger">
          Sign Out & Return
        </Button>
      </div>
    </div>
  );
};

export default RoleRedirect;
