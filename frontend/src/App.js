import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import "./App.css";

// API Configuration
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Components
const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? "active-nav-item" : "";
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h1>ComfyUI</h1>
      </div>
      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span>Create</span>
        </Link>
        <Link to="/editor" className={`nav-item ${isActive('/editor')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          <span>Edit</span>
        </Link>
        <Link to="/workflows" className={`nav-item ${isActive('/workflows')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Workflows</span>
        </Link>
        <Link to="/parameters" className={`nav-item ${isActive('/parameters')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span>Parameters</span>
        </Link>
        <Link to="/settings" className={`nav-item ${isActive('/settings')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </Link>
      </nav>
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
      }
    };

    fetchImages();
  }, []);

  const generateImage = async () => {
    setGenerating(true);
    try {
      // In a real app, this would call the API to generate images
      console.log("Generating image with prompt:", prompt);
      console.log("Parameters:", parameters);
      console.log("Selected model:", selectedModel);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add a new mock image to the list
      const newImage = {
        id: `img${images.length + 1}`,
        url: "https://replicate.delivery/pbxt/5hG0jKlJjVeHkicoSQesVfBLagsY20GmFjOK7Wf6aqIRr8giA/out-0.png",
        prompt: prompt
      };
      
      setImages([newImage, ...images]);
    } catch (error) {
      console.error("Error generating image:", error);
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

  return (
    <div className="home-page">
      <div className="prompt-container">
        <div className="prompt-input-container">
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
              disabled={generating || !prompt}
            >
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

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
        {images.map(image => (
          <div key={image.id} className="image-card">
            <img src={image.url} alt={image.prompt} />
            <div className="image-info">
              <p className="image-prompt">{image.prompt}</p>
              <div className="image-actions">
                <button className="image-action">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                </button>
                <button className="image-action">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
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
  
  useEffect(() => {
    // Mock data for demonstration
    setCurrentImage({
      id: "edit1",
      url: "https://replicate.delivery/pbxt/AFcQQmGjG5ubgCIUiLrsmVSLA7cdlqcWKXr5FKnClRgx94QIA/out-0.png"
    });
    
    setLayers([
      { id: "layer1", name: "Background", visible: true },
      { id: "layer2", name: "Mask", visible: true }
    ]);
  }, []);

  return (
    <div className="editor-page">
      <div className="editor-sidebar">
        <div className="editor-section">
          <h3>Layers</h3>
          <div className="layers-panel">
            {layers.map(layer => (
              <div key={layer.id} className="layer-item">
                <input 
                  type="checkbox" 
                  checked={layer.visible} 
                  onChange={() => {}} 
                />
                <span>{layer.name}</span>
              </div>
            ))}
            <button className="add-layer-button">Add Layer</button>
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
            <button className="upload-button">Upload an Image</button>
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
            disabled={!prompt}
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

  useEffect(() => {
    // Mock data for demonstration
    setWorkflows([
      { id: "workflow1", name: "Stable Diffusion 1.5", description: "Standard text to image workflow" },
      { id: "workflow2", name: "SDXL Inpainting", description: "Inpainting with SDXL model" },
      { id: "workflow3", name: "Realistic Upscaler", description: "High quality image upscaling" }
    ]);
  }, []);

  const assignWorkflow = (actionId, workflowId) => {
    setActions(actions.map(action => 
      action.id === actionId ? { ...action, workflow: workflowId } : action
    ));
  };

  return (
    <div className="workflows-page">
      <div className="page-header">
        <h1>Workflow Manager</h1>
        <p>Map ComfyUI workflows to frontend actions</p>
      </div>

      <div className="workflows-container">
        <div className="available-workflows">
          <h2>Available Workflows</h2>
          <div className="workflows-list">
            {workflows.map(workflow => (
              <div key={workflow.id} className="workflow-card">
                <h3>{workflow.name}</h3>
                <p>{workflow.description}</p>
                <div className="workflow-actions">
                  <button className="view-button">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-mappings">
          <h2>Action Mappings</h2>
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
        </div>
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
    setNewParameter({ ...newParameter, [name]: value });
  };

  const addParameter = () => {
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
  };

  const deleteParameter = (id) => {
    setParameters(parameters.filter(param => param.id !== id));
  };

  return (
    <div className="parameters-page">
      <div className="page-header">
        <h1>Parameter Manager</h1>
        <p>Create and manage parameter mappings for ComfyUI nodes</p>
      </div>

      <div className="parameters-container">
        <div className="add-parameter-form">
          <h2>Add New Parameter</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="code">Parameter Code</label>
              <input 
                type="text" 
                id="code" 
                name="code" 
                placeholder="e.g., --ar" 
                value={newParameter.code}
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
                value={newParameter.node_id}
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
                value={newParameter.param_name}
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
                value={newParameter.value_template}
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
                value={newParameter.description}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <button 
            className="add-button"
            onClick={addParameter}
            disabled={!newParameter.code || !newParameter.node_id || !newParameter.param_name}
          >
            Add Parameter
          </button>
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
                      <button 
                        className="delete-button"
                        onClick={() => deleteParameter(param.id)}
                      >
                        Delete
                      </button>
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
    theme: "dark"
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({ 
      ...settings, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const saveSettings = () => {
    console.log("Saving settings:", settings);
    // In a real app, save to API/localStorage
    alert("Settings saved!");
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure application preferences</p>
      </div>

      <div className="settings-container">
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
    <div className="app">
      <Router>
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/parameters" element={<ParametersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
