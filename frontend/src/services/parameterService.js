import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Get all parameter mappings
const getParameterMappings = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/parameters`);
    return response.data;
  } catch (error) {
    console.error('Error getting parameter mappings:', error);
    throw error;
  }
};

// Create a parameter mapping
const createParameterMapping = async (mapping) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/parameters`, mapping);
    return response.data;
  } catch (error) {
    console.error('Error creating parameter mapping:', error);
    throw error;
  }
};

// Update a parameter mapping
const updateParameterMapping = async (id, mapping) => {
  try {
    const response = await authService.authAxios.put(`${API_URL}/api/parameters/${id}`, mapping);
    return response.data;
  } catch (error) {
    console.error('Error updating parameter mapping:', error);
    throw error;
  }
};

// Delete a parameter mapping
const deleteParameterMapping = async (id) => {
  try {
    const response = await authService.authAxios.delete(`${API_URL}/api/parameters/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting parameter mapping:', error);
    throw error;
  }
};

// Parse a prompt for parameter codes
const parseParameterCodes = (prompt, parameterMappings) => {
  if (!prompt || !parameterMappings || !parameterMappings.length) {
    return { cleanPrompt: prompt, parameters: {} };
  }

  const paramCodeRegex = /--([a-zA-Z_]+)(?:[=\s]+(\"[^\"]*\"|'[^']*'|[^-\s]+))?/g;
  let match;
  const parameters = {};
  let cleanPrompt = prompt;

  while ((match = paramCodeRegex.exec(prompt)) !== null) {
    const [fullMatch, code, rawValue] = match;
    const mapping = parameterMappings.find(p => p.code === `--${code}`);

    if (mapping) {
      let value = rawValue !== undefined ? rawValue.trim() : 'true';
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      parameters[mapping.node_id] = {
        ...(parameters[mapping.node_id] || {}),
        [mapping.param_name]: processValueTemplate(mapping.value_template, value)
      };

      cleanPrompt = cleanPrompt.replace(fullMatch, '').trim();
    }
  }

  return {
    cleanPrompt: cleanPrompt.trim(),
    parameters
  };
};

// Process the value template by replacing placeholders
const processValueTemplate = (template, value) => {
  if (template.includes(':')) {
    // Handle special formats like width:height
    if (template === 'width:height' && value.includes(':')) {
      const [width, height] = value.split(':');
      return { width: parseInt(width), height: parseInt(height) };
    }
    return value;
  }
  
  // Default case: just replace {value} with the actual value
  return template.replace('{value}', value);
};

const parameterService = {
  getParameterMappings,
  createParameterMapping,
  updateParameterMapping,
  deleteParameterMapping,
  parseParameterCodes
};

export default parameterService;