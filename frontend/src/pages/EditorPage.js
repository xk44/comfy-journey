import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Toast from '../components/Toast';
import ImageDropZone from '../components/ImageDropZone';
import VoiceInput from '../components/VoiceInput';

const EditorPage = () => {
  const [image, setImage] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTool, setActiveTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [maskVisible, setMaskVisible] = useState(true);
  const [imageVisible, setImageVisible] = useState(true);
  const [undoStack, setUndoStack] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState('50% 50%');

  const canvasRef = useRef(null);
  const maskRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawing = useRef(false);
  const fileInputRef = useRef(null);

  const location = useLocation();

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
        file: file,
      };
      setImage(imageData);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageDrop = (imageData) => {
    if (!imageData) return;
    setImage(imageData);
  };

  const handlePageDragOver = (e) => {
    e.preventDefault();
  };

  const handlePageDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = {
          id: `drop-${Date.now()}`,
          url: event.target?.result,
          file: file,
        };
        setImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateScale = () => {
    if (!canvasRef.current || !maskRef.current || !containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const imgWidth = canvasRef.current.width;
    const imgHeight = canvasRef.current.height;
    const scaleFactor = Math.min(containerWidth / imgWidth, containerHeight / imgHeight, 1);
    const displayWidth = imgWidth * scaleFactor;
    const displayHeight = imgHeight * scaleFactor;
    canvasRef.current.style.width = `${displayWidth}px`;
    canvasRef.current.style.height = `${displayHeight}px`;
    maskRef.current.style.width = `${displayWidth}px`;
    maskRef.current.style.height = `${displayHeight}px`;
  };

  useEffect(() => {
    if (location.state?.image) {
      setImage(location.state.image);
      setPrompt(location.state.image.prompt || '');
    }
  }, [location.state]);

  useEffect(() => {
    if (!image) return;

    const initializeCanvas = () => {
      const imageObj = new Image();
      imageObj.crossOrigin = "Anonymous";
      imageObj.src = image.url;
      
      imageObj.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size to match image
        canvas.width = imageObj.width;
        canvas.height = imageObj.height;
        
        // Draw image
        ctx.drawImage(imageObj, 0, 0);
        
        // Initialize mask canvas
        const maskCanvas = maskRef.current;
        maskCanvas.width = imageObj.width;
        maskCanvas.height = imageObj.height;
        
        const maskCtx = maskCanvas.getContext('2d');
        maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      };
    };

    initializeCanvas();
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [image]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undoStack]);

  const handleWheel = (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const originX = ((e.clientX - rect.left) / rect.width) * 100;
      const originY = ((e.clientY - rect.top) / rect.height) * 100;
      setOrigin(`${originX}% ${originY}%`);
      setZoom((prev) => {
        const newZoom = e.deltaY < 0 ? prev * 1.1 : prev / 1.1;
        return Math.min(Math.max(newZoom, 1), 5);
      });
    } else if (maskRef.current) {
      e.preventDefault();
      setBrushSize((prev) => {
        const change = e.deltaY < 0 ? 1 : -1;
        return Math.min(Math.max(prev + change, 1), 100);
      });
    }
  };

  const startDrawing = (e) => {
    if (!maskRef.current) return;

    const maskCtx = maskRef.current.getContext('2d');
    const snapshot = maskCtx.getImageData(0, 0, maskRef.current.width, maskRef.current.height);
    setUndoStack((prev) => [...prev, snapshot]);

    isDrawing.current = true;

    // maskCtx defined above
    
    // Set drawing styles based on active tool
    maskCtx.lineWidth = brushSize;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';
    
    if (activeTool === 'brush') {
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.strokeStyle = brushColor;
    } else if (activeTool === 'eraser') {
      maskCtx.globalCompositeOperation = 'destination-out';
    }
    
    const rect = maskRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (maskRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (maskRef.current.height / rect.height);
    
    maskCtx.beginPath();
    maskCtx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing.current || !maskRef.current) return;
    
    const maskCtx = maskRef.current.getContext('2d');
    const rect = maskRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (maskRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (maskRef.current.height / rect.height);
    
    maskCtx.lineTo(x, y);
    maskCtx.stroke();
  };

  const stopDrawing = () => {
    if (!maskRef.current) return;
    
    isDrawing.current = false;
  };

  const clearMask = () => {
    if (!maskRef.current) return;

    const maskCtx = maskRef.current.getContext('2d');
    maskCtx.clearRect(0, 0, maskRef.current.width, maskRef.current.height);
  };

  const handleUndo = () => {
    if (!maskRef.current || undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    const maskCtx = maskRef.current.getContext('2d');
    maskCtx.putImageData(last, 0, 0);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    // Create a combination of the image and mask
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = canvasRef.current.width;
    combinedCanvas.height = canvasRef.current.height;
    
    const ctx = combinedCanvas.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(canvasRef.current, 0, 0);
    
    // Draw the mask on top with some transparency
    ctx.globalAlpha = 0.5;
    ctx.drawImage(maskRef.current, 0, 0);
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Get the data URL of the combined image
    const dataUrl = combinedCanvas.toDataURL('image/png');
    
    // Here you would typically save this to your backend
    console.log('Saving edited image:', dataUrl);
    
    showToast('Image saved successfully!', 'success');
  };

  const handleGenerateInpaint = () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt for inpainting', 'error');
      return;
    }
    
    // Convert mask to data URL
    const maskDataUrl = maskRef.current.toDataURL('image/png');
    
    // Here you would send this to your backend for processing
    console.log('Generating inpaint with prompt:', prompt);
    console.log('Mask data:', maskDataUrl);
    
    showToast('Inpainting request sent!', 'success');
  };

  const handleVoiceResult = (text) => {
    const prefs = JSON.parse(localStorage.getItem('comfyui_preferences') || '{}');
    if (prefs.voicePlacement === 'prepend') {
      setPrompt(prev => `${text} ${prev}`.trim());
    } else {
      setPrompt(prev => `${prev} ${text}`.trim());
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  if (!image) {
    return (
      <div
        className="editor-page"
        onDragOver={handlePageDragOver}
        onDrop={handlePageDrop}
      >
        <div className="empty-state" onClick={handleUploadClick}>
          <h2>No Image Selected</h2>
          <p>Upload or drop an image to start editing.</p>
          <div className="dropzone-container">
            <ImageDropZone
              onImageDrop={handleImageDrop}
              onUploadClick={(e) => {
                e.stopPropagation();
                handleUploadClick();
              }}
            />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="editor-page"
      onDragOver={handlePageDragOver}
      onDrop={handlePageDrop}
    >
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
            <button 
              className={`tool-button ${activeTool === 'brush' ? 'active' : ''}`}
              onClick={() => setActiveTool('brush')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Paint
            </button>
            <button 
              className={`tool-button ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => setActiveTool('eraser')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
              Erase
            </button>
            <button
              className="tool-button"
              onClick={clearMask}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Clear
            </button>
            <button
              className="tool-button"
              onClick={handleUndo}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4m0 0l4-4m-4 4h11a4 4 0 110 8h-1" />
              </svg>
              Undo
            </button>
            <button
              className="tool-button"
              onClick={handleUploadClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75l7.5-7.5 7.5 7.5M12 2.25v15.75" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
              </svg>
              Upload
            </button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>
        </div>
        
        <div className="editor-section">
          <h3>Brush Settings</h3>
          <div className="brush-settings">
            <div className="setting-group">
              <label>Size: {brushSize}px</label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))} 
              />
            </div>
            
            <div className="setting-group">
              <label>Color:</label>
              <input 
                type="color" 
                value={brushColor} 
                onChange={(e) => setBrushColor(e.target.value)} 
              />
            </div>
          </div>
        </div>
        
        <div className="editor-section">
          <h3>Layers</h3>
          <div className="layers-panel">
            <div className="layer-item">
              <input 
                type="checkbox" 
                id="layer-mask" 
                checked={maskVisible} 
                onChange={() => setMaskVisible(!maskVisible)} 
              />
              <label htmlFor="layer-mask">Mask</label>
            </div>
            <div className="layer-item">
              <input 
                type="checkbox" 
                id="layer-image" 
                checked={imageVisible} 
                onChange={() => setImageVisible(!imageVisible)} 
              />
              <label htmlFor="layer-image">Original Image</label>
            </div>
          </div>
        </div>
        
      </div>
      
      <div className="editor-main">
        <div
          className="editor-canvas-container"
          ref={containerRef}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            className={`editor-canvas ${imageVisible ? '' : 'hidden'}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: origin }}
          />
          <canvas
            ref={maskRef}
            className={`editor-mask ${maskVisible ? '' : 'hidden'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            style={{ transform: `scale(${zoom})`, transformOrigin: origin }}
          />
        </div>
        
        <div className="editor-controls">
          <input
            type="text"
            className="prompt-input"
            placeholder="Describe what to generate in masked areas..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <VoiceInput onResult={handleVoiceResult} />
          
          <div className="control-buttons">
            <button 
              className="save-button"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              className="generate-button"
              onClick={handleGenerateInpaint}
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