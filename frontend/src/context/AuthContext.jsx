import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let active = true;

    // Never leave the app blank: if Supabase is slow or unreachable, render anyway
    const safetyTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 5000);

    // Listen for Auth events dynamically (INITIAL_SESSION fires on load with the stored session).
    // This callback must stay synchronous: awaiting another supabase call in here
    // deadlocks the auth client's lock and the app never finishes loading.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // A token refresh doesn't change the profile
      if (event === 'TOKEN_REFRESHED') return;

      // Defer the profile query until the auth callback has returned
      setTimeout(async () => {
        await fetchUserProfile(currentUser.id);
        if (active) setLoading(false);
      }, 0);
    });

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const register = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error("Supabase signOut error:", err);
      throw err;
    } finally {
      // Clear user states to trigger immediate UI update
      setUser(null);
      setUserProfile(null);
      
      // Wipe localStorage tokens and cache to prevent stale sessions
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
