import React, { useState, useEffect } from 'react';
import modelService from '../services/modelService';
import Toast from '../components/Toast';

const ModelsPage = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await modelService.getModels();
      setModels(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading models:', err);
      setLoading(false);
      setToast({ message: 'Failed to load models', type: 'error' });
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const clearToast = () => setToast(null);

  return (
    <div className="models-page">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
      <h1 className="page-title">Models</h1>
      <button className="refresh-button" onClick={loadModels} disabled={loading}>
        Refresh
      </button>
      {loading ? (
        <div className="loading-container">Loading...</div>
      ) : (
        <ul className="model-list">
          {models.map((m) => (
            <li key={m.id} className="model-item">
              <span className="model-name">{m.name}</span> -
              <span className="model-type"> {m.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModelsPage;
