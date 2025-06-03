import authService from './authService';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Subscribe to progress updates for a job using Server-Sent Events
const subscribe = (jobId, onUpdate, onError) => {
  const source = new EventSource(`${API_URL}/api/progress/stream/${jobId}`);

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onUpdate) onUpdate(data);
    } catch (err) {
      console.error('Failed to parse progress event', err);
    }
  };

  if (onError) {
    source.onerror = onError;
  }

  return source;
};

const progressService = { subscribe };

export default progressService;
