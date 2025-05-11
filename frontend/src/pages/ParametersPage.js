import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const ParametersPage = () => {
  const [parameters, setParameters] = useState([
    { 
      id: "param1", 
      code: "--ar", 
      nodeId: "node1", 
      parameter: "aspect_ratio", 
      template: "width:height", 
      description: "Set aspect ratio (e.g., --ar 16:9)" 
    },
    { 
      id: "param2", 
      code: "--style", 
      nodeId: "node2", 
      parameter: "style_preset", 
      template: "{value}", 
      description: "Set style preset (e.g., --style photorealistic)" 
    }
  ]);
  
  const [newParameter, setNewParameter] = useState({
    code: "",
    nodeId: "",
    parameter: "",
    template: "",
    description: ""
  });
  
  const [toast, setToast] = useState(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    // In a real app, this would fetch parameters from the backend
    // For now, we'll use the mock data set above
  }, []);
  
  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    setNewParameter({
      ...newParameter,
      [name]: value
    });
  };
  
  const handleAddParameter = () => {
    if (!newParameter.code || !newParameter.nodeId || !newParameter.parameter) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    
    const paramId = `param${Date.now()}`;
    const newParams = [...parameters, { ...newParameter, id: paramId }];
    setParameters(newParams);
    
    // Reset the form
    setNewParameter({
      code: "",
      nodeId: "",
      parameter: "",
      template: "",
      description: ""
    });
    
    showToast("Parameter added successfully", "success");
  };
  
  const handleDeleteParameter = (id) => {
    if (window.confirm("Are you sure you want to delete this parameter?")) {
      setParameters(parameters.filter(p => p.id !== id));
      showToast("Parameter deleted", "success");
    }
  };
  
  const handleEditParameter = (id) => {
    // For simplicity, we'll show an alert that this feature is coming soon
    showToast("Edit functionality coming soon", "info");
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const clearToast = () => {
    setToast(null);
  };
  
  return (
    <div className="parameter-manager">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <div className="page-header">
        <h1>Parameter Manager</h1>
        <p>Create and manage parameter mappings for ComfyUI nodes</p>
      </div>
      
      <div className="add-parameter-section">
        <h2>Add New Parameter</h2>
        
        <div className="parameter-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code">Parameter Code</label>
              <input 
                type="text" 
                id="code" 
                name="code"
                value={newParameter.code}
                onChange={handleParameterChange}
                placeholder="e.g., --ar"
              />
              <span className="help-text">The code users will type in prompts</span>
            </div>
            
            <div className="form-group">
              <label htmlFor="nodeId">Node ID</label>
              <input 
                type="text" 
                id="nodeId" 
                name="nodeId"
                value={newParameter.nodeId}
                onChange={handleParameterChange}
                placeholder="ComfyUI node ID"
              />
              <span className="help-text">ID of the node in ComfyUI workflow</span>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="parameter">Parameter</label>
              <input 
                type="text" 
                id="parameter" 
                name="parameter"
                value={newParameter.parameter}
                onChange={handleParameterChange}
                placeholder="Node parameter name"
              />
              <span className="help-text">The parameter name in the ComfyUI node</span>
            </div>
            
            <div className="form-group">
              <label htmlFor="template">Value Template</label>
              <input 
                type="text" 
                id="template" 
                name="template"
                value={newParameter.template}
                onChange={handleParameterChange}
                placeholder="e.g., width:height"
              />
              <span className="help-text">Format for the parameter value</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input 
              type="text" 
              id="description" 
              name="description"
              value={newParameter.description}
              onChange={handleParameterChange}
              placeholder="Parameter description"
            />
            <span className="help-text">What this parameter does (e.g., "Set aspect ratio")</span>
          </div>
          
          <div className="form-actions">
            <button 
              className="add-parameter-button"
              onClick={handleAddParameter}
            >
              Add Parameter
            </button>
          </div>
        </div>
      </div>
      
      <div className="existing-parameters">
        <h2>Existing Parameters</h2>
        
        <table className="parameters-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Node ID</th>
              <th>Parameter</th>
              <th>Template</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parameters.map(param => (
              <tr key={param.id}>
                <td><code>{param.code}</code></td>
                <td>{param.nodeId}</td>
                <td>{param.parameter}</td>
                <td>{param.template}</td>
                <td>{param.description}</td>
                <td className="parameter-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEditParameter(param.id)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteParameter(param.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParametersPage;