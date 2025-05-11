import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import civitaiService from '../services/civitaiService';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    civitaiApiKey: '',
    comfyuiUrl: 'http://localhost:8188',
    theme: 'dark',
    autoSave: true,
    notificationsEnabled: true
  });
  const [toast, setToast] = useState(null);
  const { currentUser, logout } = useAuth();
  
  useEffect(() => {
    // Load settings from localStorage
    const loadSettings = () => {
      const civitaiApiKey = localStorage.getItem('civitai_api_key') || '';
      const comfyuiUrl = localStorage.getItem('comfyuiUrl') || 'http://localhost:8188';
      const theme = localStorage.getItem('theme') || 'dark';
      const autoSave = localStorage.getItem('autoSave') !== 'false';
      const notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';
      
      setSettings({
        civitaiApiKey,
        comfyuiUrl,
        theme,
        autoSave,
        notificationsEnabled
      });
    };
    
    loadSettings();
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSave = async () => {
    // Save settings to localStorage
    localStorage.setItem('civitai_api_key', settings.civitaiApiKey);
    localStorage.setItem('comfyuiUrl', settings.comfyuiUrl);
    localStorage.setItem('theme', settings.theme);
    localStorage.setItem('autoSave', settings.autoSave);
    localStorage.setItem('notificationsEnabled', settings.notificationsEnabled);
    
    // Update the API key in the service
    if (settings.civitaiApiKey) {
      civitaiService.setApiKey(settings.civitaiApiKey);
    }
    
    // Update the theme
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    showToast('Settings saved successfully!', 'success');
  };
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      showToast('Logged out successfully', 'info');
    }
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const clearToast = () => {
    setToast(null);
  };
  
  return (
    <div className="settings-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your application preferences</p>
      </div>
      
      <div className="settings-container">
        <div className="settings-section">
          <h2>API Connections</h2>
          
          <div className="form-group">
            <label htmlFor="civitaiApiKey">Civitai API Key:</label>
            <input
              type="password"
              id="civitaiApiKey"
              name="civitaiApiKey"
              value={settings.civitaiApiKey}
              onChange={handleChange}
              placeholder="Enter your Civitai API key"
            />
            <span className="input-help">Required for sharing images to Civitai</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="comfyuiUrl">ComfyUI URL:</label>
            <input
              type="text"
              id="comfyuiUrl"
              name="comfyuiUrl"
              value={settings.comfyuiUrl}
              onChange={handleChange}
              placeholder="http://localhost:8188"
            />
            <span className="input-help">URL to connect to your ComfyUI instance</span>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Appearance</h2>
          
          <div className="form-group">
            <label htmlFor="theme">Theme:</label>
            <select
              id="theme"
              name="theme"
              value={settings.theme}
              onChange={handleChange}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Preferences</h2>
          
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="autoSave"
              name="autoSave"
              checked={settings.autoSave}
              onChange={handleChange}
            />
            <label htmlFor="autoSave">Auto-save generated images</label>
          </div>
          
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="notificationsEnabled"
              name="notificationsEnabled"
              checked={settings.notificationsEnabled}
              onChange={handleChange}
            />
            <label htmlFor="notificationsEnabled">Enable notifications</label>
          </div>
        </div>
        
        <div className="settings-section">
          <h2>Account</h2>
          
          {currentUser ? (
            <div className="account-info">
              <p>Logged in as: <strong>{currentUser.email}</strong></p>
              <button 
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <p>Not logged in</p>
          )}
        </div>
        
        <div className="settings-actions">
          <button 
            className="save-button"
            onClick={handleSave}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;