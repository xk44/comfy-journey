import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ImageDropZone from '../components/ImageDropZone';
import ImageCard from '../components/ImageCard';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import workflowService from '../services/workflowService';
import imageService from '../services/imageService';
import civitaiService from '../services/civitaiService';

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [parameters, setParameters] = useState("");
  const [customActions, setCustomActions] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [settings, setSettings] = useState({
    civitaiApiKey: ""
  });
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState([]);
  const [models, setModels] = useState([
    { id: "model1", name: "Stable Diffusion 1.5" },
    { id: "model2", name: "Stable Diffusion XL" },
    { id: "model3", name: "Midjourney Style" },
  ]);
  const [selectedModel, setSelectedModel] = useState("model1");
  const [showSettings, setShowSettings] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredImages, setFilteredImages] = useState([]);
  const { currentUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [currentJob, setCurrentJob] = useState(null);
  const eventSourceRef = useRef(null);
  const location = useLocation();
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Handle image passed from Explore page
    if (location.state?.useImage) {
      setSelectedImage(location.state.useImage);
      setShowDropZone(true);
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    // Load custom actions if user is logged in
    if (currentUser) {
      const loadCustomActions = async () => {
        try {
          // In a real app, fetch from API
          // const actions = await workflowService.getCustomActions();
          
          // Mock data for demonstration
          const actions = [
            { id: "custom1", name: "Upscale 2x", workflow: "workflow3" },
            { id: "custom2", name: "Fix Faces", workflow: "workflow2" }
          ];
          
          setCustomActions(actions || []);
        } catch (error) {
          console.error("Error loading custom actions:", error);
        }
      };
      loadCustomActions();

      // Load workflows for executing custom actions
      const loadWorkflows = async () => {
        try {
          // In a real app, fetch from API
          // const data = await workflowService.getWorkflows();
          
          // Mock data for demonstration
          const data = [
            { id: "workflow1", name: "Stable Diffusion 1.5", description: "Standard text to image workflow" },
            { id: "workflow2", name: "SDXL Inpainting", description: "Inpainting with SDXL model" },
            { id: "workflow3", name: "Realistic Upscaler", description: "High quality image upscaling" }
          ];
          
          setWorkflows(data || []);
        } catch (error) {
          console.error("Error loading workflows:", error);
        }
      };
      loadWorkflows();
      
      // Load settings
      setSettings(prevSettings => ({
        ...prevSettings,
        civitaiApiKey: localStorage.getItem('civitai_api_key') || ""
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    // Fetch sample images for demonstration
    const fetchImages = async () => {
      try {
        // In a real app, fetch from API
        setImages([
          {
            id: "img1",
            url: "https://replicate.delivery/pbxt/jK6DlTtGaEKVAkrjGqFzLJD8XtnlgC0iJSSJZpMo44dAagsiA/out-0.png",
            prompt: "A beautiful sunset over a serene lake, photorealistic, 8k, detailed",
            workflow_id: "workflow1",
            created_at: new Date().toISOString()
          },
          {
            id: "img2",
            url: "https://replicate.delivery/pbxt/O0SJTXzrVhRLKB6HI5CZRQkLPaDANwPj1N6Vo6EFRGvhTwCQA/out-0.png",
            prompt: "A majestic dragon soaring through stormy clouds, intricate scales, lightning, epic fantasy art",
            workflow_id: "workflow2",
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: "img3",
            url: "https://replicate.delivery/pbxt/ALzjc0Gq3KSLedCcD44JIwOgkJOqDUjC3156zcXjuV46yfIiA/out-0.png",
            prompt: "Cyberpunk cityscape with neon lights and flying cars, sci-fi, futuristic, rainy night",
            workflow_id: "workflow3",
            created_at: new Date(Date.now() - 7200000).toISOString()
          }
        ]);
      } catch (error) {
        console.error("Error fetching images:", error);
        showToast("Failed to load images", "error");
      }
    };
    
    fetchImages();
  }, []);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    // Filter images based on search query
    if (searchQuery.trim() === "") {
      setFilteredImages(images);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredImages(
        images.filter(image => 
          image.prompt?.toLowerCase().includes(query)
        )
      );
    }
  }, [images, searchQuery]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast("Please enter a prompt", "error");
      return;
    }

    setGenerating(true);

    try {
      const resp = await workflowService.executeWorkflow(null, prompt);
      const jobId = resp?.payload?.job_id;
      if (!jobId) throw new Error("Invalid response from server");
      setCurrentJob({ id: jobId, status: "queued" });
      showToast(`Job ${jobId} queued`, "info");

      // Stream progress via SSE
      eventSourceRef.current = workflowService.streamProgress(jobId, (data) => {
        if (!data) return;
        if (data.status && data.status !== currentJob?.status) {
          setCurrentJob({ id: jobId, status: data.status });
          if (data.status === "done") {
            showToast(`Job ${jobId} done`, "success");
            eventSourceRef.current?.close();
            setGenerating(false);
          } else {
            showToast(`Job ${jobId} ${data.status}`, "info", 1000);
          }
        }
      });
    } catch (error) {
      console.error("Error generating image:", error);
      showToast("Failed to generate image. Please try again.", "error");
      setGenerating(false);
    }
  };

  const handleImageDrop = (imageData) => {
    if (!imageData) return;
    
    setSelectedImage(imageData);
    setShowDropZone(false);
  };

  const showToast = (message, type = "info", duration = 3000) => {
    setToast({ message, type });
    
    // Clear toast after duration
    setTimeout(() => {
      clearToast();
    }, duration);
  };

  const clearToast = () => {
    setToast(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    
    // Store selected image in sessionStorage for cross-page access
    sessionStorage.setItem('selectedImage', JSON.stringify(image));
    if (image.prompt) {
      sessionStorage.setItem('imagePrompt', image.prompt);
    }
  };

  const executeCustomAction = async (actionId) => {
    if (!selectedImage) {
      showToast("Please select an image first", "error");
      return;
    }

    const action = customActions.find(a => a.id === actionId);
    if (!action) {
      showToast("Action not found", "error");
      return;
    }

    const workflow = workflows.find(w => w.id === action.workflow);
    if (!workflow) {
      showToast("Workflow not found", "error");
      return;
    }

    setGenerating(true);
    try {
      console.log(`Executing custom action "${action.name}" with workflow "${workflow.name}"`);
      
      // In a real app, this would call the API to execute the workflow
      // const payload = {
      //   input_image_url: selectedImage.url,
      //   workflow_id: action.workflow
      // };
      // const response = await axios.post(`${API}/generate`, payload);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add new mock processed image
      const newImage = {
        id: `img${Date.now()}`,
        url: "https://replicate.delivery/pbxt/jK6DlTtGaEKVAkrjGqFzLJD8XtnlgC0iJSSJZpMo44dAagsiA/out-0.png",
        prompt: `${action.name} on "${selectedImage.prompt || 'Image'}"`,
        workflow_id: action.workflow,
        created_at: new Date().toISOString()
      };
      
      setImages([newImage, ...images]);
      showToast(`${action.name} completed successfully!`, "success");
    } catch (error) {
      console.error(`Error executing custom action:`, error);
      showToast("Failed to execute action. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyImage = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      showToast("Image URL copied to clipboard", "success");
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      showToast("Failed to copy to clipboard", "error");
    }
  };

  const handleShareToCivitai = async (image) => {
    if (!currentUser) {
      showToast("Please log in to share to Civitai", "error");
      return;
    }
    
    if (!settings?.civitaiApiKey) {
      showToast("Please set your Civitai API key in Settings", "error");
      return;
    }
    
    showToast("Uploading to Civitai...", "info");
    
    try {
      // In a real app, this would call the API
      // await civitaiService.saveImage(image.url, image.prompt, image.workflow_id);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast("Image shared to Civitai successfully", "success");
    } catch (error) {
      console.error("Error sharing to Civitai:", error);
      showToast("Failed to share to Civitai. Please try again.", "error");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = {
        id: `upload-${Date.now()}`,
        url: event.target?.result,
        file: file
      };
      setSelectedImage(imageData);
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="home-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="page-header">
        <h1>Create</h1>
        <p>Generate AI images with ComfyUI</p>
      </div>
      
      <div className="create-container">
        <div className="prompt-container">
          <div className="prompt-input-container">
            <input 
              type="text"
              className="prompt-input"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
            />
            
            <div className="prompt-options">
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={generating}
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              
              <button
                className={`settings-button ${showSettings ? 'active' : ''}`}
                onClick={() => setShowSettings(!showSettings)}
                disabled={generating}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button
                className={`upload-button ${showDropZone ? 'active' : ''}`}
                onClick={() => setShowDropZone(!showDropZone)}
                disabled={generating}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </button>
            </div>
          </div>
          
          {showSettings && (
            <div className="parameters-container">
              <textarea
                className="parameters-input"
                placeholder="Additional parameters (JSON)..."
                value={parameters}
                onChange={(e) => setParameters(e.target.value)}
                disabled={generating}
              />
            </div>
          )}
          
          {showDropZone && (
            <div className="dropzone-container">
              <ImageDropZone 
                onImageDrop={handleImageDrop}
                onUploadClick={handleUploadClick}
              />
              <input 
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileUpload}
              />
            </div>
          )}
          
          <div className="generate-container">
            {selectedImage && (
              <div className="selected-image-info">
                <span>Image selected for processing</span>
                
                {/* Custom actions */}
                {customActions.length > 0 && (
                  <div className="custom-actions">
                    <span>Available Actions:</span>
                    <div className="custom-action-buttons">
                      {customActions.map(action => (
                        <button 
                          key={action.id}
                          className="custom-action-button"
                          onClick={() => executeCustomAction(action.id)}
                          disabled={generating}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                          </svg>
                          {action.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Sharing options */}
                <div className="image-sharing-options">
                  <button 
                    className="sharing-button"
                    onClick={() => handleCopyImage(selectedImage.url)}
                    title="Copy Image URL"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    Copy Image URL
                  </button>
                  
                  <button 
                    className="sharing-button"
                    onClick={() => handleShareToCivitai(selectedImage)}
                    title="Share to Civitai"
                    disabled={!currentUser}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    Share to Civitai
                  </button>
                  
                  <button 
                    className="clear-button"
                    onClick={() => setSelectedImage(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
            
            <button 
              className="generate-button"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50">
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Generating...
                </>
              ) : (
                <>Generate</>
              )}
            </button>
          </div>
        </div>
        
        <div className="images-container">
          <div className="images-header">
            <h2>Your Generations</h2>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by prompt..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
          
          <div className="images-grid">
            {filteredImages.length > 0 ? (
              filteredImages.map(image => (
                <ImageCard 
                  key={image.id}
                  image={image}
                  onShare={(img) => handleShareToCivitai(img)}
                  onCopy={(url) => handleCopyImage(url)}
                  onSelect={handleImageSelect}
                />
              ))
            ) : (
              <div className="no-images">
                <p>No images found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;