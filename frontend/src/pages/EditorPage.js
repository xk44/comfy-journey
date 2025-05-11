import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';

const EditorPage = () => {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.image) {
      setImage(location.state.image);
      setPrompt(location.state.image.prompt || '');
    }
  }, [location.state]);

  const handleSave = (imageData) => {
    // Save logic would go here
    showToast('Image saved successfully!', 'success');
  };

  const handleGenerateInpaint = (newPrompt, maskUrl) => {
    setPrompt(newPrompt);
    
    if (maskUrl) {
      // Inpainting logic would go here
      showToast('Inpainting request sent!', 'success');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  const handleNavigateToAdvancedEditor = () => {
    navigate('/advanced-editor', { 
      state: { 
        image, 
        prompt 
      } 
    });
  };

  if (!image) {
    return (
      <div className="editor-page">
        <div className="empty-state">
          <h2>No Image Selected</h2>
          <p>Please select an image to edit from the Create page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="editor-sidebar">
        <div className="editor-section">
          <h3>Tools</h3>
          <div className="tools-panel">
            <button className="tool-button active">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Brush
            </button>
            <button className="tool-button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              Eraser
            </button>
            <button className="tool-button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
              Select
            </button>
          </div>
        </div>
        
        <div className="editor-section">
          <h3>Layers</h3>
          <div className="layers-panel">
            <div className="layer-item">
              <input type="checkbox" id="layer-mask" checked onChange={() => {}} />
              <label htmlFor="layer-mask">Mask</label>
            </div>
            <div className="layer-item">
              <input type="checkbox" id="layer-image" checked onChange={() => {}} />
              <label htmlFor="layer-image">Original Image</label>
            </div>
          </div>
        </div>
        
        <button className="advanced-editor-button" onClick={handleNavigateToAdvancedEditor}>
          Open Advanced Editor
        </button>
      </div>
      
      <div className="editor-main">
        <div className="editor-canvas">
          <img src={image.url} alt={image.prompt || "Image"} />
        </div>
        
        <div className="editor-controls">
          <input
            type="text"
            className="prompt-input"
            placeholder="Describe what to generate in masked areas..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          
          <div className="control-buttons">
            <button className="clear-button">Clear Mask</button>
            <button
              className="generate-button"
              onClick={() => handleGenerateInpaint(prompt, null)}
              disabled={!prompt.trim()}
            >
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;