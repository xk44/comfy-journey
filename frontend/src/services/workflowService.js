import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Get all workflows from ComfyUI
const getWorkflows = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/comfyui/workflows`);
    return response.data;
  } catch (error) {
    console.error('Error getting workflows:', error);
    throw error;
  }
};

// Get workflow mappings
const getWorkflowMappings = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/workflows`);
    return response.data;
  } catch (error) {
    console.error('Error getting workflow mappings:', error);
    throw error;
  }
};

// Create a workflow mapping
const createWorkflowMapping = async (mapping) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/workflows`, mapping);
    return response.data;
  } catch (error) {
    console.error('Error creating workflow mapping:', error);
    throw error;
  }
};

// Update a workflow mapping
const updateWorkflowMapping = async (id, mapping) => {
  try {
    const response = await authService.authAxios.put(`${API_URL}/api/workflows/${id}`, mapping);
    return response.data;
  } catch (error) {
    console.error('Error updating workflow mapping:', error);
    throw error;
  }
};

// Delete a workflow mapping
const deleteWorkflowMapping = async (id) => {
  try {
    const response = await authService.authAxios.delete(`${API_URL}/api/workflows/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting workflow mapping:', error);
    throw error;
  }
};

// Get user's default workflow
const getDefaultWorkflow = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/users/preferences`);
    return response.data.preferences.default_workflow;
  } catch (error) {
    console.error('Error getting default workflow:', error);
    return null;
  }
};

// Set user's default workflow
const setDefaultWorkflow = async (workflowId) => {
  try {
    // Get current preferences first
    const currentPrefs = await authService.authAxios.get(`${API_URL}/api/users/preferences`);
    const preferences = currentPrefs.data.preferences || {};
    
    // Update default workflow
    preferences.default_workflow = workflowId;
    
    // Save updated preferences
    const response = await authService.authAxios.put(`${API_URL}/api/users/preferences`, preferences);
    return response.data;
  } catch (error) {
    console.error('Error setting default workflow:', error);
    throw error;
  }
};

// Get user's custom actions
const getCustomActions = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/users/preferences`);
    return response.data.preferences.custom_actions || [];
  } catch (error) {
    console.error('Error getting custom actions:', error);
    return [];
  }
};

// Save user's custom actions
const saveCustomActions = async (actions) => {
  try {
    // Get current preferences first
    const currentPrefs = await authService.authAxios.get(`${API_URL}/api/users/preferences`);
    const preferences = currentPrefs.data.preferences || {};
    
    // Update custom actions
    preferences.custom_actions = actions;
    
    // Save updated preferences
    const response = await authService.authAxios.put(`${API_URL}/api/users/preferences`, preferences);
    return response.data;
  } catch (error) {
    console.error('Error saving custom actions:', error);
    throw error;
  }
};

const workflowService = {
  getWorkflows,
  getWorkflowMappings,
  createWorkflowMapping,
  updateWorkflowMapping,
  deleteWorkflowMapping,
  getDefaultWorkflow,
  setDefaultWorkflow,
  getCustomActions,
  saveCustomActions
};

export default workflowService;
