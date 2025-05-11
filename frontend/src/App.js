import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Components
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginForm from "./components/LoginForm";
import ImageDropZone from "./components/ImageDropZone";

// Pages
import ExplorePage from "./pages/ExplorePage";
import GalleryPage from "./pages/GalleryPage";

// Contexts
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Toast notification component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className={`toast ${type}`}>
      <div className="toast-content">
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

// HomePage component
const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [parameters, setParameters] = useState("");
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
  const location = useLocation();

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
    // Fetch sample images for demonstration
    const fetchImages = async () => {
      try {
        // In a real app, fetch from API
        setImages([
          {
            id: "img1",
            url: "https://replicate.delivery/pbxt/4kw2JSufHBnKI1kUQCB7fHEspWh2fvzo3loD9CplCFYz1BiJA/out.png",
            prompt: "A cosmic flower blooming in space, surrounded by nebulae"
          },
          {
            id: "img2",
            url: "https://replicate.delivery/pbxt/AFcQQmGjG5ubgCIUiLrsmVSLA7cdlqcWKXr5FKnClRgx94QIA/out-0.png",
            prompt: "Cyberpunk city streets at night with neon lights"
          },
          {
            id: "img3",
            url: "https://replicate.delivery/pbxt/VKrhDKbevFnXKkI39U8mTsHdV8awskzFVefGdNKPzgRw7prQA/out-0.png",
            prompt: "Fantasy landscape with floating islands and waterfalls"
          },
          {
            id: "img4",
            url: "https://replicate.delivery/pbxt/jK6DlTtGaEKVAkrjGqFzLJD8XtnlgC0iJSSJZpMo44dAagsiA/out-0.png",
            prompt: "Magical forest with glowing mushrooms and fairies"
          }
        ]);
      } catch (error) {
        console.error("Error fetching images:", error);
        showToast("Failed to load images", "error");
      }
    };

    fetchImages();
  }, []);

  // Filter images based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      return;
    }
    
    const filtered = images.filter(image => 
      image.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setFilteredImages(filtered);
  }, [searchQuery, images]);

  const generateImage = async () => {
    if (!prompt) {
      showToast("Please enter a prompt", "error");
      return;
    }
    
    setGenerating(true);
    try {
      // Parse parameters
      const parsedParams = {};
      if (parameters) {
        const paramPairs = parameters.match(/--[a-z0-9]+ [^-]*/g);
        if (paramPairs) {
          paramPairs.forEach(pair => {
            const [key, ...valueParts] = pair.trim().split(' ');
            const value = valueParts.join(' ').trim();
            parsedParams[key.substring(2)] = value;
          });
        }
      }
      
      // Prepare request payload
      const payload = {
        prompt,
        parameters: parsedParams,
        workflow_id: selectedModel
      };
      
      // Add input image if selected
      if (selectedImage) {
        payload.input_image_url = selectedImage.url;
      }
      
      console.log("Generating image with payload:", payload);
      
      // In a real app, this would call the API to generate images
      // const response = await axios.post(`${API}/generate`, payload);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add a new mock image to the list
      const newImage = {
        id: `img${images.length + 1}`,
        url: "https://replicate.delivery/pbxt/5hG0jKlJjVeHkicoSQesVfBLagsY20GmFjOK7Wf6aqIRr8giA/out-0.png",
        prompt,
        parameters: parsedParams
      };
      
      setImages([newImage, ...images]);
      showToast("Image generated successfully!", "success");
    } catch (error) {
      console.error("Error generating image:", error);
      showToast("Failed to generate image. Please try again.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleParametersChange = (e) => {
    setParameters(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      generateImage();
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleDropZone = () => {
    setShowDropZone(!showDropZone);
    if (!showDropZone) {
      setSelectedImage(null); // Reset selected image when opening dropzone
    }
  };

  const handleImageSelected = (file, previewUrl) => {
    setSelectedImage({
      file,
      url: previewUrl,
      isLocal: true
    });
    
    showToast("Image selected for editing", "success");
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
      
      <div className="top-controls">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search your images..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>
    
      <div className="prompt-container">
        <div className="prompt-input-container">
          <button 
            className="upload-button"
            onClick={toggleDropZone}
            title="Upload an image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </button>
          
          <input
            type="text"
            className="prompt-input"
            placeholder="What will you imagine?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          
          <div className="prompt-buttons">
            <button 
              className="settings-button"
              onClick={toggleSettings}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button 
              className="generate-button"
              onClick={generateImage}
              disabled={generating || (!prompt && !selectedImage)}
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {showDropZone && (
          <div className="dropzone-container">
            <ImageDropZone onImageSelected={handleImageSelected} />
            {selectedImage && (
              <div className="selected-image-info">
                <span>Image selected</span>
                <button 
                  className="clear-button"
                  onClick={() => setSelectedImage(null)}
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-row">
              <label htmlFor="model-select">Model:</label>
              <select 
                id="model-select" 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
            </div>
            <div className="settings-row">
              <label htmlFor="parameters">Parameters:</label>
              <input
                type="text"
                id="parameters"
                placeholder="--ar 16:9 --style photorealistic"
                value={parameters}
                onChange={handleParametersChange}
              />
            </div>
          </div>
        )}
      </div>

      <div className="images-grid">
        {generating && (
          <div className="generating-indicator">
            <div className="spinner"></div>
            <p>Creating your masterpiece...</p>
          </div>
        )}
        {filteredImages.map(image => (
          <div key={image.id} className="image-card">
            <img src={image.url} alt={image.prompt} />
            <div className="image-info">
              <p className="image-prompt">{image.prompt}</p>
              <div className="image-actions">
                <button className="image-action" title="Download">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
                <button className="image-action" title="Edit">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <button 
                  className="image-action" 
                  title="Save to Gallery"
                  onClick={() => {
                    if (currentUser) {
                      // In a real app, call API to save
                      const savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
                      savedImages.push(image);
                      localStorage.setItem('savedImages', JSON.stringify(savedImages));
                      showToast("Image saved to gallery", "success");
                    } else {
                      showToast("Please log in to save images", "error");
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredImages.length === 0 && !generating && (
          <div className="no-results">
            <p>No images found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

// EditorPage component
const EditorPage = () => {
  const [currentImage, setCurrentImage] = useState(null);
  const [layers, setLayers] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [brushSize, setBrushSize] = useState(20);
  const [toast, setToast] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    // Handle image passed from Gallery page
    if (location.state?.editImage) {
      setCurrentImage(location.state.editImage);
      // Clear location state
      window.history.replaceState({}, document.title);
    } else {
      // Mock data for demonstration
      setCurrentImage({
        id: "edit1",
        url: "https://replicate.delivery/pbxt/AFcQQmGjG5ubgCIUiLrsmVSLA7cdlqcWKXr5FKnClRgx94QIA/out-0.png"
      });
    }
    
    setLayers([
      { id: "layer1", name: "Background", visible: true },
      { id: "layer2", name: "Mask", visible: true }
    ]);
  }, [location.state]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

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
          <h3>Layers</h3>
          <div className="layers-panel">
            {layers.map(layer => (
              <div key={layer.id} className="layer-item">
                <input 
                  type="checkbox" 
                  checked={layer.visible} 
                  onChange={() => {
                    setLayers(layers.map(l => 
                      l.id === layer.id ? { ...l, visible: !l.visible } : l
                    ));
                  }} 
                />
                <span>{layer.name}</span>
              </div>
            ))}
            <button 
              className="add-layer-button"
              onClick={() => {
                const newLayer = {
                  id: `layer${layers.length + 1}`,
                  name: `Layer ${layers.length + 1}`,
                  visible: true
                };
                setLayers([...layers, newLayer]);
                showToast("New layer added", "success");
              }}
            >
              Add Layer
            </button>
          </div>
        </div>
        <div className="editor-section">
          <h3>Tools</h3>
          <div className="tools-panel">
            <button className="tool-button active">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              <span>Brush</span>
            </button>
            <button className="tool-button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
              </svg>
              <span>Select</span>
            </button>
            <button className="tool-button">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              <span>Erase</span>
            </button>
          </div>
          <div className="brush-size-control">
            <label>Brush Size: {brushSize}px</label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={brushSize} 
              onChange={(e) => setBrushSize(parseInt(e.target.value))} 
            />
          </div>
        </div>
      </div>

      <div className="editor-main">
        {currentImage ? (
          <div className="editor-canvas">
            <img src={currentImage.url} alt="Editing canvas" />
          </div>
        ) : (
          <div className="empty-canvas">
            <p>No image selected for editing</p>
            <ImageDropZone onImageSelected={(file, previewUrl) => {
              setCurrentImage({
                file,
                url: previewUrl,
                isLocal: true
              });
              showToast("Image loaded for editing", "success");
            }} />
          </div>
        )}
      </div>

      <div className="editor-controls">
        <div className="prompt-container">
          <input
            type="text"
            className="prompt-input"
            placeholder="Describe what to generate in erased areas..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button 
            className="generate-button"
            disabled={!prompt || !currentImage}
            onClick={() => {
              showToast("Inpainting request submitted", "success");
            }}
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

// WorkflowsPage component
const WorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [actions, setActions] = useState([
    { id: "action1", name: "Text to Image", workflow: null },
    { id: "action2", name: "Image to Image", workflow: null },
    { id: "action3", name: "Inpainting", workflow: null },
    { id: "action4", name: "Outpainting", workflow: null },
    { id: "action5", name: "Upscale", workflow: null }
  ]);
  const [customActions, setCustomActions] = useState([]);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    file: null
  });
  const [newAction, setNewAction] = useState({
    name: "",
    workflow: null
  });
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showAddAction, setShowAddAction] = useState(false);
  const [toast, setToast] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Mock data for demonstration
    setWorkflows([
      { id: "workflow1", name: "Stable Diffusion 1.5", description: "Standard text to image workflow" },
      { id: "workflow2", name: "SDXL Inpainting", description: "Inpainting with SDXL model" },
      { id: "workflow3", name: "Realistic Upscaler", description: "High quality image upscaling" }
    ]);

    // Load custom actions from preferences
    const loadCustomActions = async () => {
      if (currentUser) {
        try {
          const loadedActions = await workflowService.getCustomActions();
          if (loadedActions && loadedActions.length > 0) {
            setCustomActions(loadedActions);
          }
        } catch (error) {
          console.error("Error loading custom actions:", error);
        }
      }
    };

    loadCustomActions();
  }, [currentUser]);

  const assignWorkflow = (actionId, workflowId) => {
    setActions(actions.map(action => 
      action.id === actionId ? { ...action, workflow: workflowId } : action
    ));
    showToast("Workflow assigned successfully", "success");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewWorkflow({
        ...newWorkflow,
        file
      });
    }
  };

  const handleAddWorkflow = () => {
    if (!newWorkflow.name || !newWorkflow.description) {
      showToast("Please fill in all fields", "error");
      return;
    }
    
    const workflow = {
      id: `workflow${workflows.length + 1}`,
      name: newWorkflow.name,
      description: newWorkflow.description
    };
    
    setWorkflows([...workflows, workflow]);
    setNewWorkflow({
      name: "",
      description: "",
      file: null
    });
    
    showToast("Workflow added successfully", "success");
  };

  const handleUpdateWorkflow = () => {
    if (!editingWorkflow) return;
    
    setWorkflows(workflows.map(workflow => 
      workflow.id === editingWorkflow.id ? editingWorkflow : workflow
    ));
    
    setEditingWorkflow(null);
    showToast("Workflow updated successfully", "success");
  };

  const handleDeleteWorkflow = (id) => {
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      setWorkflows(workflows.filter(workflow => workflow.id !== id));
      
      // Remove workflow from actions
      setActions(actions.map(action => 
        action.workflow === id ? { ...action, workflow: null } : action
      ));

      // Remove workflow from custom actions
      setCustomActions(customActions.filter(action => action.workflow !== id));
      
      showToast("Workflow deleted successfully", "success");
    }
  };

  const handleAddCustomAction = () => {
    if (!newAction.name || !newAction.workflow) {
      showToast("Please fill in all fields", "error");
      return;
    }

    const action = {
      id: `custom${Date.now()}`,
      name: newAction.name,
      workflow: newAction.workflow
    };

    const updatedActions = [...customActions, action];
    setCustomActions(updatedActions);
    
    // Save to user preferences
    if (currentUser) {
      workflowService.saveCustomActions(updatedActions)
        .then(() => {
          showToast("Custom action added successfully", "success");
        })
        .catch(error => {
          console.error("Error saving custom action:", error);
          showToast("Failed to save custom action", "error");
        });
    } else {
      showToast("Custom action added (login to save permanently)", "info");
    }

    setNewAction({
      name: "",
      workflow: null
    });
    setShowAddAction(false);
  };

  const handleDeleteCustomAction = (id) => {
    if (window.confirm("Are you sure you want to delete this custom action?")) {
      const updatedActions = customActions.filter(action => action.id !== id);
      setCustomActions(updatedActions);
      
      // Save to user preferences
      if (currentUser) {
        workflowService.saveCustomActions(updatedActions)
          .then(() => {
            showToast("Custom action deleted successfully", "success");
          })
          .catch(error => {
            console.error("Error deleting custom action:", error);
            showToast("Failed to delete custom action", "error");
          });
      } else {
        showToast("Custom action deleted (login to save permanently)", "info");
      }
    }
  };

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  return (
    <div className="workflows-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="page-header">
        <h1>Workflow Manager</h1>
        <p>Map ComfyUI workflows to frontend actions</p>
      </div>

      <div className="workflows-container">
        <div className="available-workflows">
          <h2>Available Workflows</h2>
          
          <div className="add-workflow-form">
            <h3>{editingWorkflow ? "Edit Workflow" : "Add New Workflow"}</h3>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                value={editingWorkflow ? editingWorkflow.name : newWorkflow.name}
                onChange={(e) => 
                  editingWorkflow 
                    ? setEditingWorkflow({...editingWorkflow, name: e.target.value})
                    : setNewWorkflow({...newWorkflow, name: e.target.value})
                }
                placeholder="Workflow name"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input 
                type="text" 
                value={editingWorkflow ? editingWorkflow.description : newWorkflow.description}
                onChange={(e) => 
                  editingWorkflow 
                    ? setEditingWorkflow({...editingWorkflow, description: e.target.value})
                    : setNewWorkflow({...newWorkflow, description: e.target.value})
                }
                placeholder="Workflow description"
              />
            </div>
            {!editingWorkflow && (
              <div className="form-group">
                <label>Workflow File:</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".json"
                />
              </div>
            )}
            <div className="form-actions">
              {editingWorkflow ? (
                <>
                  <button 
                    className="save-button"
                    onClick={handleUpdateWorkflow}
                  >
                    Update Workflow
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setEditingWorkflow(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  className="add-button"
                  onClick={handleAddWorkflow}
                >
                  Add Workflow
                </button>
              )}
            </div>
          </div>
          
          <div className="workflows-list">
            {workflows.map(workflow => (
              <div key={workflow.id} className="workflow-card">
                <h3>{workflow.name}</h3>
                <p>{workflow.description}</p>
                <div className="workflow-actions">
                  <button 
                    className="edit-button" 
                    onClick={() => setEditingWorkflow(workflow)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-mappings">
          <h2>Action Mappings</h2>
          <div className="section-header">
            <h3>Default Actions</h3>
            <p>System default actions that appear in the "Create" page</p>
          </div>
          <div className="mappings-list">
            {actions.map(action => (
              <div key={action.id} className="mapping-item">
                <div className="mapping-info">
                  <h3>{action.name}</h3>
                  <p>Assigned: {action.workflow ? 
                    workflows.find(w => w.id === action.workflow)?.name : 
                    "None"}
                  </p>
                </div>
                <div className="mapping-action">
                  <select 
                    value={action.workflow || ""} 
                    onChange={(e) => assignWorkflow(action.id, e.target.value)}
                  >
                    <option value="">Select Workflow</option>
                    {workflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="custom-actions-section">
            <div className="section-header">
              <h3>Custom Actions</h3>
              <p>Your custom actions will appear in the "Create" page after selecting an image</p>
              <button 
                className="add-action-button"
                onClick={() => setShowAddAction(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Action
              </button>
            </div>

            {showAddAction && (
              <div className="add-action-form">
                <div className="form-group">
                  <label>Action Name:</label>
                  <input 
                    type="text" 
                    value={newAction.name}
                    onChange={(e) => setNewAction({...newAction, name: e.target.value})}
                    placeholder="e.g., Super Resolution"
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Workflow:</label>
                  <select 
                    value={newAction.workflow || ""} 
                    onChange={(e) => setNewAction({...newAction, workflow: e.target.value})}
                  >
                    <option value="">Select Workflow</option>
                    {workflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button 
                    className="save-button"
                    onClick={handleAddCustomAction}
                    disabled={!newAction.name || !newAction.workflow}
                  >
                    Add Action
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setShowAddAction(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="custom-actions-list">
              {customActions.length > 0 ? (
                customActions.map(action => (
                  <div key={action.id} className="custom-action-item">
                    <div className="action-info">
                      <h4>{action.name}</h4>
                      <p>Workflow: {workflows.find(w => w.id === action.workflow)?.name || "Unknown"}</p>
                    </div>
                    <div className="action-controls">
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteCustomAction(action.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No custom actions added yet. Click "Add Action" to create your first custom action.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="comfyui-integration-section">
        <h2>Advanced ComfyUI Integration</h2>
        <p>View and edit ComfyUI workflows directly</p>
        
        <button className="open-comfyui-button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open ComfyUI Editor
        </button>
      </div>
    </div>
  );
};

// ParametersPage component
const ParametersPage = () => {
  const [parameters, setParameters] = useState([]);
  const [newParameter, setNewParameter] = useState({
    code: "",
    node_id: "",
    param_name: "",
    value_template: "",
    description: ""
  });
  const [editingParameter, setEditingParameter] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // Mock data for demonstration
    setParameters([
      { 
        id: "param1", 
        code: "--ar", 
        node_id: "node1", 
        param_name: "aspect_ratio", 
        value_template: "width:height", 
        description: "Set aspect ratio (e.g., --ar 16:9)" 
      },
      { 
        id: "param2", 
        code: "--style", 
        node_id: "node2", 
        param_name: "style_preset", 
        value_template: "{value}", 
        description: "Set style preset (e.g., --style photorealistic)" 
      }
    ]);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingParameter) {
      setEditingParameter({ ...editingParameter, [name]: value });
    } else {
      setNewParameter({ ...newParameter, [name]: value });
    }
  };

  const addParameter = () => {
    if (!newParameter.code || !newParameter.node_id || !newParameter.param_name) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    
    const param = {
      id: `param${parameters.length + 1}`,
      ...newParameter
    };
    
    setParameters([...parameters, param]);
    setNewParameter({
      code: "",
      node_id: "",
      param_name: "",
      value_template: "",
      description: ""
    });
    
    showToast("Parameter added successfully", "success");
  };

  const updateParameter = () => {
    if (!editingParameter) return;
    
    setParameters(parameters.map(param => 
      param.id === editingParameter.id ? editingParameter : param
    ));
    
    setEditingParameter(null);
    showToast("Parameter updated successfully", "success");
  };

  const deleteParameter = (id) => {
    if (window.confirm("Are you sure you want to delete this parameter?")) {
      setParameters(parameters.filter(param => param.id !== id));
      showToast("Parameter deleted successfully", "success");
    }
  };

  const showToast = (message, type = "info") => {
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
        <h1>Parameter Manager</h1>
        <p>Create and manage parameter mappings for ComfyUI nodes</p>
      </div>

      <div className="parameters-container">
        <div className="add-parameter-form">
          <h2>{editingParameter ? "Edit Parameter" : "Add New Parameter"}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="code">Parameter Code</label>
              <input 
                type="text" 
                id="code" 
                name="code" 
                placeholder="e.g., --ar" 
                value={editingParameter ? editingParameter.code : newParameter.code}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="node_id">Node ID</label>
              <input 
                type="text" 
                id="node_id" 
                name="node_id" 
                placeholder="ComfyUI node ID" 
                value={editingParameter ? editingParameter.node_id : newParameter.node_id}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="param_name">Parameter Name</label>
              <input 
                type="text" 
                id="param_name" 
                name="param_name" 
                placeholder="Node parameter name" 
                value={editingParameter ? editingParameter.param_name : newParameter.param_name}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="value_template">Value Template</label>
              <input 
                type="text" 
                id="value_template" 
                name="value_template" 
                placeholder="e.g., width:height" 
                value={editingParameter ? editingParameter.value_template : newParameter.value_template}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <input 
                type="text" 
                id="description" 
                name="description" 
                placeholder="Parameter description" 
                value={editingParameter ? editingParameter.description : newParameter.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          {editingParameter ? (
            <div className="form-actions">
              <button 
                className="save-button"
                onClick={updateParameter}
              >
                Update Parameter
              </button>
              <button 
                className="cancel-button"
                onClick={() => setEditingParameter(null)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              className="add-button"
              onClick={addParameter}
              disabled={!newParameter.code || !newParameter.node_id || !newParameter.param_name}
            >
              Add Parameter
            </button>
          )}
        </div>

        <div className="parameters-list">
          <h2>Existing Parameters</h2>
          <div className="table-container">
            <table className="parameters-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Node ID</th>
                  <th>Parameter</th>
                  <th>Template</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map(param => (
                  <tr key={param.id}>
                    <td><code>{param.code}</code></td>
                    <td>{param.node_id}</td>
                    <td>{param.param_name}</td>
                    <td><code>{param.value_template}</code></td>
                    <td>{param.description}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="edit-button"
                          onClick={() => setEditingParameter(param)}
                        >
                          Edit
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => deleteParameter(param.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// SettingsPage component
const SettingsPage = () => {
  const [settings, setSettings] = useState({
    comfyuiUrl: "http://localhost:8188",
    autoRefresh: true,
    defaultModel: "model1",
    theme: "dark",
    civitaiApiKey: localStorage.getItem('civitai_api_key') || ""
  });
  const [toast, setToast] = useState(null);
  const { currentUser } = useAuth();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ 
      ...settings, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const saveSettings = () => {
    // Save to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, typeof value === 'boolean' ? value.toString() : value);
    });
    
    // Special handling for Civitai API key
    localStorage.setItem('civitai_api_key', settings.civitaiApiKey);
    
    showToast("Settings saved successfully!", "success");
  };

  const showToast = (message, type = "info") => {
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
        <p>Configure application preferences</p>
      </div>

      <div className="settings-container">
        {!currentUser && (
          <div className="auth-section">
            <LoginForm onSuccess={(message, type) => showToast(message, type)} />
          </div>
        )}
        
        <div className="settings-form">
          <div className="settings-group">
            <h2>ComfyUI Connection</h2>
            <div className="form-group">
              <label htmlFor="comfyuiUrl">ComfyUI URL</label>
              <input 
                type="text" 
                id="comfyuiUrl" 
                name="comfyuiUrl" 
                value={settings.comfyuiUrl}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group checkbox">
              <input 
                type="checkbox" 
                id="autoRefresh" 
                name="autoRefresh" 
                checked={settings.autoRefresh}
                onChange={handleInputChange}
              />
              <label htmlFor="autoRefresh">Auto-refresh connection</label>
            </div>
          </div>

          <div className="settings-group">
            <h2>Default Options</h2>
            <div className="form-group">
              <label htmlFor="defaultModel">Default Model</label>
              <select 
                id="defaultModel" 
                name="defaultModel" 
                value={settings.defaultModel}
                onChange={handleInputChange}
              >
                <option value="model1">Stable Diffusion 1.5</option>
                <option value="model2">Stable Diffusion XL</option>
                <option value="model3">Midjourney Style</option>
              </select>
            </div>
          </div>

          <div className="settings-group">
            <h2>Appearance</h2>
            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select 
                id="theme" 
                name="theme" 
                value={settings.theme}
                onChange={handleInputChange}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>

          <div className="settings-group">
            <h2>Civitai API</h2>
            <div className="form-group">
              <label htmlFor="civitaiApiKey">API Key (Optional)</label>
              <input 
                type="password" 
                id="civitaiApiKey" 
                name="civitaiApiKey" 
                value={settings.civitaiApiKey}
                onChange={handleInputChange}
                placeholder="Enter your Civitai API key"
              />
              <p className="help-text">
                Get your API key from: <a href="https://civitai.com/user/account" target="_blank" rel="noopener noreferrer">Civitai Account Settings</a>
              </p>
            </div>
          </div>

          <button 
            className="save-button"
            onClick={saveSettings}
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// AuthRoute - Redirect to settings/login if not authenticated
const AuthRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  if (!currentUser) {
    return <Navigate to="/settings" state={{ from: location }} replace />;
  }
  
  return children;
};

// Main App component
function App() {
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await axios.get(`${API}/`);
        console.log("Backend status:", response.data);
      } catch (e) {
        console.error("Error connecting to backend:", e);
      }
    };

    checkBackendStatus();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app">
          <Router>
            <Sidebar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/parameters" element={<ParametersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </Router>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
