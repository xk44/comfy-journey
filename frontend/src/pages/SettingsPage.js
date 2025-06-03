import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import civitaiService from '../services/civitaiService';
import backupService from '../services/backupService';

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

  const [civitaiKey, setCivitaiKey] = useState('');
  const [restoreFile, setRestoreFile] = useState(null);

  const [paths, setPaths] = useState({
    workflowsDir: '',
    checkpointsDir: '',
    lorasDir: ''
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

    const savedPaths = localStorage.getItem('cj_paths');
    if (savedPaths) {
      try {
        const p = JSON.parse(savedPaths);
        setPaths(p);
      } catch (err) {
        console.error('Error parsing saved paths:', err);
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

  const handlePathChange = (e) => {
    const { name, value } = e.target;
    setPaths({
      ...paths,
      [name]: value
    });
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

  const handleSavePaths = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('cj_paths', JSON.stringify(paths));
      showToast('Paths saved', 'success');
    } catch (err) {
      console.error('Error saving paths:', err);
      showToast('Failed to save paths', 'error');
    }
  };

  const handleSaveCivitaiKey = async (e) => {
    e.preventDefault();
    try {
      await civitaiService.setApiKey(civitaiKey);
      setCivitaiKey('');
      showToast('Civitai API key saved', 'success');
    } catch (error) {
      console.error('Error saving Civitai key:', error);
      showToast('Failed to save key. Please try again.', 'error');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const blob = await backupService.downloadBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cj-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.tar.gz`;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('Backup downloaded', 'success');
    } catch (err) {
      console.error('Backup failed', err);
      showToast('Failed to create backup', 'error');
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoreFile) return;
    try {
      await backupService.restoreBackup(restoreFile);
      setRestoreFile(null);
      showToast('Backup restored', 'success');
    } catch (err) {
      console.error('Restore failed', err);
      showToast('Failed to restore backup', 'error');
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
            className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            Backup
          </button>
          <button
            className={`settings-tab ${activeTab === 'paths' ? 'active' : ''}`}
            onClick={() => setActiveTab('paths')}
          >
            Paths
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
                    value={civitaiKey}
                    onChange={(e) => setCivitaiKey(e.target.value)}
                  />
                  <button className="save-button" onClick={handleSaveCivitaiKey}>Save</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="settings-section">
              <h2>Backup &amp; Restore</h2>
              <div className="backup-actions">
                <button className="save-button" onClick={handleDownloadBackup}>Download Backup</button>
                <input type="file" onChange={e => setRestoreFile(e.target.files[0])} />
                <button className="save-button" onClick={handleRestoreBackup}>Restore</button>
              </div>
            </div>
          )}

          {activeTab === 'paths' && (
            <div className="settings-section">
              <h2>Download Paths</h2>

              <form className="settings-form" onSubmit={handleSavePaths}>
                <div className="form-group">
                  <label htmlFor="workflowsDir">Workflows Directory</label>
                  <input
                    type="text"
                    id="workflowsDir"
                    name="workflowsDir"
                    value={paths.workflowsDir}
                    onChange={handlePathChange}
                    placeholder="/path/to/workflows"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="checkpointsDir">Checkpoints Directory</label>
                  <input
                    type="text"
                    id="checkpointsDir"
                    name="checkpointsDir"
                    value={paths.checkpointsDir}
                    onChange={handlePathChange}
                    placeholder="/path/to/checkpoints"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lorasDir">Loras Directory</label>
                  <input
                    type="text"
                    id="lorasDir"
                    name="lorasDir"
                    value={paths.lorasDir}
                    onChange={handlePathChange}
                    placeholder="/path/to/loras"
                  />
                </div>

                <button type="submit" className="save-button">Save Paths</button>
              </form>
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