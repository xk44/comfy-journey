import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const getActions = async () => {
  try {
    const response = await authService.authAxios.get(`${API_URL}/api/relational/actions`);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error getting actions:', error);
    return [];
  }
};

const createAction = async (action) => {
  try {
    const response = await authService.authAxios.post(`${API_URL}/api/relational/actions`, action);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error creating action:', error);
    throw error;
  }
};

const updateAction = async (id, action) => {
  try {
    const response = await authService.authAxios.put(`${API_URL}/api/relational/actions/${id}`, action);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error updating action:', error);
    throw error;
  }
};

const deleteAction = async (id) => {
  try {
    const response = await authService.authAxios.delete(`${API_URL}/api/relational/actions/${id}`);
    return response.data?.payload || response.data;
  } catch (error) {
    console.error('Error deleting action:', error);
    throw error;
  }
};

export default { getActions, createAction, updateAction, deleteAction };
