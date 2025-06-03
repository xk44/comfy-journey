import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const logFrontend = async (payload) => {
  try {
    await axios.post(`${API_URL}/api/logs/frontend`, payload);
  } catch (err) {
    console.error('Failed to send frontend log', err);
  }
};

export default { logFrontend };
