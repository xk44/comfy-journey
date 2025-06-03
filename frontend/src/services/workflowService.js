import axios from 'axios';
import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Get all workflows from ComfyUI
const getComfyUIWorkflows = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/comfyui/workflows`);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error getting ComfyUI workflows:', error);
    return [];
  }
};

// Get all workflow mappings
const getWorkflows = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/relational/workflows`);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error getting workflow mappings:', error);
    return [];
  }
};

// Create a workflow mapping
const createWorkflow = async (workflow) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/relational/workflows`, workflow);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error creating workflow mapping:', error);
    throw error;
  }
};

// Update a workflow mapping
const updateWorkflow = async (id, workflow) => {
  try {
    const response = await authService.authAxios.put(`${API_URL}/api/relational/workflows/${id}`, workflow);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error updating workflow mapping:', error);
    throw error;
  }
};

// Delete a workflow mapping
const deleteWorkflow = async (id) => {
  try {
    const response = await authService.authAxios.delete(`${API_URL}/api/relational/workflows/${id}`);
    return response.data?.payload || response.data;
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

// Restart ComfyUI server
const restartComfyUI = async () => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/comfyui/restart`);
    return response.data;
  } catch (error) {
    console.error('Error restarting ComfyUI:', error);
    return { status: 'error', error: error.message };
  }
};

// Execute a workflow
const executeWorkflow = async (workflowId, prompt, parameters = {}) => {
  try {
    const payload = { prompt };
    if (workflowId) payload.workflow_id = workflowId;
    if (parameters && Object.keys(parameters).length > 0) {
      Object.assign(payload, parameters);
    }
    const response = await authService.authAxios.post(
      `${API_URL}/api/generate`,
      payload
    );
    return response.data;
  } catch (error) {
    console.error('Error executing workflow:', error);
    throw error;
  }
};

// Stream progress updates for a job via Server-Sent Events
// Returns the EventSource so the caller can close it when done
const streamProgress = (jobId, onUpdate) => {
  const es = new EventSource(`${API_URL}/api/progress/stream/${jobId}`);
  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onUpdate) onUpdate(data);
    } catch (err) {
      console.error('Error parsing progress update:', err);
    }
  };
  es.onerror = () => {
    es.close();
  };
  return es;
};

// Get custom actions for a workflow
const getCustomActions = async (workflowId) => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/relational/actions`);
    const data = response.data?.payload || response.data;
    if (workflowId) {
      return data.filter(a => a.workflow_id === workflowId);
    }
    return data;
  } catch (error) {
    console.error('Error getting custom actions:', error);
    return [];
  }
};

// Save custom actions for a workflow
const saveCustomActions = async (workflowId, actions) => {
  try {
    // Bulk save not supported; create/update individually
    const promises = actions.map(act => {
      if (act.id) {
        return authService.authAxios.put(`${API_URL}/api/relational/actions/${act.id}`, act);
      }
      return authService.authAxios.post(`${API_URL}/api/relational/actions`, act);
    });
    const resp = await Promise.all(promises);
    return resp.map(r => r.data);
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
  streamProgress,
  getCustomActions,
  saveCustomActions,
  restartComfyUI
};

export default workflowService;