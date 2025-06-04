import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import civitaiService from '../services/civitaiService';
import downloadService from '../services/downloadService';

const PERIOD_OPTIONS = [
  { label: 'Day', value: 'Day' },
  { label: 'Week', value: 'Week' },
  { label: 'Month', value: 'Month' },
  { label: 'Year', value: 'Year' },
  { label: 'All Time', value: 'AllTime' }
];

const SORT_OPTIONS = [
  'Highest Rated',
  'Most Downloaded',
  'Most Liked',
  'Most Discussed',
  'Most Collected',
  'Most Images',
  'Newest',
  'Oldest'
];

const MODEL_TYPES = [
  'Checkpoint',
  'Embedding',
  'Hypernetwork',
  'Aesthetic Gradient',
  'LoRA',
  'LyCORIS',
  'DoRA',
  'Controlnet',
  'Upscaler',
  'Motion',
  'VAE',
  'Poses',
  'Wildcards',
  'Detection',
  'Other'
];

const BASE_MODELS = [
  'SD 1.4',
  'SD 1.5',
  'SD 1.5 LCM',
  'SD 1.5 Hyper',
  'SD 2.0',
  'SD 2.1',
  'SDXL 1.0',
  'SD 3',
  'SD 3.5',
  'SD 3.5 Medium',
  'SD 3.5 Large',
  'SD 3.5 Large Turbo',
  'Pony',
  'Flux .1 S',
  'Flux .1 D',
  'Aura Flow',
  'SDXL Lightning',
  'SDXL Hyper',
  'SVD',
  'PixArt α',
  'PixArt Σ',
  'Hunyuan 1',
  'Hunyuan Video',
  'Lumina',
  'Kolors',
  'Illustrious',
  'Mochi',
  'LTXV',
  'CogVideoX',
  'NoobAI',
  'Wan Video 1.3B t2v',
  'Wan Video 14B t2v',
  'Wan Video 14B i2v 480p',
  'Wan Video 14B i2v 720p',
  'HiDream',
  'Other'
];

