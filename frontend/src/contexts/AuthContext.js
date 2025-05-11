import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for stored user based on token
    const initAuth = async () => {
      try {
        const storedUser = authService.getCurrentUser();
        if (storedUser) {
          setCurrentUser(storedUser);
          // Validate token by fetching profile
          try {
            await authService.getProfile();
          } catch (error) {
            console.error('Invalid token, logging out:', error);
            await logout();
          }
        } else {
          // For demo purposes, set a mock user
          setCurrentUser({
            id: "user123",
            name: "Demo User",
            email: "demo@example.com"
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError(error.message);
        
        // For demo purposes, set a mock user even on error
        setCurrentUser({
          id: "user123",
          name: "Demo User",
          email: "demo@example.com"
        });
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const user = await authService.login(username, password);
      setCurrentUser(user);
      setError(null);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const register = async (username, password, name) => {
    try {
      // First register
      await authService.register(username, password, name);
      // Then login with the new credentials
      const user = await login(username, password);
      return user;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      authService.logout();
      setCurrentUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUserPreferences = async (preferences) => {
    try {
      const result = await authService.updatePreferences(preferences);
      return result;
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError(error.message);
      throw error;
    }
  };

  const getUserPreferences = async () => {
    try {
      const result = await authService.getPreferences();
      return result.preferences;
    } catch (error) {
      console.error('Error getting preferences:', error);
      return {};
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    updateUserPreferences,
    getUserPreferences,
    error,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
