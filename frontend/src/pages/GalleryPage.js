import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GalleryPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState([]);
  
  useEffect(() => {
    if (!currentUser) {
      // If not logged in, show demo images
      const demoImages = [
        {
          id: 'demo1',
          url: 'https://replicate.delivery/pbxt/4kw2JSufHBnKI1kUQCB7fHEspWh2fvzo3loD9CplCFYz1BiJA/out.png',
          prompt: 'A cosmic flower blooming in space, surrounded by nebulae',
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo2',
          url: 'https://replicate.delivery/pbxt/AFcQQmGjG5ubgCIUiLrsmVSLA7cdlqcWKXr5FKnClRgx94QIA/out-0.png',
          prompt: 'Cyberpunk city streets at night with neon lights',
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo3',
          url: 'https://replicate.delivery/pbxt/VKrhDKbevFnXKkI39U8mTsHdV8awskzFVefGdNKPzgRw7prQA/out-0.png',
          prompt: 'Fantasy landscape with floating islands and waterfalls',
          createdAt: new Date().toISOString()
        }
      ];
      setImages(demoImages);
      setFilteredImages(demoImages);
      setLoading(false);
      return;
    }
    
    // Load saved images from localStorage
    const loadImages = () => {
      try {
        const savedImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
        setImages(savedImages);
        setFilteredImages(savedImages);
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadImages();
  }, [currentUser]);
  
  // Filter images based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      return;
    }
    
    const filtered = images.filter(image => 
      (image.prompt && image.prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (image.meta?.prompt && image.meta.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setFilteredImages(filtered);
  }, [searchQuery, images]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleUseImage = (image) => {
    navigate('/', { state: { useImage: image } });
  };
  
  const handleEditImage = (image) => {
    navigate('/editor', { state: { editImage: image } });
  };
  
  const handleDeleteImage = (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        const updatedImages = images.filter(img => img.id !== imageId);
        setImages(updatedImages);
        localStorage.setItem('savedImages', JSON.stringify(updatedImages));
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    }
  };
  
  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h1>My Gallery</h1>
        <p>{currentUser ? `${currentUser.name}'s personal gallery` : 'Login to save images to your gallery'}</p>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by prompt..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading your gallery...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="empty-gallery">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="empty-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {searchQuery ? (
            <p>No images found matching "{searchQuery}"</p>
          ) : (
            <>
              <p>Your gallery is empty</p>
              <button 
                className="primary-button"
                onClick={() => navigate('/explore')}
              >
                Browse the Explore page
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredImages.map(image => (
            <div key={image.id} className="gallery-image-card">
              <img 
                src={image.url} 
                alt={image.prompt || image.meta?.prompt || 'Gallery image'} 
              />
              <div className="image-info">
                <p className="image-prompt">
                  {image.prompt || image.meta?.prompt || 'No prompt available'}
                </p>
                <div className="image-actions">
                  <button 
                    className="image-action"
                    onClick={() => handleUseImage(image)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                    Use
                  </button>
                  <button 
                    className="image-action"
                    onClick={() => handleEditImage(image)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit
                  </button>
                  <button 
                    className="image-action"
                    onClick={() => handleDeleteImage(image.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
