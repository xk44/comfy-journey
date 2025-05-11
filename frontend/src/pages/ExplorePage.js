import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImages, getModels } from '../services/civitaiService';

const ExplorePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('images');
  const [images, setImages] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    nsfw: false,
    sort: 'Most Reactions',
    period: 'AllTime'
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Fetches images from Civitai
  const fetchImages = async (reset = false) => {
    if (loading) return;
    
    const newPage = reset ? 1 : page;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getImages({
        limit: 20,
        page: newPage,
        nsfw: filters.nsfw,
        sort: filters.sort,
        period: filters.period,
        query: searchQuery
      });
      
      const newImages = response.items || [];
      
      if (reset) {
        setImages(newImages);
      } else {
        setImages(prevImages => [...prevImages, ...newImages]);
      }
      
      // Check if there are more images to load
      setHasMore(newImages.length === 20);
      
      if (!reset) {
        setPage(newPage + 1);
      } else {
        setPage(2); // Reset to page 2 for next load
      }
    } catch (err) {
      setError('Failed to fetch images. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetches models from Civitai
  const fetchModels = async (reset = false) => {
    if (loading) return;
    
    const newPage = reset ? 1 : page;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getModels({
        limit: 20,
        page: newPage,
        query: searchQuery,
        sort: filters.sort,
        period: filters.period
      });
      
      const newModels = response.items || [];
      
      if (reset) {
        setModels(newModels);
      } else {
        setModels(prevModels => [...prevModels, ...newModels]);
      }
      
      // Check if there are more models to load
      setHasMore(newModels.length === 20);
      
      if (!reset) {
        setPage(newPage + 1);
      } else {
        setPage(2); // Reset to page 2 for next load
      }
    } catch (err) {
      setError('Failed to fetch models. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch when component mounts
  useEffect(() => {
    if (activeTab === 'images') {
      fetchImages(true);
    } else {
      fetchModels(true);
    }
  }, [activeTab]);
  
  // Handle search
  const handleSearch = () => {
    if (activeTab === 'images') {
      fetchImages(true);
    } else {
      fetchModels(true);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setHasMore(true);
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Reset and fetch with new filters
    if (activeTab === 'images') {
      fetchImages(true);
    } else {
      fetchModels(true);
    }
  };
  
  // Handle click on an image
  const handleImageClick = (image) => {
    // Store the selected image in local storage
    localStorage.setItem('selectedImage', JSON.stringify(image));
    
    // Navigate to create page to use this image
    navigate('/');
  };
  
  // Save image to local gallery
  const saveImage = async (image, e) => {
    e.stopPropagation(); // Prevent triggering the image click
    
    try {
      // This would normally call an API to save the image
      const existingImages = JSON.parse(localStorage.getItem('savedImages') || '[]');
      
      // Check if already saved
      if (existingImages.some(img => img.id === image.id)) {
        alert('This image is already saved to your gallery');
        return;
      }
      
      // Add to saved images
      existingImages.push(image);
      localStorage.setItem('savedImages', JSON.stringify(existingImages));
      
      alert('Image saved to your gallery');
    } catch (err) {
      console.error('Error saving image:', err);
      alert('Failed to save image. Please try again.');
    }
  };
  
  // Copy prompt to clipboard
  const copyPrompt = (image, e) => {
    e.stopPropagation(); // Prevent triggering the image click
    
    if (image.meta?.prompt) {
      navigator.clipboard.writeText(image.meta.prompt);
      alert('Prompt copied to clipboard');
    } else {
      alert('No prompt available for this image');
    }
  };
  
  return (
    <div className="explore-page">
      <div className="explore-header">
        <h1>Explore</h1>
        <p>Discover images and models from the Civitai community</p>
        
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
        </div>
        
        <div className="explore-tabs">
          <button 
            className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => handleTabChange('images')}
          >
            Images
          </button>
          <button 
            className={`tab-button ${activeTab === 'models' ? 'active' : ''}`}
            onClick={() => handleTabChange('models')}
          >
            Models
          </button>
        </div>
        
        <div className="explore-filters">
          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="Most Reactions">Most Reactions</option>
              <option value="Most Comments">Most Comments</option>
              <option value="Newest">Newest</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Period:</label>
            <select 
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
            >
              <option value="AllTime">All Time</option>
              <option value="Year">Year</option>
              <option value="Month">Month</option>
              <option value="Week">Week</option>
              <option value="Day">Day</option>
            </select>
          </div>
          
          {activeTab === 'images' && (
            <div className="filter-group checkbox">
              <input 
                type="checkbox" 
                id="nsfw-filter"
                checked={filters.nsfw}
                onChange={(e) => handleFilterChange('nsfw', e.target.checked)}
              />
              <label htmlFor="nsfw-filter">Show NSFW</label>
            </div>
          )}
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {activeTab === 'images' ? (
        <div className="images-grid">
          {images.map(image => (
            <div key={image.id} className="explore-image-card" onClick={() => handleImageClick(image)}>
              <img src={image.url} alt={image.meta?.prompt || 'Civitai image'} />
              <div className="image-overlay">
                <div className="image-actions">
                  <button onClick={(e) => saveImage(image, e)} title="Save to Gallery">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                    </svg>
                  </button>
                  <button onClick={(e) => copyPrompt(image, e)} title="Copy Prompt">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                    </svg>
                  </button>
                  <button onClick={(e) => {
                    e.stopPropagation();
                    navigate('/', { state: { useImage: image } });
                  }} title="Use in Create">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </button>
                </div>
                <div className="image-info">
                  <p className="image-model">{image.meta?.Model || 'Unknown Model'}</p>
                  {image.meta?.prompt && (
                    <p className="image-prompt">{image.meta.prompt.substring(0, 100)}...</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="models-grid">
          {models.map(model => (
            <div key={model.id} className="model-card">
              {model.modelVersions[0]?.images[0]?.url && (
                <img 
                  src={model.modelVersions[0].images[0].url} 
                  alt={model.name} 
                  className="model-image"
                />
              )}
              <div className="model-info">
                <h3>{model.name}</h3>
                <p className="model-type">{model.type}</p>
                <p className="model-creator">By {model.creator.username}</p>
                <div className="model-stats">
                  <span>{model.stats.downloadCount} Downloads</span>
                  <span>{model.stats.rating.toFixed(1)} Rating</span>
                </div>
                <p className="model-description">{model.description.substring(0, 100)}...</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading...</p>
            </div>
          )}
        </div>
      )}
      
      {hasMore && !loading && (
        <div className="load-more">
          <button 
            onClick={() => activeTab === 'images' ? fetchImages() : fetchModels()}
            className="load-more-button"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
