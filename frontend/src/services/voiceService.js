import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8001";

const transcribe = async (blob) => {
  const form = new FormData();
  form.append('file', blob, 'audio.webm');
  try {
    const resp = await authService.authAxios.post(`${API_URL}/api/transcribe`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return resp.data?.payload?.text || '';
  } catch (err) {
    console.error('Transcription failed', err);
    return '';
  }
};

const downloadModel = async (model) => {
  try {
    await authService.authAxios.post(`${API_URL}/api/whisper/download?model=${model}`);
  } catch (err) {
    console.error('Model download failed', err);
  }
};

export default { transcribe, downloadModel };
