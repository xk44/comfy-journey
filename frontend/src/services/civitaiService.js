// Service for interacting with the Civitai API
// Requests are proxied through the backend which handles authentication and
// caching.  The base URL therefore points to our own API.
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const CIVITAI_API_URL = `${API_URL}/api/v1`;

// API key is stored securely on the backend. These helpers
// allow the frontend to set the key without persisting it locally.
let CIVITAI_API_KEY = '';

export const setApiKey = async (apiKey) => {
  CIVITAI_API_KEY = apiKey;
  try {
    await fetch('/api/v1/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    });
    console.log('CivitAI API key saved');
  } catch (err) {
    console.error('Failed to save API key', err);
  }
  return CIVITAI_API_KEY;
};

// Helper for making API requests
const makeRequest = async (endpoint, params = {}) => {
  const url = new URL(`${CIVITAI_API_URL}${endpoint}`);
  
  // Add params to URL, skipping empty strings to avoid invalid requests
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(`${key}[]`, v));
    } else {
      url.searchParams.append(key, value);
    }
  });
  
  const options = {};
  
  try {
    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.payload !== undefined ? data.payload : data;
  } catch (error) {
    console.error('Civitai API error:', error);
    throw error;
  }
};

// Get images
export const getImages = async ({
  limit = 20,
  page = 1,
  nsfw = false,
  sort = 'Most Reactions',
  period = 'AllTime',
  query = '',
  username = '',
  modelId = '',
  baseModel = ''
}) => {
  const params = {
    limit,
    page,
    nsfw,
    sort,
    period,
    username,
    modelId,
    baseModel
  };
  
  // Add search query if provided (as a query parameter)
  if (query) {
    params.query = query;
  }
  
  return makeRequest('/images', params);
};

// Get trending images
export const getTrendingImages = async (limit = 20) => {
  return makeRequest('/images', {
    limit,
    sort: 'Most Reactions',
    period: 'Day',
  });
};

// Get models
export const getModels = async ({
  limit = 20,
  page = 1,
  query = '',
  tag = '',
  types = '',
  sort = 'Highest Rated',
  period = 'AllTime',
  baseModel = ''
}) => {
  return makeRequest('/models', {
    limit,
    page,
    query,
    tag,
    types,
    sort,
    period,
    baseModel
  });
};

export const getVideos = async ({
  limit = 20,
  page = 1,
  nsfw = false,
  sort = 'Most Reactions',
  period = 'AllTime',
  query = '',
  username = '',
  modelId = '',
  baseModel = ''
}) => {
  const params = {
    limit,
    page,
    nsfw,
    sort,
    period,
    username,
    modelId,
    baseModel
  };
  if (query) {
    params.query = query;
  }
  params.types = 'Video';
  return makeRequest('/images', params);
};

// Get specific model
export const getModel = async (modelId) => {
  return makeRequest(`/models/${modelId}`);
};

// Get tags
export const getTags = async () => {
  return makeRequest('/tags');
};

// Upload an image to CivitAI
export const uploadImage = async (imageUrl, promptText, workflowId) => {
  if (!CIVITAI_API_KEY) {
    throw new Error('CivitAI API key not set');
  }
  
  try {
    // In a full implementation, you would need to:
    // 1. Download the image if it's a URL
    // 2. Convert to a File/Blob
    // 3. Use FormData to upload
    console.log(`Would upload image: ${imageUrl} with prompt: ${promptText} from workflow: ${workflowId}`);
    
    // This is a mock implementation
    const mockResponse = {
      success: true,
      imageId: `civitai-${Date.now()}`,
      url: 'https://civitai.com/images/placeholder'
    };
    
    return mockResponse;
  } catch (error) {
    console.error('Error uploading to CivitAI:', error);
    throw error;
  }
};

// Check if API key is valid
export const checkApiKey = async () => {
  try {
    const res = await fetch('/api/v1/key');
    if (!res.ok) return false;
    const data = await res.json();
    return data.payload && data.payload.key_set;
  } catch (error) {
    console.error('Error checking API key:', error);
    return false;
  }
};

export default {
  getImages,
  getVideos,
  getTrendingImages,
  getModels,
  getModel,
  getTags,
  uploadImage,
  setApiKey,
  checkApiKey
};
