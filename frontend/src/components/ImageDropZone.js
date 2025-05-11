import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ImageDropZone = ({ onImageSelected }) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = () => {
        setPreview(reader.result);
        onImageSelected(file, reader.result);
      };
      
      reader.readAsDataURL(file);
    }
  }, [onImageSelected]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });
  
  return (
    <div 
      {...getRootProps()} 
      className={`image-drop-zone ${isDragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
    >
      <input {...getInputProps()} />
      
      {preview ? (
        <div className="preview-container">
          <img src={preview} alt="Preview" className="image-preview" />
          <div className="preview-overlay">
            <p>Drop a new image or click to change</p>
          </div>
        </div>
      ) : (
        <div className="drop-message">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="upload-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p>{isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}</p>
        </div>
      )}
    </div>
  );
};

export default ImageDropZone;
