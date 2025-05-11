// Service for interacting with the Civitai API
const CIVITAI_API_URL = 'https://civitai.com/api/v1';

// You would typically store this in an environment variable
// For now, we'll leave it empty and allow users to provide it in settings
let CIVITAI_API_KEY = localStorage.getItem('civitai_api_key') || '';

// Update the API key
export const setApiKey = (apiKey) => {
  CIVITAI_API_KEY = apiKey;
  localStorage.setItem('civitai_api_key', apiKey);
  console.log('CivitAI API key has been set');
  return CIVITAI_API_KEY;
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
  const options = {
    headers: {}
  };
  
  if (CIVITAI_API_KEY) {
    options.headers['Authorization'] = `Bearer ${CIVITAI_API_KEY}`;
  }
  
  try {
    const response = await fetch(url.toString(), options);
    
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
  const params = {
    limit,
    page,
    nsfw,
    sort,
    period,
    username,
    modelId
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
  if (!CIVITAI_API_KEY) {
    return false;
  }
  
  try {
    // Try to get user info or another restricted endpoint
    const response = await fetch(`${CIVITAI_API_URL}/user/me`, {
      headers: {
        'Authorization': `Bearer ${CIVITAI_API_KEY}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error checking API key:', error);
    return false;
  }
};

export default {
  getImages,
  getTrendingImages,
  getModels,
  getModel,
  getTags,
  uploadImage,
  setApiKey,
  checkApiKey
};
