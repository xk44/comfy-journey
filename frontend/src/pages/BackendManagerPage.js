import React from 'react';
import ComfyUIEditor from '../components/ComfyUIEditor';

const BackendManagerPage = () => {
  return (
    <div className="backend-manager-page">
      <h1>Backend Manager</h1>
      <p>Manage your local ComfyUI instance directly.</p>
      <ComfyUIEditor />
    </div>
  );
};

export default BackendManagerPage;
