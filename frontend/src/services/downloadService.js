import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const downloadFile = async (url, path, filename) => {
  const resp = await authService.authAxios.post(`${API_URL}/api/download`, {
    url,
    path,
    filename,
  });
  return resp.data?.payload || resp.data;
};

export default { downloadFile };
