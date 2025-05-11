import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const GalleryPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all');
  
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        
        // For demo purposes, we'll use mock data
        const mockImages = [
          {
            id: '1',
            url: 'https://source.unsplash.com/random/500x500/?landscape',
            prompt: 'Beautiful mountain landscape with lake and trees',
            createdAt: '2023-05-10T08:30:00Z',
            favorite: true
          },
          {
            id: '2',
            url: 'https://source.unsplash.com/random/500x500/?portrait',
            prompt: 'Portrait of a young woman with long hair, soft lighting',
            createdAt: '2023-05-09T14:45:00Z',
            favorite: false
          },
          {
            id: '3',
            url: 'https://source.unsplash.com/random/500x500/?city',
            prompt: 'Cyberpunk cityscape at night with neon lights and rain',
            createdAt: '2023-05-08T22:15:00Z',
            favorite: true
          },
          {
            id: '4',
            url: 'https://source.unsplash.com/random/500x500/?food',
            prompt: 'Gourmet meal beautifully plated on a black ceramic dish',
            createdAt: '2023-05-07T19:20:00Z',
            favorite: false
          },
          {
            id: '5',
            url: 'https://source.unsplash.com/random/500x500/?abstract',
            prompt: 'Abstract art with vibrant colors and geometric shapes',
            createdAt: '2023-05-06T11:10:00Z',
            favorite: true
          },
          {
            id: '6',
            url: 'https://source.unsplash.com/random/500x500/?animal',
            prompt: 'Majestic tiger in the jungle, closeup portrait',
            createdAt: '2023-05-05T16:35:00Z',
            favorite: false
          }
        ];
        
        setImages(mockImages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching images:', error);
        setLoading(false);
        showToast('Failed to load images. Please try again.', 'error');
      }
    };
    
    fetchImages();
  }, []);
  
  const handleImageClick = (image) => {
    // Navigate to editor with the selected image
    navigate('/editor', { state: { image } });
  };
  
  const handleToggleFavorite = (id) => {
    setImages(prevImages => prevImages.map(img => 
      img.id === id ? { ...img, favorite: !img.favorite } : img
    ));
  };
  
  const handleDeleteImage = (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      setImages(prevImages => prevImages.filter(img => img.id !== id));
      showToast('Image deleted successfully', 'success');
    }
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const clearToast = () => {
    setToast(null);
  };
  
  const filteredImages = filter === 'all' 
    ? images 
    : filter === 'favorites' 
      ? images.filter(img => img.favorite)
      : images;
  
  return (
    <div className="gallery-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="gallery-header">
        <h1>My Gallery</h1>
        
        <div className="gallery-filters">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Images
          </button>
          <button 
            className={`filter-button ${filter === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilter('favorites')}
          >
            Favorites
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="empty-state">
          <h2>No images found</h2>
          <p>{filter === 'favorites' ? 'You have no favorite images yet.' : 'Your gallery is empty.'}</p>
          <button className="create-button" onClick={() => navigate('/')}>Create Images</button>
        </div>
      ) : (
        <div className="gallery-grid">
          {filteredImages.map(image => (
            <div key={image.id} className="gallery-card">
              <div className="gallery-image-container" onClick={() => handleImageClick(image)}>
                <img 
                  src={image.url} 
                  alt={image.prompt} 
                  className="gallery-image"
                  loading="lazy"
                />
              </div>
              
              <div className="gallery-image-info">
                <div className="gallery-prompt">{image.prompt.substring(0, 50)}...</div>
                
                <div className="gallery-actions">
                  <button 
                    className={`favorite-button ${image.favorite ? 'favorited' : ''}`}
                    onClick={() => handleToggleFavorite(image.id)}
                    title={image.favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {image.favorite ? '★' : '☆'}
                  </button>
                  
                  <button 
                    className="edit-button"
                    onClick={() => handleImageClick(image)}
                    title="Edit image"
                  >
                    Edit
                  </button>
                  
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteImage(image.id)}
                    title="Delete image"
                  >
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