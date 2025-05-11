// Service for interacting with the Civitai API
const CIVITAI_API_URL = 'https://civitai.com/api/v1';

// You would typically store this in an environment variable
// For now, we'll leave it empty and allow users to provide it in settings
let CIVITAI_API_KEY = localStorage.getItem('civitai_api_key') || '';

// Update the API key
export const setApiKey = (apiKey) => {
  CIVITAI_API_KEY = apiKey;
  localStorage.setItem('civitai_api_key', apiKey);
};

// Helper for making API requests
const makeRequest = async (endpoint, params = {}) => {
  const url = new URL(`${CIVITAI_API_URL}${endpoint}`);
  
  // Add params to URL
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  
  // Add API key if available
  if (CIVITAI_API_KEY) {
    url.searchParams.append('token', CIVITAI_API_KEY);
  }
  
  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
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
  modelId = ''
}) => {
  return makeRequest('/images', {
    limit,
    page,
    nsfw,
    sort,
    period,
    query,
    username,
    modelId
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
  period = 'AllTime'
}) => {
  return makeRequest('/models', {
    limit,
    page,
    query,
    tag,
    types,
    sort,
    period
  });
};

// Get specific model
export const getModel = async (modelId) => {
  return makeRequest(`/models/${modelId}`);
};

// Get tags
export const getTags = async () => {
  return makeRequest('/tags');
};

// Save an image locally (this would use our backend)
export const saveImage = async (imageUrl, metadata) => {
  try {
    const response = await fetch(`/api/images/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: imageUrl, metadata })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

export default {
  getImages,
  getModels,
  getModel,
  getTags,
  saveImage,
  setApiKey
};