const ExplorePage = () => {
  const [activeTab, setActiveTab] = useState('Images');
  const [showNsfw, setShowNsfw] = useState(() => {
    const saved = localStorage.getItem('cj_civitai_show_nsfw');
    return saved === 'true';
  });
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [models, setModels] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [period, setPeriod] = useState(() => localStorage.getItem('cj_period') || 'Day');
  const [sort, setSort] = useState(() => localStorage.getItem('cj_sort') || 'Highest Rated');
  const [baseModel, setBaseModel] = useState(() => localStorage.getItem('cj_base_model') || '');
  const [modelType, setModelType] = useState(() => localStorage.getItem('cj_model_type') || '');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const loadMoreRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const close = () => {
      setShowSortMenu(false);
      setShowFilterMenu(false);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    localStorage.setItem('cj_civitai_show_nsfw', showNsfw.toString());
  }, [showNsfw]);

  useEffect(() => {
    localStorage.setItem('cj_period', period);
  }, [period]);

  useEffect(() => {
    localStorage.setItem('cj_sort', sort);
  }, [sort]);

  useEffect(() => {
    localStorage.setItem('cj_base_model', baseModel);
  }, [baseModel]);

  useEffect(() => {
    localStorage.setItem('cj_model_type', modelType);
  }, [modelType]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        const imgRes = await civitaiService.getImages({ limit: 20, page, nsfw: showNsfw, sort, period, baseModel });
        const vidRes = await civitaiService.getVideos({ limit: 20, page, nsfw: showNsfw, sort, period, baseModel });
        const modRes = await civitaiService.getModels({ limit: 20, page, sort, period, types: modelType, baseModel });
        const wfRes = await civitaiService.getModels({ limit: 20, page, types: 'Workflow', sort, period, baseModel });

        const newImages = imgRes.items || imgRes.data || imgRes;
        const newVideos = vidRes.items || vidRes.data || vidRes;
        const newModels = modRes.items || modRes.data || modRes;
        const newWorkflows = wfRes.items || wfRes.data || wfRes;

        setImages(prev => page === 1 ? newImages : [...prev, ...newImages]);
        setVideos(prev => page === 1 ? newVideos : [...prev, ...newVideos]);
        setModels(prev => page === 1 ? newModels : [...prev, ...newModels]);
        setWorkflows(prev => page === 1 ? newWorkflows : [...prev, ...newWorkflows]);
        setLoading(false);
        setLoadingMore(false);
      } catch (err) {
        console.error('Error fetching explore data', err);
        setLoading(false);
        setLoadingMore(false);
        showToast('Failed to load explore data. Please try again.', 'error');
      }
    };
    fetchData();
  }, [page, showNsfw, period, sort, baseModel, modelType]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) {
        setPage(p => p + 1);
      }
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadingMore]);

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const showToast = (message, type = 'info') => setToast({ message, type });
  const clearToast = () => setToast(null);

  const handleUsePrompt = (image) => {
    localStorage.setItem('imported_prompt', image.prompt);
    navigate('/');
  };

  const handleDownloadModel = async (model) => {
    const paths = JSON.parse(localStorage.getItem('cj_paths') || '{}');
    let dir = paths.checkpointsDir;
    if (model.type && model.type.toLowerCase().includes('lora')) dir = paths.lorasDir;
    if (model.type && model.type.toLowerCase().includes('workflow')) dir = paths.workflowsDir;
    if (!dir) { showToast('Download path not set in Settings', 'error'); return; }
    try {
      await downloadService.downloadFile(model.downloadUrl || model.url, dir);
      showToast('Download started', 'success');
    } catch (err) {
      console.error('Download failed', err);
      showToast('Download failed', 'error');
    }
  };

  const filtered = (arr, fields) => arr.filter(item =>
    fields.some(f => (item[f] || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredImages = filtered(images, ['prompt', 'username']);
  const filteredVideos = filtered(videos, ['prompt', 'username']);
  const filteredModels = filtered(models, ['name', 'description', 'creator']);
  const filteredWorkflows = filtered(workflows, ['name', 'description', 'creator']);

  const sortMenu = (
    <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
      <div className="filter-group">
        <span>Time Period:</span>
        {PERIOD_OPTIONS.map(o => (
          <button key={o.value} className={period === o.value ? 'active' : ''} onClick={() => { setPeriod(o.value); setPage(1); setShowSortMenu(false); }}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="filter-group">
        <span>Sort:</span>
        {SORT_OPTIONS.map(o => (
          <button key={o} className={sort === o ? 'active' : ''} onClick={() => { setSort(o); setPage(1); setShowSortMenu(false); }}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  const filterMenu = (
    <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
      {activeTab === 'Models' && (
        <div className="filter-group">
          <span>Model Type:</span>
          {MODEL_TYPES.map(t => (
            <button key={t} className={modelType === t ? 'active' : ''} onClick={() => { setModelType(modelType === t ? '' : t); setPage(1); }}>
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="filter-group">
        <span>Base Model:</span>
        {BASE_MODELS.map(b => (
          <button key={b} className={baseModel === b ? 'active' : ''} onClick={() => { setBaseModel(baseModel === b ? '' : b); setPage(1); }}>
            {b}
          </button>
        ))}
      </div>
    </div>
  );


  return (
    <div className="explore-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      <div className="explore-header">
        <div className="explore-tabs">
          {['Images','Videos','Models','Workflows'].map(tab => (
            <button key={tab} className={`explore-tab ${activeTab===tab?'active':''}`} onClick={() => { setActiveTab(tab); setPage(1); }}>
              {tab}
            </button>
          ))}
          <div className="menu-buttons">
            <button className="menu-button" onClick={e => { e.stopPropagation(); setShowSortMenu(s => !s); setShowFilterMenu(false); }}>Sort</button>
            {showSortMenu && sortMenu}
            <button className="menu-button" onClick={e => { e.stopPropagation(); setShowFilterMenu(s => !s); setShowSortMenu(false); }}>Filter</button>
            {showFilterMenu && filterMenu}
          </div>
        </div>
        <div className="search-container">
          <input type="text" className="search-input" placeholder={`Search ${activeTab.toLowerCase()}...`} value={searchQuery} onChange={handleSearch} />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>
      {activeTab === 'Images' && (
        <>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredImages.length === 0 ? (
            <div className="empty-state"><h2>No Results Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="image-grid explore-grid">
              {filteredImages.map(img => (
                <div key={img.id} className="image-card" onClick={() => window.open(`https://civitai.com/images/${img.id}`, '_blank')}>
                  <img src={img.url} alt={img.prompt} className="grid-image" loading="lazy" />
                  <button className="use-prompt-button" onClick={e => { e.stopPropagation(); handleUsePrompt(img); }}>Use Prompt</button>
                  <div className="image-info">
                    <div className="image-prompt">{img.prompt}</div>
                  </div>
                </div>
              ))}
              <div ref={loadMoreRef} style={{ height: 1 }}></div>
            </div>
          )}
        </>
      )}
      {activeTab === 'Videos' && (
        <>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredVideos.length === 0 ? (
            <div className="empty-state"><h2>No Results Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="image-grid explore-grid">
              {filteredVideos.map(v => (
                <div key={v.id} className="image-card" onClick={() => window.open(`https://civitai.com/images/${v.id}`, '_blank')}>
                  <video src={v.url} className="grid-image" controls preload="metadata" />
                  <div className="image-info">
                    <div className="image-prompt">{v.prompt}</div>
                  </div>
                </div>
              ))}
              <div ref={loadMoreRef} style={{ height: 1 }}></div>
            </div>
          )}
        </>
      )}
      {activeTab === 'Models' && (
        <>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredModels.length === 0 ? (
            <div className="empty-state"><h2>No Models Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="models-grid">
              {filteredModels.map(model => (
                <div key={model.id} className="model-card" onClick={() => window.open(`https://civitai.com/models/${model.id}`, '_blank')}>
                  <div className="model-header">
                    <h3 className="model-name">{model.name}</h3>
                  </div>
                  <p className="model-description">{model.description}</p>
                  <div className="model-meta">
                    <span className="model-creator">By @{model.creator}</span>
                    <span className="model-downloads">{model.downloads}</span>
                  </div>
                  <button className="download-model-button" onClick={e => { e.stopPropagation(); handleDownloadModel(model); }}>Download</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {activeTab === 'Workflows' && (
        <>
          {loading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="empty-state"><h2>No Workflows Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="models-grid">
              {filteredWorkflows.map(wf => (
                <div key={wf.id} className="model-card" onClick={() => window.open(`https://civitai.com/models/${wf.id}`, '_blank')}>
                  <div className="model-header"><h3 className="model-name">{wf.name}</h3></div>
                  <p className="model-description">{wf.description}</p>
                  <button className="download-model-button" onClick={e => { e.stopPropagation(); handleDownloadModel(wf); }}>Download</button>
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
