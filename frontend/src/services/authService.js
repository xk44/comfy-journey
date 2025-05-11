import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create an axios instance for authenticated requests
const authAxios = axios.create({
  baseURL: API_URL
});

// Add a request interceptor to include the token in headers
authAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// For token refreshing, we would add a response interceptor here
// But for simplicity, we'll skip that for now

const register = async (username, password, name) => {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username,
      password,
      name
    });
    return response.data;
  } catch (error) {
    const message = 
      error.response?.data?.detail || 
      error.message || 
      'An error occurred during registration';
    throw new Error(message);
  }
};

const login = async (username, password) => {
  try {
    // Use FormData for the login endpoint since it expects form data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/api/auth/token`, formData);
    
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }
    
    return response.data.user;
  } catch (error) {
    const message = 
      error.response?.data?.detail || 
      error.message || 
      'Invalid username or password';
    throw new Error(message);
  }
};

const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

const getCurrentUser = () => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
};

const isAuthenticated = () => {
  return !!localStorage.getItem('auth_token');
};

const getProfile = async () => {
  try {
    const response = await authAxios.get('/api/auth/me');
    return response.data;
  } catch (error) {
    // If we get a 401, clear the token and user data
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
};

const updatePreferences = async (preferences) => {
  try {
    const response = await authAxios.put('/api/auth/preferences', preferences);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
};

const getPreferences = async () => {
  try {
    const response = await authAxios.get('/api/auth/preferences');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
    }
    throw error;
  }
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  getProfile,
  updatePreferences,
  getPreferences,
  authAxios
};

export default authService;
