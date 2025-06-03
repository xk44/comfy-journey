import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

const getModels = async () => {
  try {
    const resp = await authService.authAxios.get(`${API_URL}/api/models`);
    return resp.data?.payload || resp.data;
  } catch (err) {
    console.error('Error fetching models:', err);
    return [];
  }
};

const modelService = { getModels };
export default modelService;
