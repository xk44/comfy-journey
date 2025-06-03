import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create an axios instance that includes the auth token in the header
const authAxios = axios.create();

// Add a request interceptor to include the auth token and ComfyUI URL
authAxios.interceptors.request.use(
  config => {
    const user = JSON.parse(localStorage.getItem('comfyui_user'));
    if (user && user.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }
    const comfyUrl = localStorage.getItem('comfyuiUrl');
    if (comfyUrl) {
      config.headers['X-Comfyui-Url'] = comfyUrl;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Login user
const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      username,
      password
    });
    
    if (response.data) {
      localStorage.setItem('comfyui_user', JSON.stringify(response.data));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Register user
const register = async (username, password, name) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username,
      password,
      name
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem('comfyui_user');
};

// Get current user
const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem('comfyui_user'));
};

// Update user profile
const updateProfile = async (userData) => {
  try {
    const response = await authAxios.put(`${API_URL}/api/users/profile`, userData);
    
    // Update stored user data
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem('comfyui_user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// For demo purposes, we'll provide a function to create a demo user
const createDemoUser = () => {
  const demoUser = {
    id: 'demo-user',
    username: 'demo',
    name: 'Demo User',
    token: 'demo-token'
  };
  
  localStorage.setItem('comfyui_user', JSON.stringify(demoUser));
  return demoUser;
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  createDemoUser,
  authAxios
};

export default authService;