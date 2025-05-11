import React, { useState } from 'react';

const ImageCard = ({ image, onShare, onCopy }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };
  
  return (
    <div className="image-card">
      <div className="image-container">
        <img 
          src={image.url} 
          alt={image.prompt || "Generated image"} 
          loading="lazy"
        />
        
        <div className="image-overlay">
          <div className="image-actions">
            <button 
              onClick={() => onShare(image)}
              title="Share to Civitai"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
            
            <button 
              onClick={() => onCopy(image.url)}
              title="Copy Image URL"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
              </svg>
            </button>
            
            <button 
              onClick={() => setShowDetails(!showDetails)}
              title={showDetails ? "Hide Details" : "Show Details"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="image-details">
          {image.prompt && (
            <div className="image-prompt">
              <h4>Prompt:</h4>
              <p>{image.prompt}</p>
            </div>
          )}
          
          {image.created_at && (
            <div className="image-date">
              <h4>Created:</h4>
              <p>{formatDate(image.created_at)}</p>
            </div>
          )}
          
          {image.workflow_id && (
            <div className="image-workflow">
              <h4>Workflow:</h4>
              <p>{image.workflow_id}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCard;