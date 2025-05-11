import React, { useState, useRef, useEffect } from 'react';

const ComfyUIEditor = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [comfyuiUrl, setComfyuiUrl] = useState("http://localhost:8188");
  const [status, setStatus] = useState("disconnected"); // "connected", "disconnected", "loading"
  const iframeRef = useRef(null);
  
  useEffect(() => {
    // Load ComfyUI URL from localStorage
    const savedUrl = localStorage.getItem('comfyuiUrl');
    if (savedUrl) {
      setComfyuiUrl(savedUrl);
    }
  }, []);

  const checkConnection = async () => {
    setStatus("loading");
    try {
      // Try to fetch the status endpoint
      const response = await fetch(`${comfyuiUrl}/system_stats`);
      if (response.ok) {
        setStatus("connected");
        return true;
      } else {
        setStatus("disconnected");
        return false;
      }
    } catch (error) {
      console.error("Error checking ComfyUI connection:", error);
      setStatus("disconnected");
      return false;
    }
  };
  
  const handleConnect = async () => {
    localStorage.setItem('comfyuiUrl', comfyuiUrl);
    const connected = await checkConnection();
    
    if (connected) {
      if (iframeRef.current) {
        iframeRef.current.src = comfyuiUrl;
      }
    } else {
      // Show a message if the connection fails
      alert(`Could not connect to ComfyUI at ${comfyuiUrl}. Please make sure ComfyUI is running and accessible.`);
    }
  };
  
  return (
    <div className={`comfyui-editor-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="comfyui-editor-header">
        <h2>ComfyUI Workflow Editor</h2>
        <div className="comfyui-editor-controls">
          <div className="url-control">
            <input 
              type="text" 
              value={comfyuiUrl} 
              onChange={(e) => setComfyuiUrl(e.target.value)}
              placeholder="ComfyUI URL"
            />
            <button 
              onClick={handleConnect}
              className={status === "loading" ? "loading" : ""}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Connecting..." : "Connect"}
            </button>
          </div>
          <button 
            className="fullscreen-button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M15 9H19.5M15 9V4.5M15 15V19.5M15 15H19.5M9 15H4.5M9 15V19.5" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m9 0h4.5m0 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m0 0v-4.5m0 4.5L9 15m11.25-4.5v4.5m0-4.5h-4.5m-6-6h4.5m0 0v4.5m0-4.5l6-6" />
              )}
            </svg>
          </button>
          <button 
            className="close-button"
            onClick={() => {
              // Close the ComfyUI editor
              document.querySelector('.comfyui-editor-wrapper')?.classList.remove('open');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="comfyui-editor-frame">
        {status === "connected" ? (
          <iframe
            ref={iframeRef}
            src={comfyuiUrl}
            title="ComfyUI Editor"
            className="comfyui-iframe"
          ></iframe>
        ) : (
          <div className="comfyui-placeholder">
            <h3>ComfyUI Connection</h3>
            <p>
              {status === "loading" 
                ? "Connecting to ComfyUI..." 
                : "Connect to your ComfyUI instance to edit workflows."}
            </p>
            <p className="comfyui-help">
              Make sure ComfyUI is running and accessible at the URL above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComfyUIEditor;