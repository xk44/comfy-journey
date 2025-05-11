import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const ExplorePage = () => {
  const [activeTab, setActiveTab] = useState('Images');
  const [images, setImages] = useState([]);
  const [models, setModels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const { currentUser } = useAuth();
  
  // Categories for the image tabs
  const categories = ['Random', 'Hot', 'Top Month', 'Likes'];
  const [activeCategory, setActiveCategory] = useState('Top Month');

  // Fetch images and models on component mount
  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setLoading(true);
        
        // Mock data for demo
        // In a real implementation, you would fetch from your API
        const mockImages = [
          {
            id: '1',
            url: 'https://source.unsplash.com/random/400x400/?duck,toy',
            prompt: 'Realistic toy rubber duck',
            username: 'ai_artist',
            likes: 245
          },
          {
            id: '2',
            url: 'https://source.unsplash.com/random/400x400/?girl,cafe',
            prompt: 'Girl in a Tokyo cafe, film photography',
            username: 'photo_ai',
            likes: 532
          },
          {
            id: '3',
            url: 'https://source.unsplash.com/random/400x400/?gucci,fashion',
            prompt: 'Gucci fashion catalog cover in pastoral setting',
            username: 'fashion_gen',
            likes: 892
          },
          {
            id: '4',
            url: 'https://source.unsplash.com/random/400x400/?silhouette,red',
            prompt: 'Mysterious silhouette against red background, noir style',
            username: 'noir_ai',
            likes: 367
          },
          {
            id: '5',
            url: 'https://source.unsplash.com/random/400x400/?lips,glossy',
            prompt: 'Close-up of glossy red lips with water droplets',
            username: 'beauty_ai',
            likes: 453
          },
          {
            id: '6',
            url: 'https://source.unsplash.com/random/400x400/?pocket,watch,desert',
            prompt: 'Antique pocket watch hanging in desert landscape',
            username: 'time_traveler',
            likes: 289
          },
          {
            id: '7',
            url: 'https://source.unsplash.com/random/400x400/?asian,girl,coffee',
            prompt: 'Asian girl with coffee cup in cozy room',
            username: 'cozy_ai',
            likes: 412
          },
          {
            id: '8',
            url: 'https://source.unsplash.com/random/400x400/?saturn,purple',
            prompt: 'Saturn with vibrant purple rings, space art',
            username: 'space_artist',
            likes: 678
          },
          {
            id: '9',
            url: 'https://source.unsplash.com/random/400x400/?grass,macro',
            prompt: 'Macro photography of grass blades with dew',
            username: 'nature_ai',
            likes: 321
          }
        ];
        
        const mockModels = [
          {
            id: '1',
            name: 'Realistic Portrait v2',
            description: 'Specialized in photorealistic human portraits',
            creator: 'portrait_master',
            downloads: 45678,
            rating: 4.9
          },
          {
            id: '2',
            name: 'Anime Diffusion XL',
            description: 'High quality anime-style generations',
            creator: 'anime_lover',
            downloads: 32456,
            rating: 4.8
          },
          {
            id: '3',
            name: 'Landscape Perfection',
            description: 'Beautiful landscape generations with realistic lighting',
            creator: 'nature_ai',
            downloads: 28932,
            rating: 4.7
          }
        ];
        
        setImages(mockImages);
        setModels(mockModels);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching explore data:', error);
        setLoading(false);
        showToast('Failed to load explore data. Please try again.', 'error');
      }
    };
    
    fetchExploreData();
  }, []);
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // In a real implementation, you would filter results or fetch from API based on search query
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const clearToast = () => {
    setToast(null);
  };
  
  const handleImageClick = (image) => {
    // Navigate to the image detail or editor page
    console.log('Image clicked:', image);
  };
  
  const handleModelClick = (model) => {
    // Navigate to the model detail page
    console.log('Model clicked:', model);
  };
  
  const filteredImages = images.filter(
    img => img.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
           img.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredModels = models.filter(
    model => model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
             model.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="explore-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="explore-header">
        <div className="explore-tabs">
          <button 
            className={`explore-tab ${activeTab === 'Images' ? 'active' : ''}`}
            onClick={() => setActiveTab('Images')}
          >
            Images
          </button>
          <button 
            className={`explore-tab ${activeTab === 'Models' ? 'active' : ''}`}
            onClick={() => setActiveTab('Models')}
          >
            Models
          </button>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChange={handleSearch}
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>
      
      {activeTab === 'Images' && (
        <>
          <div className="category-tabs">
            {categories.map(category => (
              <button
                key={category}
                className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="empty-state">
              <h2>No Results Found</h2>
              <p>Try adjusting your search query</p>
            </div>
          ) : (
            <div className="image-grid explore-grid">
              {filteredImages.map(image => (
                <div key={image.id} className="image-card" onClick={() => handleImageClick(image)}>
                  <img 
                    src={image.url} 
                    alt={image.prompt} 
                    className="grid-image"
                    loading="lazy"
                  />
                  <div className="image-info">
                    <div className="image-prompt">{image.prompt}</div>
                    <div className="image-meta">
                      <span className="image-username">@{image.username}</span>
                      <span className="image-likes">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        {image.likes}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {activeTab === 'Models' && (
        <>
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="empty-state">
              <h2>No Models Found</h2>
              <p>Try adjusting your search query</p>
            </div>
          ) : (
            <div className="models-grid">
              {filteredModels.map(model => (
                <div key={model.id} className="model-card" onClick={() => handleModelClick(model)}>
                  <div className="model-header">
                    <h3 className="model-name">{model.name}</h3>
                    <div className="model-rating">
                      <span className="rating-stars">{'★'.repeat(Math.floor(model.rating)) + (model.rating % 1 >= 0.5 ? '½' : '')}</span>
                      <span className="rating-value">{model.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <p className="model-description">{model.description}</p>
                  
                  <div className="model-meta">
                    <span className="model-creator">By @{model.creator}</span>
                    <span className="model-downloads">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      {model.downloads.toLocaleString()}
                    </span>
                  </div>
                  
                  <button className="download-model-button">
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExplorePage;