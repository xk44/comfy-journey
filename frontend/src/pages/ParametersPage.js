import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const ParametersPage = () => {
  const [parameters, setParameters] = useState({
    steps: 20,
    cfg_scale: 7,
    width: 512,
    height: 512,
    sampler: 'Euler a',
    seed: -1,
  });
  const [presets, setPresets] = useState([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [toast, setToast] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Load presets
    const loadPresets = async () => {
      try {
        // Mocked presets for demonstration
        setPresets([
          {
            id: "preset1",
            name: "Default",
            steps: 20,
            cfg_scale: 7,
            width: 512,
            height: 512,
            sampler: "Euler a",
            seed: -1,
          },
          {
            id: "preset2",
            name: "High Quality",
            steps: 50,
            cfg_scale: 7.5,
            width: 768,
            height: 768,
            sampler: "DPM++ 2M Karras",
            seed: -1,
          },
          {
            id: "preset3",
            name: "Fast Generation",
            steps: 10,
            cfg_scale: 7,
            width: 512,
            height: 512,
            sampler: "DPM Fast",
            seed: -1,
          }
        ]);
      } catch (error) {
        console.error("Error loading presets:", error);
      }
    };

    loadPresets();
  }, []);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) {
      showToast('Please enter a preset name', 'error');
      return;
    }

    const newPreset = {
      id: `preset${Date.now()}`,
      name: newPresetName,
      ...parameters
    };

    setPresets([...presets, newPreset]);
    setNewPresetName('');
    showToast('Preset saved successfully!', 'success');
  };

  const handleLoadPreset = (preset) => {
    setParameters(preset);
    showToast(`Preset "${preset.name}" loaded`, 'success');
  };

  const handleDeletePreset = (id) => {
    setPresets(presets.filter(preset => preset.id !== id));
    showToast('Preset deleted', 'success');
  };

  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;

    // Convert numeric values
    if (name !== 'sampler') {
      parsedValue = name === 'seed' ? parseInt(value) : parseFloat(value);
    }

    setParameters({
      ...parameters,
      [name]: parsedValue
    });
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  return (
    <div className="parameters-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="page-header">
        <h1>Generation Parameters</h1>
        <p>Configure and save parameter presets for image generation</p>
      </div>

      <div className="parameters-container">
        <div className="parameter-form">
          <h2>Current Parameters</h2>
          
          <div className="form-group">
            <label htmlFor="steps">Steps:</label>
            <input 
              type="number" 
              id="steps" 
              name="steps"
              min="1" 
              max="150" 
              value={parameters.steps} 
              onChange={handleParameterChange} 
            />
            <span className="input-help">Higher values = more precise results, but slower generation</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="cfg_scale">CFG Scale:</label>
            <input 
              type="number" 
              id="cfg_scale" 
              name="cfg_scale"
              min="1" 
              max="30" 
              step="0.5" 
              value={parameters.cfg_scale} 
              onChange={handleParameterChange} 
            />
            <span className="input-help">How strictly to follow the prompt (higher = more faithful)</span>
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="width">Width:</label>
              <input 
                type="number" 
                id="width" 
                name="width"
                min="128" 
                max="2048" 
                step="64" 
                value={parameters.width} 
                onChange={handleParameterChange} 
              />
            </div>
            
            <div className="form-group half">
              <label htmlFor="height">Height:</label>
              <input 
                type="number" 
                id="height" 
                name="height"
                min="128" 
                max="2048" 
                step="64" 
                value={parameters.height} 
                onChange={handleParameterChange} 
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="sampler">Sampler:</label>
            <select 
              id="sampler" 
              name="sampler"
              value={parameters.sampler} 
              onChange={handleParameterChange}
            >
              <option value="Euler a">Euler a</option>
              <option value="Euler">Euler</option>
              <option value="DPM++ 2M Karras">DPM++ 2M Karras</option>
              <option value="DPM Fast">DPM Fast</option>
              <option value="DDIM">DDIM</option>
              <option value="LMS">LMS</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="seed">Seed:</label>
            <input 
              type="number" 
              id="seed" 
              name="seed"
              value={parameters.seed} 
              onChange={handleParameterChange} 
            />
            <span className="input-help">-1 for random seed, or specify for reproducible results</span>
          </div>
          
          <div className="save-preset-container">
            <input 
              type="text" 
              placeholder="Preset Name" 
              value={newPresetName} 
              onChange={(e) => setNewPresetName(e.target.value)} 
            />
            <button 
              className="save-button"
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
            >
              Save as Preset
            </button>
          </div>
        </div>
        
        <div className="presets-container">
          <h2>Saved Presets</h2>
          
          {presets.length > 0 ? (
            <div className="presets-list">
              {presets.map(preset => (
                <div key={preset.id} className="preset-card">
                  <h3>{preset.name}</h3>
                  <div className="preset-details">
                    <div>Steps: {preset.steps}</div>
                    <div>CFG: {preset.cfg_scale}</div>
                    <div>Size: {preset.width}×{preset.height}</div>
                    <div>Sampler: {preset.sampler}</div>
                  </div>
                  <div className="preset-actions">
                    <button 
                      className="load-button"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      Load
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeletePreset(preset.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No presets saved yet. Configure parameters and save them as presets for quick access.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParametersPage;