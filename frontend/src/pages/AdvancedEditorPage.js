import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdvancedEditor from '../components/AdvancedEditor';
import Toast from '../components/Toast';
import workflowService from '../services/workflowService';
import progressService from '../services/progressService';

const AdvancedEditorPage = () => {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if image data was passed in location state
    if (location.state?.image) {
      setImage(location.state.image);
      if (location.state.prompt) {
        setPrompt(location.state.prompt);
      }
    } else {
      // If no image in location state, check session storage
      const storedImage = sessionStorage.getItem('selectedImage');
      if (storedImage) {
        try {
          const parsedImage = JSON.parse(storedImage);
          setImage(parsedImage);
          const storedPrompt = sessionStorage.getItem('imagePrompt');
          if (storedPrompt) {
            setPrompt(storedPrompt);
          }
        } catch (error) {
          console.error('Error parsing stored image:', error);
        }
      }
    }
  }, [location.state]);

  const handleSave = (imageData) => {
    // Save logic would go here
    showToast('Image saved successfully!', 'success');
  };

  const handleGenerateInpaint = async (newPrompt, maskUrl) => {
    setPrompt(newPrompt);

    if (!maskUrl) return;

    try {
      showToast('Inpainting request sent!', 'info');
      const res = await workflowService.executeWorkflow(
        null,
        newPrompt,
        { init_image: image.url, mask: maskUrl }
      );
      const jobId = res?.payload?.job_id;
      if (!jobId) {
        showToast('Failed to start inpainting', 'error');
        return;
      }
      progressService.subscribe(jobId, (data) => {
        const job = data.payload?.job;
        if (job && job.status === 'done') {
          showToast('Inpainting completed successfully!', 'success');
        }
      });
    } catch (err) {
      console.error('Inpainting error', err);
      showToast('Inpainting failed', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  return (
    <div className="advanced-editor-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      {image ? (
        <AdvancedEditor 
          image={image}
          prompt={prompt}
          onGenerateInpaint={handleGenerateInpaint}
          onSave={handleSave}
        />
      ) : (
        <div className="empty-state">
          <h2>No Image Selected</h2>
          <p>Please select an image from the Create page to edit.</p>
          <button 
            className="navigate-button"
            onClick={() => navigate('/')}
          >
            Go to Create Page
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedEditorPage;