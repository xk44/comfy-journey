import React, { useState } from 'react';
import ComfyUIEditor from '../components/ComfyUIEditor';
import NodeParameterSelector from '../components/NodeParameterSelector';

const BackendManagerPage = () => {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="backend-manager-page">
      <h1>Backend Manager</h1>
      <p>Manage your local ComfyUI instance directly.</p>
      <button className="open-selector-button" onClick={() => setShowSelector(!showSelector)}>
        {showSelector ? 'Close Parameter Selector' : 'Select Node Parameter'}
      </button>
      {showSelector && (
        <div className="selector-panel">
          <NodeParameterSelector />
        </div>
      )}
      <ComfyUIEditor />
    </div>
  );
};

export default BackendManagerPage;
