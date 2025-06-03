import React, { useState, useEffect, useRef } from 'react';
import usePromptHistory from '../hooks/usePromptHistory';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import parameterService from '../services/parameterService';
import workflowService from '../services/workflowService';
import progressService from '../services/progressService';
import modelService from '../services/modelService';
import VoiceInput from '../components/VoiceInput';

const CreatePage = () => {
  const [prompt, setPrompt] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [parameterMappings, setParameterMappings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [aspectRatio, setAspectRatio] = useState(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('comfyui_preferences') || '{}');
      return prefs.defaultAspectRatio || '1:1';
    } catch (err) {
      return '1:1';
    }
  });
  const [showParameters, setShowParameters] = useState(false);
  const {
    history: promptHistory,
    index: historyIndex,
    addPrompt,
    previous: prevPrompt,
    next: nextPrompt,
    resetNavigation,
  } = usePromptHistory();

  const { currentUser } = useAuth();

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const promptText = job.prompt ? job.prompt.toLowerCase() : '';
    const metaText = job.metadata
      ? Object.entries(job.metadata)
          .map(([k, v]) => `--${k} ${v}`)
          .join(' ')
          .toLowerCase()
      : '';
    return promptText.includes(query) || metaText.includes(query);
  });

  // Load a prompt from Explore page if provided
  useEffect(() => {
    const imported = localStorage.getItem('imported_prompt');
    if (imported) {
      setPrompt(imported);
      localStorage.removeItem('imported_prompt');
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'ArrowUp' && document.activeElement === inputRef.current) {
        e.preventDefault();
        const prev = prevPrompt();
        if (prev !== null) setPrompt(prev);
      } else if (e.key === 'ArrowDown' && document.activeElement === inputRef.current) {
        e.preventDefault();
        const nxt = nextPrompt();
        setPrompt(nxt);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prevPrompt, nextPrompt]);


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

    const fetchModels = async () => {
      try {
        const data = await modelService.getModels();
        setModels(data || []);
        if (data && data.length > 0) {
          setSelectedModel(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching models:', err);
      }
    };

    fetchModels();

    const mockJobs = [
      {
        id: 'job1',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 },
        images: [
          { id: '1', url: 'https://source.unsplash.com/random/500x500/?space,galaxy', type: 'image' },
          { id: '2', url: 'https://source.unsplash.com/random/500x500/?nebula', type: 'image' },
          { id: '3', url: 'https://source.unsplash.com/random/500x500/?galaxy,face', type: 'image' },
          { id: '4', url: 'https://source.unsplash.com/random/500x500/?cosmos', type: 'image' }
        ]
      },
      {
        id: 'job2',
        prompt: 'Tender holographic colors, Venus Botticelli with galaxy inside out, enigmatic, energetic, long exposure, optical illusion, glow aesthetics, surrounded by stars and peonies, hyper detailed, 8k, vhs sfx, 80s film grain',
        metadata: { chaos: 33, v: 7, stylize: 1000 },
        images: [
          { id: '5', url: 'https://source.unsplash.com/random/500x500/?nebula,space', type: 'image' },
          { id: '6', url: 'https://source.unsplash.com/random/500x500/?cosmos,stars', type: 'image' },
          { id: '7', url: 'https://source.unsplash.com/random/500x500/?face,galaxy', type: 'image' },
          { id: '8', url: 'https://source.unsplash.com/random/500x500/?stars,cosmos', type: 'image' }
        ]
      }
    ];

    setJobs(mockJobs);
  }, []);

  const handlePromptChange = (e) => {
    const value = e.target.value;
    setPrompt(value);

    const match = value.match(/--(\w*)$/);
    if (match) {
      const query = match[1];
      const filtered = parameterMappings
        .filter((m) => m.code.startsWith(`--${query}`))
        .map((m) => ({ code: m.code, description: m.description || '' }));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (code) => {
    const newValue = prompt.replace(/--\w*$/, code + ' ');
    setPrompt(newValue);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a prompt', 'error');
      return;
    }

    addPrompt(prompt);
    resetNavigation();

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
            // Add mock output when done (demo purposes)
            const types = ['image', 'video', 'model'];
            const outType = types[Math.floor(Math.random() * types.length)];
            const count = Math.floor(Math.random() * 4) + 1;
            const images = Array.from({ length: count }).map((_, idx) => ({
              id: `${Date.now()}-${idx}`,
              url: `https://source.unsplash.com/random/500x500/?galaxy,nebula&${Date.now()}-${idx}`,
              type: outType
            }));
            const newJob = { id: jobId, prompt, metadata: parameters, images };
            setJobs(prev => [newJob, ...prev]);
            setLoading(false);
            source.close();
            showToast('Generation completed', 'success');
            playSoundNotification();
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
      console.error('Error generating output:', error);
      setLoading(false);
      showToast('Failed to generate', 'error');
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

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = { id: `drop-${Date.now()}`, url: ev.target?.result, type: 'image', file };
          const newJob = { id: `drop-job-${Date.now()}`, prompt, metadata: {}, images: [img] };
          setJobs((prev) => [newJob, ...prev]);
          showToast('Image dropped, starting img2img...', 'info');
          if (prompt.trim()) handleGenerate();
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleAspectRatioChange = (value) => {
    setAspectRatio(value);
    try {
      const prefs = JSON.parse(localStorage.getItem('comfyui_preferences') || '{}');
      prefs.defaultAspectRatio = value;
      localStorage.setItem('comfyui_preferences', JSON.stringify(prefs));
    } catch (err) {
      console.error('Failed to save aspect ratio', err);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleVoiceResult = (text) => {
    const prefs = JSON.parse(localStorage.getItem('comfyui_preferences') || '{}');
    if (prefs.voicePlacement === 'prepend') {
      setPrompt(prev => `${text} ${prev}`.trim());
    } else {
      setPrompt(prev => `${prev} ${text}`.trim());
    }
  };

  const playSoundNotification = () => {
    try {
      const prefs = JSON.parse(localStorage.getItem('comfyui_preferences') || '{}');
      if (!prefs.playSound) return;
      let play; 
      if (prefs.useCustomSound && prefs.customSoundUrl) {
        play = new Audio(prefs.customSoundUrl);
      } else {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 440;
        gain.gain.value = prefs.soundVolume || 0.5;
        osc.start(); osc.stop(ctx.currentTime + 0.2);
        return; // nothing else to do
      }
      play.volume = prefs.soundVolume || 1;
      if (play.setSinkId && prefs.audioOutputId) {
        play.setSinkId(prefs.audioOutputId).catch(() => {});
      }
      play.play();
    } catch (err) {
      console.warn('Sound failed', err);
    }
  };

  return (
    <div className="create-page" onDragOver={handleDragOver} onDrop={handleDrop}>
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
            ref={inputRef}
            type="text"
            className="prompt-input"
            placeholder="What will you imagine?"
            value={prompt}
            onChange={handlePromptChange}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        {showSuggestions && (
          <ul className="prompt-suggestions">
            {suggestions.map((s) => (
              <li key={s.code} onMouseDown={() => handleSuggestionClick(s.code)}>
                <span className="suggestion-code">{s.code}</span>
                {s.description && (
                  <span className="suggestion-desc">{s.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <VoiceInput onResult={handleVoiceResult} />

        <div className="prompt-tools">
            <button className="tool-button" title="Random Prompt">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
            
          <button
            className="tool-button"
            title="Parameters"
            onClick={() => setShowParameters(!showParameters)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
          </button>
          {showParameters && (
            <div className="parameters-menu">
              <div className="form-group">
                <label>Model</label>
                <select
                  className="model-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Aspect Ratio</label>
                <select
                  className="aspect-select"
                  value={aspectRatio}
                  onChange={(e) => handleAspectRatioChange(e.target.value)}
                >
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                  <option value="4:3">Standard (4:3)</option>
                  <option value="3:2">Photo (3:2)</option>
                </select>
              </div>
            </div>
          )}

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

            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={handleSearch}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="search-icon"
                width="20"
                height="20"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <h2 className="yesterday-header">Yesterday</h2>

      <div className="job-list">
        {filteredJobs.map(job => (
          <div key={job.id} className="job-row">
            <div className="job-images">
              {job.images.filter(img => img.url).map(img => (
                <div key={img.id} className="image-card" onClick={() => handleImageClick(img)}>
                  {img.type === 'video' ? (
                    <video src={img.url} className="grid-image" controls preload="metadata" />
                  ) : img.type === 'model' ? (
                    <model-viewer src={img.url} class="grid-image" auto-rotate camera-controls></model-viewer>
                  ) : (
                    <img src={img.url} alt={job.prompt} className="grid-image" loading="lazy" />
                  )}
                </div>
              ))}
            </div>
            <div className="job-info">
              <div className="job-prompt">{job.prompt}</div>
              <div className="image-metadata">
                {job.metadata && Object.entries(job.metadata).map(([key, value]) => (
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
