import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

// ─── Extract role from wherever it's available ────────────────────────────────
const getRoleFromUser = (authUser) => {
  return authUser?.user_metadata?.role || null;
};

// ─── Auth Provider ─────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch Profile ──────────────────────────────────────────────────────────
  const fetchProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      return;
    }
    try {
      console.log('🔍 Fetching profile for user:', authUser.id);

      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (fetchErr) {
        console.warn('⚠️ Profile fetch error, using metadata fallback:', fetchErr.message);
        setProfile({
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Guest',
          email: authUser.email,
          role: authUser.user_metadata?.role || 'Receptionist',
          phone: authUser.user_metadata?.phone || '',
          specialization: authUser.user_metadata?.specialization || '',
          experience: authUser.user_metadata?.experience || '',
          qualification: authUser.user_metadata?.qualification || '',
          address: authUser.user_metadata?.address || '',
          bio: authUser.user_metadata?.bio || '',
          gender: authUser.user_metadata?.gender || '',
          status: 'Active'
        });
      } else {
        console.log('✅ Profile fetched successfully:', data);
        setProfile(data);
      }
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
    }
  };

  // ── Resolve User ───────────────────────────────────────────────────────────
  const resolveUser = (authUser) => {
    if (!authUser) {
      setUser(null);
      setRole(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    const userRole = getRoleFromUser(authUser);
    setUser(authUser);
    setRole(userRole);
    setLoading(false);
    fetchProfile(authUser);
    return userRole;
  };

  // ── Initialize Session ─────────────────────────────────────────────────────
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
  }, []);

  // ── Sign Up ──────────────────────────────────────────────────────────────────
  const signUp = async (email, password, name, userRole) => {
    setError(null);
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: userRole,
            phone: '',
            specialization: '',
            experience: '',
            qualification: '',
            address: '',
            bio: '',
            gender: ''
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create profile entry after signup
      if (data.user) {
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              name: name,
              email: email,
              role: userRole,
              phone: '',
              specialization: '',
              experience: '',
              qualification: '',
              address: '',
              bio: '',
              gender: '',
              status: 'Active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
          console.log('✅ Profile created for new user');
        } catch (profileErr) {
          console.warn('Could not create profile entry:', profileErr.message);
        }
      }

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

      // Ensure profile exists for this user
      if (data.user) {
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (!existingProfile) {
            await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                email: data.user.email,
                role: data.user.user_metadata?.role || 'Receptionist',
                phone: data.user.user_metadata?.phone || '',
                specialization: data.user.user_metadata?.specialization || '',
                experience: data.user.user_metadata?.experience || '',
                qualification: data.user.user_metadata?.qualification || '',
                address: data.user.user_metadata?.address || '',
                bio: data.user.user_metadata?.bio || '',
                gender: data.user.user_metadata?.gender || '',
                status: 'Active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, { onConflict: 'id' });
            console.log('✅ Profile created during sign in');
          }
        } catch (profileErr) {
          console.warn('Profile check/creation error:', profileErr.message);
        }
      }

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
      setProfile(null);
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

  // ── Update Profile (COMPLETE - ALL FIELDS) ─────────────────────────────────
  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user is logged in');
    setError(null);
    setLoading(true);
    try {
      console.log('📝 Updating profile with:', updates);
      console.log('👤 User ID:', user.id);

      // 1. Update profiles table with ALL fields
      const profileData = {
        id: user.id,
        name: updates.name,
        email: user.email,
        role: updates.role || 'Receptionist',
        phone: updates.phone || '',
        specialization: updates.specialization || '',
        experience: updates.experience || '',
        qualification: updates.qualification || '',
        address: updates.address || '',
        bio: updates.bio || '',
        gender: updates.gender || '',
        status: updates.status || 'Active',
        updated_at: new Date().toISOString()
      };

      console.log('📤 Sending to profiles table:', profileData);

      const { data, error: dbError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (dbError) {
        console.error('❌ Profile upsert error:', dbError);
        throw dbError;
      }

      console.log('✅ Profiles table updated:', data);

      // 2. Update auth user metadata with ALL fields
      const metadata = {
        name: updates.name,
        role: updates.role || 'Receptionist',
        phone: updates.phone || '',
        specialization: updates.specialization || '',
        experience: updates.experience || '',
        qualification: updates.qualification || '',
        address: updates.address || '',
        bio: updates.bio || '',
        gender: updates.gender || ''
      };

      console.log('📤 Sending to auth metadata:', metadata);

      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: metadata
      });

      if (authError) {
        console.error('❌ Auth update error:', authError);
        throw authError;
      }

      console.log('✅ Auth metadata updated');

      // 3. Update state with ALL fields
      const updatedProfile = {
        id: user.id,
        name: updates.name,
        email: user.email,
        role: updates.role || 'Receptionist',
        phone: updates.phone || '',
        specialization: updates.specialization || '',
        experience: updates.experience || '',
        qualification: updates.qualification || '',
        address: updates.address || '',
        bio: updates.bio || '',
        gender: updates.gender || '',
        status: updates.status || 'Active'
      };

      setProfile(updatedProfile);
      setUser(authData.user);
      setRole(updates.role || 'Receptionist');

      console.log('✅ Profile updated successfully');
      return { success: true, profile: updatedProfile };
    } catch (err) {
      console.error('❌ Update profile error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Get User Profile ──────────────────────────────────────────────────────
  const getProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting profile:', err);
      return null;
    }
  };

  // ── Update User Status ─────────────────────────────────────────────────────
  const updateUserStatus = async (userId, status) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      if (user?.id === userId) {
        setProfile(prev => ({ ...prev, status }));
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating user status:', err);
      return { success: false, error: err.message };
    }
  };

  // ── Get All Users (Admin only) ────────────────────────────────────────────
  const getAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting all users:', err);
      return [];
    }
  };

  // ── Context Value ──────────────────────────────────────────────────────────
  const value = {
    user,
    role,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    verifyOtp,
    updatePassword,
    updateProfile,
    getProfile,
    getAllUsers,
    updateUserStatus,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};