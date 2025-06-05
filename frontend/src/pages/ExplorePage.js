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

const SORT_OPTIONS_MODELS = [
  'Highest Rated',
  'Most Downloaded',
  'Most Liked',
  'Most Discussed',
  'Most Collected',
  'Most Images',
  'Newest',
  'Oldest'
];

const SORT_OPTIONS_MEDIA = [
  'Most Reactions',
  'Most Comments',
  'Most Collected',
  'Newest',
  'Oldest',
  'Random'
];

const MODEL_TYPES = [
  'Checkpoint',
  'TextualInversion',
  'Hypernetwork',
  'AestheticGradient',
  'LORA',
  'LoCon',
  'DoRA',
  'Controlnet',
  'Upscaler',
  'MotionModule',
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
  const [imgPage, setImgPage] = useState(1);
  const [vidPage, setVidPage] = useState(1);
  const [modelPage, setModelPage] = useState(1);
  const [wfPage, setWfPage] = useState(1);
  const [imgLoading, setImgLoading] = useState(true);
  const [vidLoading, setVidLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [wfLoading, setWfLoading] = useState(false);
  const [imgLoadingMore, setImgLoadingMore] = useState(false);
  const [vidLoadingMore, setVidLoadingMore] = useState(false);
  const [modelLoadingMore, setModelLoadingMore] = useState(false);
  const [wfLoadingMore, setWfLoadingMore] = useState(false);
  const [imgOffsets, setImgOffsets] = useState({});
  const [videoOffsets, setVideoOffsets] = useState({});
  const [wfOffsets, setWfOffsets] = useState({});
  const [modelOffsets, setModelOffsets] = useState({});
  const [selected, setSelected] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [modelDetail, setModelDetail] = useState(null);
  const [modelVersion, setModelVersion] = useState(0);
  const [modelImage, setModelImage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [period, setPeriod] = useState(() => localStorage.getItem('cj_period') || 'Day');
  const [sort, setSort] = useState(() => localStorage.getItem('cj_sort') || 'Most Reactions');
  const [baseModel, setBaseModel] = useState(() => localStorage.getItem('cj_base_model') || '');
  const [modelType, setModelType] = useState(() => localStorage.getItem('cj_model_type') || '');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const loadMoreRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const getSortOptions = () => {
    if (activeTab === 'Models' || activeTab === 'Workflows') return SORT_OPTIONS_MODELS;
    return SORT_OPTIONS_MEDIA;
  };

  useEffect(() => {
    const opts = getSortOptions();
    if (!opts.includes(sort)) {
      setSort(opts[0]);
    }
  }, [activeTab]);

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

  const fetchImages = async () => {
    try {
      if (imgPage === 1) {
        setImgLoading(true);
      } else {
        setImgLoadingMore(true);
      }
      const imgRes = await civitaiService.getImages({ limit: 20, page: imgPage, nsfw: showNsfw, sort, period, baseModel });
      const newImages = imgRes.items || imgRes.data || imgRes;
      setImages(prev => imgPage === 1 ? newImages : [...prev, ...newImages]);
      setImgLoading(false);
      setImgLoadingMore(false);
    } catch (err) {
      console.error('Error fetching images', err);
      setImgLoading(false);
      setImgLoadingMore(false);
      showToast('Failed to load images. Please try again.', 'error');
    }
  };

  const fetchVideos = async () => {
    try {
      if (vidPage === 1) {
        setVidLoading(true);
      } else {
        setVidLoadingMore(true);
      }
      const vidRes = await civitaiService.getVideos({ limit: 20, page: vidPage, nsfw: showNsfw, sort, period, baseModel });
      const newVideos = vidRes.items || vidRes.data || vidRes;
      setVideos(prev => vidPage === 1 ? newVideos : [...prev, ...newVideos]);
      setVidLoading(false);
      setVidLoadingMore(false);
    } catch (err) {
      console.error('Error fetching videos', err);
      setVidLoading(false);
      setVidLoadingMore(false);
      showToast('Failed to load videos. Please try again.', 'error');
    }
  };

  const fetchModels = async () => {
    try {
      if (modelPage === 1) {
        setModelLoading(true);
      } else {
        setModelLoadingMore(true);
      }
      const modRes = await civitaiService.getModels({ limit: 20, page: modelPage, sort, period, types: modelType, baseModel });
      const newModels = modRes.items || modRes.data || modRes;
      setModels(prev => modelPage === 1 ? newModels : [...prev, ...newModels]);
      setModelLoading(false);
      setModelLoadingMore(false);
    } catch (err) {
      console.error('Error fetching models', err);
      setModelLoading(false);
      setModelLoadingMore(false);
      showToast('Failed to load models. Please try again.', 'error');
    }
  };

  const fetchWorkflows = async () => {
    try {
      if (wfPage === 1) {
        setWfLoading(true);
      } else {
        setWfLoadingMore(true);
      }
      const wfRes = await civitaiService.getModels({ limit: 20, page: wfPage, types: 'Workflows', sort, period, baseModel });
      const newWorkflows = wfRes.items || wfRes.data || wfRes;
      setWorkflows(prev => wfPage === 1 ? newWorkflows : [...prev, ...newWorkflows]);
      setWfLoading(false);
      setWfLoadingMore(false);
    } catch (err) {
      console.error('Error fetching workflows', err);
      setWfLoading(false);
      setWfLoadingMore(false);
      showToast('Failed to load workflows. Please try again.', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'Images' || images.length === 0) {
      fetchImages();
    }
  }, [imgPage, activeTab, showNsfw, period, sort, baseModel]);

  useEffect(() => {
    if (activeTab === 'Videos' && (vidPage > 1 || videos.length === 0)) {
      fetchVideos();
    }
  }, [vidPage, activeTab, showNsfw, period, sort, baseModel]);

  useEffect(() => {
    if (activeTab === 'Models' && (modelPage > 1 || models.length === 0)) {
      fetchModels();
    }
  }, [modelPage, activeTab, sort, period, modelType, baseModel]);

  useEffect(() => {
    if (activeTab === 'Workflows' && (wfPage > 1 || workflows.length === 0)) {
      fetchWorkflows();
    }
  }, [wfPage, activeTab, sort, period, baseModel]);

  // Lazy load other tabs after initial images loaded
  useEffect(() => {
    if (images.length > 0) {
      if (videos.length === 0) fetchVideos();
      if (models.length === 0) fetchModels();
      if (workflows.length === 0) fetchWorkflows();
    }
  }, [images]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      if (activeTab === 'Images' && !imgLoadingMore) setImgPage(p => p + 1);
      if (activeTab === 'Videos' && !vidLoadingMore) setVidPage(p => p + 1);
      if (activeTab === 'Models' && !modelLoadingMore) setModelPage(p => p + 1);
      if (activeTab === 'Workflows' && !wfLoadingMore) setWfPage(p => p + 1);
    }, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab, imgLoadingMore, vidLoadingMore, modelLoadingMore, wfLoadingMore]);

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

  const cycle = (list, offsets, setOffsets, index, dir) => {
    setOffsets(prev => ({
      ...prev,
      [index]: ((prev[index] || 0) + dir + list.length) % list.length
    }));
  };

  const resetPages = () => {
    setImgPage(1);
    setVidPage(1);
    setModelPage(1);
    setWfPage(1);
    setImages([]);
    setVideos([]);
    setModels([]);
    setWorkflows([]);
  };

  const openItem = async (item, type) => {
    if (type === 'model') {
      try {
        const detail = await civitaiService.getModel(item.id);
        setModelDetail(detail);
        setModelVersion(0);
        setModelImage(0);
      } catch (err) {
        console.error('Failed to fetch model', err);
        return;
      }
    }
    setSelected(item);
    setSelectedType(type);
  };

  const closeModal = () => {
    setSelected(null);
    setSelectedType('');
    setModelDetail(null);
  };

  const getFieldString = (obj, field) => {
    const val = obj[field];
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.username) return val.username;
    return String(val);
  };

  const filtered = (arr, fields) =>
    arr.filter(item =>
      fields.some(f =>
        getFieldString(item, f)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
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
          <button key={o.value} className={period === o.value ? 'active' : ''} onClick={() => { setPeriod(o.value); resetPages(); setShowSortMenu(false); }}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="filter-group">
        <span>Sort:</span>
        {getSortOptions().map(o => (
          <button key={o} className={sort === o ? 'active' : ''} onClick={() => { setSort(o); resetPages(); setShowSortMenu(false); }}>
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
            <button key={t} className={modelType === t ? 'active' : ''} onClick={() => { setModelType(modelType === t ? '' : t); resetPages(); }}>
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="filter-group">
        <span>Base Model:</span>
        {BASE_MODELS.map(b => (
          <button key={b} className={baseModel === b ? 'active' : ''} onClick={() => { setBaseModel(baseModel === b ? '' : b); resetPages(); }}>
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
            <button key={tab} className={`explore-tab ${activeTab===tab?'active':''}`} onClick={() => setActiveTab(tab)}>
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
          {imgLoading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredImages.length === 0 ? (
            <div className="empty-state"><h2>No Results Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="image-grid explore-grid">
              {filteredImages.map((img, idx) => {
                const displayImg = filteredImages[(idx + (imgOffsets[idx] || 0) + filteredImages.length) % filteredImages.length];
                return (
                  <div key={idx} className="image-card" onClick={() => openItem(displayImg, 'image')}>
                    <img src={displayImg.url} alt={displayImg.prompt} className="grid-image" loading="lazy" />
                    <button className="use-prompt-button" onClick={e => { e.stopPropagation(); handleUsePrompt(displayImg); }}>Use Prompt</button>
                    <div className="card-controls">
                      <button onClick={e => { e.stopPropagation(); cycle(filteredImages, imgOffsets, setImgOffsets, idx, -1); }}>&lt;</button>
                      <button onClick={e => { e.stopPropagation(); cycle(filteredImages, imgOffsets, setImgOffsets, idx, 1); }}>&gt;</button>
                    </div>
                    <div className="image-info">
                      <div className="image-prompt">{displayImg.prompt}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={loadMoreRef} style={{ height: 1 }}></div>
            </div>
          )}
        </>
      )}
      {activeTab === 'Videos' && (
        <>
          {vidLoading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredVideos.length === 0 ? (
            <div className="empty-state"><h2>No Results Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="image-grid explore-grid">
              {filteredVideos.map((v, idx) => {
                const displayVid = filteredVideos[(idx + (videoOffsets[idx] || 0) + filteredVideos.length) % filteredVideos.length];
                return (
                  <div key={idx} className="image-card" onClick={() => openItem(displayVid, 'video')}>
                    <video src={displayVid.url} className="grid-image" controls preload="metadata" />
                    <div className="card-controls">
                      <button onClick={e => { e.stopPropagation(); cycle(filteredVideos, videoOffsets, setVideoOffsets, idx, -1); }}>&lt;</button>
                      <button onClick={e => { e.stopPropagation(); cycle(filteredVideos, videoOffsets, setVideoOffsets, idx, 1); }}>&gt;</button>
                    </div>
                    <div className="image-info">
                      <div className="image-prompt">{displayVid.prompt}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={loadMoreRef} style={{ height: 1 }}></div>
            </div>
          )}
        </>
      )}
      {activeTab === 'Models' && (
        <>
          {modelLoading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredModels.length === 0 ? (
            <div className="empty-state"><h2>No Models Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="models-grid">
              {filteredModels.map((model, idx) => {
                const displayModel = filteredModels[(idx + (modelOffsets[idx] || 0) + filteredModels.length) % filteredModels.length];
                return (
                  <div key={idx} className="model-card" onClick={() => openItem(displayModel, 'model')}>
                    <div className="model-header">
                      <h3 className="model-name">{displayModel.name}</h3>
                    </div>
                    <p className="model-description">{displayModel.description}</p>
                    <div className="model-meta">
                      <span className="model-creator">By @{displayModel.creator?.username || displayModel.creator}</span>
                      <span className="model-downloads">{displayModel.downloads}</span>
                    </div>
                    <div className="card-controls">
                      <button onClick={e => { e.stopPropagation(); cycle(filteredModels, modelOffsets, setModelOffsets, idx, -1); }}>&lt;</button>
                      <button onClick={e => { e.stopPropagation(); cycle(filteredModels, modelOffsets, setModelOffsets, idx, 1); }}>&gt;</button>
                    </div>
                    <button className="download-model-button" onClick={e => { e.stopPropagation(); handleDownloadModel(displayModel); }}>Download</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {activeTab === 'Workflows' && (
        <>
          {wfLoading ? (
            <div className="loading-container"><div className="spinner"></div></div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="empty-state"><h2>No Workflows Found</h2><p>Try adjusting your search query</p></div>
          ) : (
            <div className="models-grid">
              {filteredWorkflows.map((wf, idx) => {
                const displayWf = filteredWorkflows[(idx + (wfOffsets[idx] || 0) + filteredWorkflows.length) % filteredWorkflows.length];
                return (
                  <div key={idx} className="model-card" onClick={() => openItem(displayWf, 'workflow')}>
                    <div className="model-header"><h3 className="model-name">{displayWf.name}</h3></div>
                    <p className="model-description">{displayWf.description}</p>
                    <div className="card-controls">
                      <button onClick={e => { e.stopPropagation(); cycle(filteredWorkflows, wfOffsets, setWfOffsets, idx, -1); }}>&lt;</button>
                      <button onClick={e => { e.stopPropagation(); cycle(filteredWorkflows, wfOffsets, setWfOffsets, idx, 1); }}>&gt;</button>
                    </div>
                    <button className="download-model-button" onClick={e => { e.stopPropagation(); handleDownloadModel(displayWf); }}>Download</button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {selectedType === 'image' && (
              <>
                <img src={selected.url} alt={selected.prompt} className="modal-media" />
                <div className="modal-info">
                  <p>{selected.prompt}</p>
                  <div className="modal-actions">
                    <button onClick={() => { handleUsePrompt(selected); closeModal(); }}>Use Prompt</button>
                  </div>
                </div>
              </>
            )}
            {selectedType === 'video' && (
              <>
                <video src={selected.url} className="modal-media" controls autoPlay />
                <div className="modal-info">
                  <p>{selected.prompt}</p>
                  <div className="modal-actions">
                    <button onClick={() => { handleUsePrompt(selected); closeModal(); }}>Use Prompt</button>
                  </div>
                </div>
              </>
            )}
            {selectedType === 'model' && modelDetail && (
              <>
                {modelDetail.modelVersions && modelDetail.modelVersions.length > 0 && (
                  <img src={modelDetail.modelVersions[modelVersion].images[modelImage].url} alt={modelDetail.name} className="modal-media" />
                )}
                <div className="modal-info">
                  <div className="version-controls">
                    <button onClick={() => setModelVersion(v => (v - 1 + modelDetail.modelVersions.length) % modelDetail.modelVersions.length)}>&lt;</button>
                    <span>{modelDetail.name} - {modelDetail.modelVersions[modelVersion].name}</span>
                    <button onClick={() => setModelVersion(v => (v + 1) % modelDetail.modelVersions.length)}>&gt;</button>
                    <button onClick={() => handleDownloadModel(modelDetail)}>Download</button>
                  </div>
                  <div className="version-controls">
                    <button onClick={() => setModelImage(i => (i - 1 + modelDetail.modelVersions[modelVersion].images.length) % modelDetail.modelVersions[modelVersion].images.length)}>&lt;</button>
                    <button onClick={() => setModelImage(i => (i + 1) % modelDetail.modelVersions[modelVersion].images.length)}>&gt;</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
