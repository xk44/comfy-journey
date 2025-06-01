import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import parameterService from '../services/parameterService';
import workflowService from '../services/workflowService';
import progressService from '../services/progressService';

const CreatePage = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [parameterMappings, setParameterMappings] = useState([]);

  const { currentUser } = useAuth();

  // Load a prompt from Explore page if provided
  useEffect(() => {
    const imported = localStorage.getItem('imported_prompt');
    if (imported) {
      setPrompt(imported);
      localStorage.removeItem('imported_prompt');
    }
  }, []);

  // Categories for the tabs
  const categories = ['Random', 'Hot', 'Top Month', 'Likes'];
  const [activeCategory, setActiveCategory] = useState('Hot');

  // Fetch parameter mappings on component mount
  useEffect(() => {
    const fetchParameterMappings = async () => {
      try {
        const mappings = await parameterService.getParameterMappings();
        setParameterMappings(mappings);
      } catch (error) {
        console.error('Error fetching parameter mappings:', error);
      }
    };

    fetchParameterMappings();

    // Load mock images for demo
    const mockImages = [
      {
        id: '1',
        url: 'https://source.unsplash.com/random/500x500/?space,galaxy',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 }
      },
      {
        id: '2',
        url: 'https://source.unsplash.com/random/500x500/?nebula',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 200 }
      },
      {
        id: '3',
        url: 'https://source.unsplash.com/random/500x500/?galaxy,face',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 }
      },
      {
        id: '4',
        url: 'https://source.unsplash.com/random/500x500/?cosmos',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 }
      },
      {
        id: '5',
        url: 'https://source.unsplash.com/random/500x500/?nebula,space',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 }
      },
      {
        id: '6',
        url: 'https://source.unsplash.com/random/500x500/?cosmos,stars',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 }
      },
      {
        id: '7',
        url: 'https://source.unsplash.com/random/500x500/?face,galaxy',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 }
      },
      {
        id: '8',
        url: 'https://source.unsplash.com/random/500x500/?stars,cosmos',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 }
      }
    ];
    
    setImages(mockImages);
  }, []);

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt', 'error');
      return;
    }

    try {
      setLoading(true);
      // Extract parameter codes from the prompt
      const { cleanPrompt, parameters } = parameterService.parseParameterCodes(prompt, parameterMappings);

      const res = await workflowService.executeWorkflow(null, cleanPrompt);
      const jobId = res?.payload?.job_id;
      if (!jobId) {
        setLoading(false);
        showToast('Failed to start generation', 'error');
        return;
      }

      showToast('Job queued', 'info');

      const source = progressService.subscribe(
        jobId,
        (data) => {
          const job = data.payload?.job;
          if (!job) return;
          showToast(`Job ${job.status} (${job.progress}%)`, 'info');
          if (job.status === 'done') {
            // Add mock images when done (demo purposes)
            const newImages = [
              {
                id: Date.now().toString(),
                url: 'https://source.unsplash.com/random/500x500/?galaxy,nebula&' + Date.now(),
                prompt: prompt,
                metadata: parameters
              }
            ];
            setImages(prev => [...newImages, ...prev]);
            setLoading(false);
            source.close();
            showToast('Images generated successfully', 'success');
          }
        },
        (err) => {
          console.error('Progress stream error', err);
          source.close();
          setLoading(false);
          showToast('Progress connection lost', 'error');
        }
      );
    } catch (error) {
      console.error('Error generating images:', error);
      setLoading(false);
      showToast('Failed to generate images', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  const handleImageClick = (image) => {
    // Navigate to the editor page with the selected image
    // In a real implementation, you would use React Router's navigation here
    console.log('Navigate to editor with image:', image);
  };

  return (
    <div className="create-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="prompt-container">
        <div className="prompt-input-wrapper">
          <input
            type="text"
            className="prompt-input"
            placeholder="What will you imagine?"
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
          
          <div className="prompt-tools">
            <button className="tool-button" title="Random Prompt">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            
            <button className="tool-button" title="Parameters">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>
            
            <button 
              className="generate-button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
      </div>
      
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
      
      <h2 className="yesterday-header">Yesterday</h2>
      
      <div className="image-grid">
        {images.map(image => (
          <div key={image.id} className="image-card" onClick={() => handleImageClick(image)}>
            <img 
              src={image.url} 
              alt={image.prompt} 
              className="grid-image"
              loading="lazy"
            />
            <div className="image-overlay">
              <div className="image-prompt">{image.prompt.substring(0, 100)}...</div>
              <div className="image-metadata">
                {image.metadata && Object.entries(image.metadata).map(([key, value]) => (
                  <span key={key} className="metadata-tag">
                    {key === 'chaos' && '🔄'}
                    {key === 'v' && '📏'}
                    {key === 'stylize' && '🎨'}
                    {`${key}: ${value}`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatePage;