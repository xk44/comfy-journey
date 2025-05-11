import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Get all workflows from ComfyUI
const getComfyUIWorkflows = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/comfyui/workflows`);
    return response.data;
  } catch (error) {
    console.error('Error getting ComfyUI workflows:', error);
    return [];
  }
};

// Get all workflow mappings
const getWorkflows = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/workflows`);
    return response.data;
  } catch (error) {
    console.error('Error getting workflow mappings:', error);
    return [];
  }
};

// Create a workflow mapping
const createWorkflow = async (workflow) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/workflows`, workflow);
    return response.data;
  } catch (error) {
    console.error('Error creating workflow mapping:', error);
    throw error;
  }
};

// Update a workflow mapping
const updateWorkflow = async (id, workflow) => {
  try {
    const response = await authService.authAxios.put(`${API_URL}/api/workflows/${id}`, workflow);
    return response.data;
  } catch (error) {
    console.error('Error updating workflow mapping:', error);
    throw error;
  }
};

// Delete a workflow mapping
const deleteWorkflow = async (id) => {
  try {
    const response = await authService.authAxios.delete(`${API_URL}/api/workflows/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting workflow mapping:', error);
    throw error;
  }
};

// Get ComfyUI server status
const getComfyUIStatus = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/comfyui/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting ComfyUI status:', error);
    return { status: 'offline', error: error.message };
  }
};

// Execute a workflow
const executeWorkflow = async (workflowId, prompt, parameters = {}) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/generate`, {
      workflow_id: workflowId,
      prompt,
      parameters
    });
    return response.data;
  } catch (error) {
    console.error('Error executing workflow:', error);
    throw error;
  }
};

// Get custom actions for a workflow
const getCustomActions = async (workflowId) => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/workflows/${workflowId}/actions`);
    return response.data;
  } catch (error) {
    console.error('Error getting custom actions:', error);
    return [];
  }
};

// Save custom actions for a workflow
const saveCustomActions = async (workflowId, actions) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/workflows/${workflowId}/actions`, { actions });
    return response.data;
  } catch (error) {
    console.error('Error saving custom actions:', error);
    throw error;
  }
};

const workflowService = {
  getComfyUIWorkflows,
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getComfyUIStatus,
  executeWorkflow,
  getCustomActions,
  saveCustomActions
};

export default workflowService;