import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

// ─── Extract role from wherever it's available ────────────────────────────────
// Priority: user_metadata.role (set at signup) → profiles table (if it exists)
// This means the app works WITHOUT needing to run supabase_setup.sql
const getRoleFromUser = (authUser) => {
  return authUser?.user_metadata?.role || null;
};

// ─── Auth Provider ─────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolveUser = (authUser) => {
    if (!authUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }
    const userRole = getRoleFromUser(authUser);
    setUser(authUser);
    setRole(userRole);
    setLoading(false);
    return userRole;
  };

  // Initialize from existing Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        resolveUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sign Up ──────────────────────────────────────────────────────────────────
  // Stores name + role in Supabase user_metadata — no profiles table needed
  const signUp = async (email, password, name, userRole) => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: userRole },
        },
      });

      if (signUpError) throw signUpError;

      setLoading(false);
      return { user: data.user, session: data.session };
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  // ── Sign In ──────────────────────────────────────────────────────────────────
  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const userRole = resolveUser(data.user);
      return { user: data.user, role: userRole };
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  };

  // ── Sign Out ─────────────────────────────────────────────────────────────────
  const signOut = async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setRole(null);
      setLoading(false);
    }
  };

  // ── Password Reset ───────────────────────────────────────────────────────────
  const resetPassword = async (email) => {
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Verify ───────────────────────────────────────────────────────────────
  const verifyOtp = async (email, otp) => {
    setError(null);
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });
      if (otpError) throw otpError;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Update Password ──────────────────────────────────────────────────────────
  const updatePassword = async (newPassword) => {
    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    role,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    verifyOtp,
    updatePassword,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
