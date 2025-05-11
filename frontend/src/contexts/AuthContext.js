import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Function to handle login
  const login = async (username, password) => {
    // Implement your login logic here, for now using a mock user
    const user = {
      id: 'user-123',
      username: username,
      name: 'Demo User',
      token: 'mock-token'
    };
    
    // Save user to local storage
    localStorage.setItem('comfyui_user', JSON.stringify(user));
    setCurrentUser(user);
    return user;
  };
  
  // Function to handle logout
  const logout = () => {
    localStorage.removeItem('comfyui_user');
    setCurrentUser(null);
  };
  
  // Check if the user is already logged in
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('comfyui_user'));
    if (user) {
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);
  
  const value = {
    currentUser,
    login,
    logout,
    isLoggedIn: !!currentUser
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
