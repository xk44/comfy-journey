import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

const downloadBackup = async () => {
  const resp = await authService.authAxios.get(`${API_URL}/api/maintenance/backup`, {
    responseType: 'blob'
  });
  return resp.data;
};

const restoreBackup = async (blob) => {
  const resp = await authService.authAxios.post(
    `${API_URL}/api/maintenance/restore`,
    blob,
    {
      headers: { 'Content-Type': 'application/gzip' }
    }
  );
  return resp.data;
};

export default { downloadBackup, restoreBackup };
