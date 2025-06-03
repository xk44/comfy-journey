import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import civitaiService from '../services/civitaiService';
import backupService from '../services/backupService';
import workflowService from '../services/workflowService';
import voiceService from '../services/voiceService';

const SettingsPage = () => {
  const [toast, setToast] = useState(null);
  

  const [preferences, setPreferences] = useState({
    darkMode: true,
    autoSave: true,
    enableNotifications: true,
    gridSize: 'medium',
    defaultAspectRatio: '1:1',
    defaultQuality: 'standard',
    voicePlacement: 'append',
    audioInputId: '',
    audioOutputId: '',
    playSound: false,
    useCustomSound: false,
    customSoundUrl: '',
    soundVolume: 1
  });

  const [civitaiKey, setCivitaiKey] = useState('');
  const [civitaiShowNsfw, setCivitaiShowNsfw] = useState(() => {
    const saved = localStorage.getItem('cj_civitai_show_nsfw');
    return saved === 'true';
  });
  const [restoreFile, setRestoreFile] = useState(null);

  const [comfyuiUrl, setComfyuiUrl] = useState(() => localStorage.getItem('comfyuiUrl') || 'http://localhost:8188');
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [autoReconnect, setAutoReconnect] = useState(() => {
    const saved = localStorage.getItem('cj_auto_reconnect');
    return saved === 'true';
  });

  const [paths, setPaths] = useState({
    workflowsDir: '',
    checkpointsDir: '',
    lorasDir: '',
    whisperModel: 'base',
    whisperModelPath: ''
  });

  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  
  const [activeTab, setActiveTab] = useState('preferences');
  
  useEffect(() => {
    
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

    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devs => {
        setAudioInputs(devs.filter(d => d.kind === 'audioinput'));
        setAudioOutputs(devs.filter(d => d.kind === 'audiooutput'));
      }).catch(err => console.error('enumerateDevices failed', err));
    }
  }, []);

  // Apply theme when preference changes
  useEffect(() => {
    if (preferences.darkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [preferences.darkMode]);

  // Persist NSFW preference
  useEffect(() => {
    localStorage.setItem('cj_civitai_show_nsfw', civitaiShowNsfw.toString());
  }, [civitaiShowNsfw]);

  useEffect(() => {
    const checkStatus = async () => {
      const data = await workflowService.getComfyUIStatus();
      setConnectionStatus(data?.payload?.status || data.status || 'offline');
    };
    checkStatus();
    let interval;
    if (autoReconnect) {
      interval = setInterval(checkStatus, 5000);
    }
    return () => interval && clearInterval(interval);
  }, [autoReconnect]);

  useEffect(() => {
    localStorage.setItem('cj_auto_reconnect', autoReconnect.toString());
  }, [autoReconnect]);
  
  
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = {
      ...preferences,
      [name]: type === 'checkbox' ? checked : value
    };
    setPreferences(updated);
    localStorage.setItem('comfyui_preferences', JSON.stringify(updated));
    if (name === 'darkMode') {
      if (type === 'checkbox' ? checked : value) {
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
      }
    }
  };

  const handleSoundFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const updated = { ...preferences, customSoundUrl: ev.target.result };
      setPreferences(updated);
      localStorage.setItem('comfyui_preferences', JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const handlePathChange = (e) => {
    const { name, value } = e.target;
    setPaths({
      ...paths,
      [name]: value
    });
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

  const handleConnectBackend = async () => {
    localStorage.setItem('comfyuiUrl', comfyuiUrl);
    const data = await workflowService.getComfyUIStatus();
    setConnectionStatus(data?.payload?.status || data.status || 'offline');
  };

  const handleRestartBackend = async () => {
    await workflowService.restartComfyUI();
    showToast('Restart command sent', 'info');
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
            className={`settings-tab ${activeTab === 'backend' ? 'active' : ''}`}
            onClick={() => setActiveTab('backend')}
          >
            Backend
          </button>
        </div>
        
        <div className="settings-content">
          
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

                <div className="form-group">
                  <label htmlFor="voicePlacement">Voice Text Placement</label>
                  <select
                    id="voicePlacement"
                    name="voicePlacement"
                    value={preferences.voicePlacement}
                    onChange={handlePreferenceChange}
                  >
                    <option value="append">Append</option>
                    <option value="prepend">Prepend</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="audioInputId">Audio Input</label>
                  <select
                    id="audioInputId"
                    name="audioInputId"
                    value={preferences.audioInputId}
                    onChange={handlePreferenceChange}
                  >
                    <option value="">Default</option>
                    {audioInputs.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="audioOutputId">Audio Output</label>
                  <select
                    id="audioOutputId"
                    name="audioOutputId"
                    value={preferences.audioOutputId}
                    onChange={handlePreferenceChange}
                  >
                    <option value="">Default</option>
                    {audioOutputs.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group checkbox-group">
                  <input
                    type="checkbox"
                    id="playSound"
                    name="playSound"
                    checked={preferences.playSound}
                    onChange={handlePreferenceChange}
                  />
                  <label htmlFor="playSound">Play sound when job completes</label>
                </div>

                {preferences.playSound && (
                  <div className="form-group">
                    <label>Notification Sound</label>
                    <div>
                      <label>
                        <input
                          type="radio"
                          name="useCustomSound"
                          value="false"
                          checked={!preferences.useCustomSound}
                          onChange={() => handlePreferenceChange({ target: { name: 'useCustomSound', value: false, type: 'radio' } })}
                        /> Default
                      </label>
                      <label style={{ marginLeft: '1rem' }}>
                        <input
                          type="radio"
                          name="useCustomSound"
                          value="true"
                          checked={preferences.useCustomSound}
                          onChange={() => handlePreferenceChange({ target: { name: 'useCustomSound', value: true, type: 'radio' } })}
                        /> Custom
                      </label>
                      {preferences.useCustomSound && (
                        <input type="file" accept="audio/*" onChange={handleSoundFileChange} />
                      )}
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        name="soundVolume"
                        value={preferences.soundVolume}
                        onChange={handlePreferenceChange}
                      />
                    </div>
                  </div>
                )}
                
                <button type="submit" className="save-button">Save Preferences</button>
              </form>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="settings-section">
              <h2>API Keys</h2>
              
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
                <div className="api-key-value" style={{ marginTop: '0.5rem' }}>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={civitaiShowNsfw}
                      onChange={(e) => setCivitaiShowNsfw(e.target.checked)}
                    />
                    Show NSFW content
                  </label>
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

                <div className="form-group">
                  <label htmlFor="whisperModel">Whisper Model</label>
                  <select
                    id="whisperModel"
                    name="whisperModel"
                    value={paths.whisperModel}
                    onChange={handlePathChange}
                  >
                    <option value="tiny">tiny</option>
                    <option value="base">base</option>
                    <option value="small">small</option>
                    <option value="medium">medium</option>
                    <option value="large">large</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="whisperModelPath">Whisper Model Path</label>
                  <input
                    type="text"
                    id="whisperModelPath"
                    name="whisperModelPath"
                    value={paths.whisperModelPath}
                    onChange={handlePathChange}
                    placeholder="/path/to/whisper"
                  />
                </div>

                <button type="button" className="save-button" onClick={() => voiceService.downloadModel(paths.whisperModel)}>
                  Download Model
                </button>

                <button type="submit" className="save-button">Save Paths</button>
              </form>
            </div>
          )}

          {activeTab === 'backend' && (
            <div className="settings-section">
              <h2 className="backend-header">
                Backend Connection
                <span className={`status-indicator ${connectionStatus === 'online' ? 'online' : ''}`}></span>
              </h2>
              <div className="form-group">
                <label htmlFor="comfyuiUrl">ComfyUI URL</label>
                <input
                  type="text"
                  id="comfyuiUrl"
                  value={comfyuiUrl}
                  onChange={(e) => setComfyuiUrl(e.target.value)}
                  placeholder="http://localhost:8188"
                />
                <button className="save-button" onClick={handleConnectBackend}>Save</button>
              </div>
              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="autoReconnect"
                  checked={autoReconnect}
                  onChange={(e) => {
                    setAutoReconnect(e.target.checked);
                    localStorage.setItem('cj_auto_reconnect', e.target.checked.toString());
                  }}
                />
                <label htmlFor="autoReconnect">Auto-Reconnect</label>
              </div>
              <button className="save-button" onClick={handleRestartBackend}>Restart ComfyUI</button>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
