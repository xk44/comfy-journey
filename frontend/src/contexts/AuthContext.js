import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('comfyui_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // For this local auth implementation, we'll just check against some hardcoded values
    // In a real app, this would validate against a database
    if (username === 'admin' && password === 'password') {
      const user = {
        id: '1',
        username: 'admin',
        name: 'Admin User',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('comfyui_user', JSON.stringify(user));
      setCurrentUser(user);
      return user;
    }
    
    throw new Error('Invalid username or password');
  };

  const register = (username, password, name) => {
    // For this local auth implementation, we'll just create a new user in localStorage
    // In a real app, this would create a new user in the database
    const existingUsers = JSON.parse(localStorage.getItem('comfyui_users') || '[]');
    
    // Check if username is already taken
    if (existingUsers.some(user => user.username === username)) {
      throw new Error('Username already exists');
    }
    
    const newUser = {
      id: Date.now().toString(),
      username,
      name,
      createdAt: new Date().toISOString()
    };
    
    existingUsers.push(newUser);
    localStorage.setItem('comfyui_users', JSON.stringify(existingUsers));
    
    // Auto login after registration
    localStorage.setItem('comfyui_user', JSON.stringify(newUser));
    setCurrentUser(newUser);
    
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('comfyui_user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
