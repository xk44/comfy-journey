import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const SettingsPage = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const [toast, setToast] = useState(null);
  
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    email: '',
    bio: ''
  });

  const [preferences, setPreferences] = useState({
    darkMode: true,
    autoSave: true,
    enableNotifications: true,
    gridSize: 'medium',
    defaultAspectRatio: '1:1',
    defaultQuality: 'standard'
  });
  
  const [activeTab, setActiveTab] = useState('profile');
  
  useEffect(() => {
    // Load user profile if available
    if (currentUser) {
      setProfile({
        name: currentUser.name || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        bio: currentUser.bio || ''
      });
    }
    
    // Load saved preferences from localStorage
    const savedPreferences = localStorage.getItem('comfyui_preferences');
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        setPreferences(prefs);
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, [currentUser]);

  // Apply theme when preference changes
  useEffect(() => {
    if (preferences.darkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [preferences.darkMode]);
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };
  
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = {
      ...preferences,
      [name]: type === 'checkbox' ? checked : value
    };
    setPreferences(updated);
    if (name === 'darkMode') {
      if (type === 'checkbox' ? checked : value) {
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
      }
    }
  };
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      // In a real implementation, you would call the API
      // await updateProfile(profile);
      
      console.log('Profile updated:', profile);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile. Please try again.', 'error');
    }
  };
  
  const handleSavePreferences = (e) => {
    e.preventDefault();
    
    try {
      // Save preferences to localStorage
      localStorage.setItem('comfyui_preferences', JSON.stringify(preferences));
      
      console.log('Preferences saved:', preferences);
      showToast('Preferences saved successfully', 'success');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast('Failed to save preferences. Please try again.', 'error');
    }
  };
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
      window.location.href = '/';
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
      
      <h1 className="page-title">Settings</h1>
      
      <div className="settings-container">
        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button 
            className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            API Keys
          </button>
          <button 
            className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            Account
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile Settings</h2>
              
              <form className="settings-form" onSubmit={handleSaveProfile}>
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    placeholder="Your name" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input 
                    type="text" 
                    id="username" 
                    name="username"
                    value={profile.username}
                    onChange={handleProfileChange}
                    placeholder="Your username" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    placeholder="Your email" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea 
                    id="bio" 
                    name="bio"
                    value={profile.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell us about yourself" 
                    rows={4}
                  />
                </div>
                
                <button type="submit" className="save-button">Save Profile</button>
              </form>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h2>Preferences</h2>
              
              <form className="settings-form" onSubmit={handleSavePreferences}>
                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="darkMode" 
                    name="darkMode"
                    checked={preferences.darkMode}
                    onChange={handlePreferenceChange}
                  />
                  <label htmlFor="darkMode">Dark Mode</label>
                </div>
                
                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="autoSave" 
                    name="autoSave"
                    checked={preferences.autoSave}
                    onChange={handlePreferenceChange}
                  />
                  <label htmlFor="autoSave">Auto-save Generated Images</label>
                </div>
                
                <div className="form-group checkbox-group">
                  <input 
                    type="checkbox" 
                    id="enableNotifications" 
                    name="enableNotifications"
                    checked={preferences.enableNotifications}
                    onChange={handlePreferenceChange}
                  />
                  <label htmlFor="enableNotifications">Enable Notifications</label>
                </div>
                
                <div className="form-group">
                  <label htmlFor="gridSize">Grid Size</label>
                  <select 
                    id="gridSize" 
                    name="gridSize"
                    value={preferences.gridSize}
                    onChange={handlePreferenceChange}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="defaultAspectRatio">Default Aspect Ratio</label>
                  <select 
                    id="defaultAspectRatio" 
                    name="defaultAspectRatio"
                    value={preferences.defaultAspectRatio}
                    onChange={handlePreferenceChange}
                  >
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="9:16">Portrait (9:16)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="3:2">Photo (3:2)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="defaultQuality">Default Quality</label>
                  <select 
                    id="defaultQuality" 
                    name="defaultQuality"
                    value={preferences.defaultQuality}
                    onChange={handlePreferenceChange}
                  >
                    <option value="draft">Draft</option>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                    <option value="max">Maximum</option>
                  </select>
                </div>
                
                <button type="submit" className="save-button">Save Preferences</button>
              </form>
            </div>
          )}
          
          {activeTab === 'api' && (
            <div className="settings-section">
              <h2>API Keys</h2>
              
              <div className="api-key-item">
                <div className="api-key-info">
                  <h3>ComfyUI API Key</h3>
                  <p>Used to connect to your ComfyUI instance</p>
                </div>
                
                <div className="api-key-value">
                  <input 
                    type="password" 
                    value="●●●●●●●●●●●●●●●●" 
                    readOnly 
                  />
                  <button className="show-button">Show</button>
                  <button className="regenerate-button">Regenerate</button>
                </div>
              </div>
              
              <div className="api-key-item">
                <div className="api-key-info">
                  <h3>CivitAI API Key</h3>
                  <p>Required for CivitAI integration</p>
                </div>
                
                <div className="api-key-value">
                  <input 
                    type="text" 
                    placeholder="Enter your CivitAI API key" 
                  />
                  <button className="save-button">Save</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>Account Settings</h2>
              
              <div className="account-info">
                <div className="info-item">
                  <span className="info-label">Account Type:</span>
                  <span className="info-value">Free Plan</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Join Date:</span>
                  <span className="info-value">May 10, 2023</span>
                </div>
                
                <div className="info-item">
                  <span className="info-label">Images Generated:</span>
                  <span className="info-value">127</span>
                </div>
              </div>
              
              <div className="account-actions">
                <button className="upgrade-button">Upgrade to Pro</button>
                <button className="delete-account-button">Delete Account</button>
                <button className="logout-button" onClick={handleLogout}>Log Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;