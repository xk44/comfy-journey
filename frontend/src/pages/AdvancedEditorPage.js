import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdvancedEditor from '../components/AdvancedEditor';
import ImageDropZone from '../components/ImageDropZone';
import { useAuth } from '../contexts/AuthContext';
import imageService from '../services/imageService';
import workflowService from '../services/workflowService';

const AdvancedEditorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [currentImage, setCurrentImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [maskImage, setMaskImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [toast, setToast] = useState(null);
  
  // Load image from location state or default
  useEffect(() => {
    if (location.state?.editImage) {
      setCurrentImage(location.state.editImage);
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  
  // Load available inpainting workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const mappings = await workflowService.getWorkflowMappings();
        // Filter to only inpainting workflows
        const inpaintingWorkflows = mappings.filter(wf => 
          wf.action_name.toLowerCase().includes('inpaint') || 
          wf.description.toLowerCase().includes('inpaint')
        );
        setWorkflows(inpaintingWorkflows);
        
        // Set default workflow if available
        if (inpaintingWorkflows.length > 0) {
          setSelectedWorkflow(inpaintingWorkflows[0].id);
        }
      } catch (error) {
        console.error('Error fetching workflows:', error);
        showToast('Failed to load inpainting workflows', 'error');
      }
    };
    
    fetchWorkflows();
  }, []);
  
  // Show toast notification
  const showToast = (message, type = "info") => {
    setToast({ message, type });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };
  
  // Handle image selection from drop zone
  const handleImageSelected = (file, previewUrl) => {
    setCurrentImage({
      file,
      url: previewUrl,
      isLocal: true
    });
    showToast('Image loaded for editing', 'success');
  };
  
  // Handle prompt and mask updates
  const handleGenerateInpaint = (newPrompt, maskUrl) => {
    setPrompt(newPrompt);
    if (maskUrl) {
      setMaskImage(maskUrl);
    }
  };
  
  // Handle actual inpainting generation
  const generateInpainting = async () => {
    if (!currentImage || !prompt || !maskImage) {
      showToast('Please provide an image, prompt, and create a mask', 'error');
      return;
    }
    
    if (!selectedWorkflow) {
      showToast('Please select an inpainting workflow', 'error');
      return;
    }
    
    setGenerating(true);
    
    try {
      // In a real app, this would call the ComfyUI API to generate the inpainting
      console.log('Generating inpainting with:');
      console.log('- Prompt:', prompt);
      console.log('- Workflow:', selectedWorkflow);
      console.log('- Has mask:', !!maskImage);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock result - in a real app this would come from the API
      const result = {
        url: 'https://replicate.delivery/pbxt/AFcQQmGjG5ubgCIUiLrsmVSLA7cdlqcWKXr5FKnClRgx94QIA/out-0.png',
        prompt: prompt
      };
      
      // Update the current image with the result
      setCurrentImage({
        ...currentImage,
        url: result.url,
        prompt: result.prompt
      });
      
      showToast('Inpainting successfully generated!', 'success');
    } catch (error) {
      console.error('Error generating inpainting:', error);
      showToast('Failed to generate inpainting. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };
  
  // Handle saving the edited image
  const handleSaveImage = async (dataUrl) => {
    try {
      if (currentUser) {
        // In a real app, this would call your backend to save the image
        const savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
        
        const newImage = {
          id: `img${Date.now()}`,
          url: dataUrl,
          prompt: prompt,
          createdAt: new Date().toISOString()
        };
        
        savedImages.push(newImage);
        localStorage.setItem('savedImages', JSON.stringify(savedImages));
        
        showToast('Image saved to gallery', 'success');
      } else {
        showToast('Please log in to save images', 'error');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      showToast('Failed to save image', 'error');
    }
  };
  
  return (
    <div className="advanced-editor-page">
      {toast && (
        <div className={`toast ${toast.type}`}>
          <div className="toast-content">
            <p>{toast.message}</p>
          </div>
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      
      <div className="editor-header">
        <h1>Advanced Image Editor</h1>
        
        <div className="editor-controls">
          <div className="workflow-selector">
            <label htmlFor="workflow-select">Inpainting Workflow:</label>
            <select 
              id="workflow-select"
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
            >
              <option value="">Select a workflow</option>
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.action_name}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            className="generate-button"
            onClick={generateInpainting}
            disabled={generating || !prompt || !maskImage || !currentImage}
          >
            {generating ? 'Generating...' : 'Generate Inpainting'}
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        {currentImage ? (
          <AdvancedEditor 
            image={currentImage}
            prompt={prompt}
            onGenerateInpaint={handleGenerateInpaint}
            onSave={handleSaveImage}
            className="main-editor"
          />
        ) : (
          <div className="upload-container">
            <h2>Upload an Image to Edit</h2>
            <ImageDropZone 
              onImageSelected={handleImageSelected} 
            />
            <div className="editor-help">
              <h3>How to use the editor:</h3>
              <ol>
                <li>Upload an image using the drop zone above</li>
                <li>Use the brush tool to paint areas you want to change</li>
                <li>Enter a prompt describing what should appear in those areas</li>
                <li>Select an inpainting workflow</li>
                <li>Click "Generate Inpainting" to create your edited image</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedEditorPage;
