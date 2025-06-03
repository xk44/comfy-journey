import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import workflowService from '../services/workflowService';
import actionService from '../services/actionService';

const WorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    file: null
  });
  
  // For action mappings
  const [actionMappings, setActionMappings] = useState({
    'Text to Image': { name: 'Text to Image', assigned: 'None' },
    'Image to Image': { name: 'Image to Image', assigned: 'None' },
    'Inpainting': { name: 'Inpainting', assigned: 'None' },
    'Outpainting': { name: 'Outpainting', assigned: 'None' },
    'Upscale': { name: 'Upscale', assigned: 'None' },
    'Zoom Out': { name: 'Zoom Out', assigned: 'None' }
  });
  
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const unwrap = (resp) => (resp && resp.payload ? resp.payload : resp);

    const fetchData = async () => {
      try {
        setLoading(true);

        const [wfResp, actResp] = await Promise.all([
          workflowService.getWorkflows(),
          actionService.getActions()
        ]);

        const wfList = unwrap(wfResp) || [];
        if (wfList.length === 0) {
          const sampleWorkflows = [
            {
              id: 'workflow1',
              name: 'Stable Diffusion 1.5',
              description: 'Standard text to image workflow'
            },
            {
              id: 'workflow2',
              name: 'SDXL Inpainting',
              description: 'Inpainting with SDXL model'
            },
            {
              id: 'workflow3',
              name: 'Realistic Upscaler',
              description: 'High quality image upscaling'
            }
          ];
          setWorkflows(sampleWorkflows);
        } else {
          setWorkflows(wfList);
        }

        const actions = unwrap(actResp) || [];
        const mapping = { ...actionMappings };
        actions.forEach((a) => {
          const wf = wfList.find((w) => w.id === a.workflow_id);
          mapping[a.button] = {
            ...mapping[a.button],
            id: a.id,
            name: a.button || a.name,
            assigned: wf ? wf.name : 'None',
            workflow_id: a.workflow_id,
            parameters: a.parameters || {},
            paramInput: JSON.stringify(a.parameters || {})
          };
        });
        setActionMappings(mapping);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching workflows:', error);
        setLoading(false);
        showToast('Failed to load workflows. Please try again.', 'error');
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewWorkflow({
      ...newWorkflow,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    setNewWorkflow({
      ...newWorkflow,
      file: e.target.files[0]
    });
  };
  
  const handleAddWorkflow = async () => {
    if (!newWorkflow.name) {
      showToast('Please enter a workflow name', 'error');
      return;
    }

    try {
      let data = null;
      if (newWorkflow.file) {
        const text = await newWorkflow.file.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          showToast('Invalid workflow file', 'error');
          return;
        }
      }

      const payload = {
        name: newWorkflow.name,
        description: newWorkflow.description || '',
        data
      };

      const resp = await workflowService.createWorkflow(payload);
      const created = resp && resp.payload ? resp.payload : resp;

      setWorkflows([...workflows, created]);
      
      // Reset form
      setNewWorkflow({
        name: '',
        description: '',
        file: null
      });
      
      showToast('Workflow added successfully', 'success');
    } catch (error) {
      console.error('Error adding workflow:', error);
      showToast('Failed to add workflow. Please try again.', 'error');
    }
  };
  
  const handleUpdateActionMapping = async (actionName, workflowId) => {
    const selectedWorkflow = workflows.find((w) => w.id === workflowId);
    if (!selectedWorkflow) return;

    const existing = actionMappings[actionName] || { name: actionName };
    const payload = {
      button: actionName,
      name: actionName,
      workflow_id: workflowId,
      parameters: existing.parameters || {}
    };

    try {
      let resp;
      if (existing.id) {
        resp = await actionService.updateAction(existing.id, payload);
      } else {
        resp = await actionService.createAction(payload);
      }
      const data = resp && resp.payload ? resp.payload : resp;

      setActionMappings({
        ...actionMappings,
        [actionName]: {
          ...existing,
          ...data,
          assigned: selectedWorkflow.name,
          workflow_id: workflowId
        }
      });

      showToast(`"${actionName}" mapped to "${selectedWorkflow.name}"`, 'success');
    } catch (error) {
      console.error('Error saving action mapping:', error);
      showToast('Failed to map action. Please try again.', 'error');
    }
  };

  const handleParamChange = (actionName, value) => {
    setActionMappings({
      ...actionMappings,
      [actionName]: {
        ...actionMappings[actionName],
        paramInput: value
      }
    });
  };

  const handleSaveParameters = async (actionName) => {
    const mapping = actionMappings[actionName];
    let params = {};
    if (mapping.paramInput && mapping.paramInput.trim()) {
      try {
        params = JSON.parse(mapping.paramInput);
      } catch (err) {
        showToast('Invalid parameters JSON', 'error');
        return;
      }
    }

    const payload = {
      button: actionName,
      name: actionName,
      workflow_id: mapping.workflow_id,
      parameters: params
    };

    try {
      let resp;
      if (mapping.id) {
        resp = await actionService.updateAction(mapping.id, payload);
      } else {
        resp = await actionService.createAction(payload);
      }
      const data = resp && resp.payload ? resp.payload : resp;
      setActionMappings({
        ...actionMappings,
        [actionName]: {
          ...mapping,
          ...data,
          parameters: params,
          paramInput: JSON.stringify(params)
        }
      });
      showToast('Action parameters saved', 'success');
    } catch (error) {
      console.error('Error saving parameters:', error);
      showToast('Failed to save parameters', 'error');
    }
  };
  
  const handleDeleteWorkflow = async (id) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await workflowService.deleteWorkflow(id);

        // Remove from local state
        setWorkflows(workflows.filter(w => w.id !== id));

        // Update any action mappings using this workflow
        const workflowName = workflows.find(w => w.id === id)?.name;
        const updatedMappings = { ...actionMappings };

        for (const [key, map] of Object.entries(updatedMappings)) {
          if (map.workflow_id === id) {
            if (map.id) {
              try {
                await actionService.deleteAction(map.id);
              } catch (err) {
                console.error('Error deleting action', err);
              }
            }
            updatedMappings[key] = {
              ...map,
              assigned: 'None',
              workflow_id: undefined,
              id: undefined
            };
          }
        }

        setActionMappings(updatedMappings);
        
        showToast('Workflow deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting workflow:', error);
        showToast('Failed to delete workflow. Please try again.', 'error');
      }
    }
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const clearToast = () => {
    setToast(null);
  };
  
  return (
    <div className="workflows-page">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={clearToast} 
        />
      )}
      
      <h1 className="page-title">Workflow Manager</h1>
      <p className="page-description">Map ComfyUI workflows to frontend actions</p>
      
      <div className="workflows-container">
        <div className="available-workflows">
          <h2>Available Workflows</h2>
          
          <div className="add-workflow-form">
            <h3>Add New Workflow</h3>
            
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                value={newWorkflow.name}
                onChange={handleInputChange}
                placeholder="Workflow name" 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea 
                id="description" 
                name="description"
                value={newWorkflow.description}
                onChange={handleInputChange}
                placeholder="Workflow description" 
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="workflowFile">Workflow File</label>
              <div className="file-input-container">
                <button className="browse-button">Browse...</button>
                <span className="file-name">{newWorkflow.file ? newWorkflow.file.name : 'No file selected.'}</span>
                <input 
                  type="file" 
                  id="workflowFile" 
                  onChange={handleFileChange}
                  className="hidden-file-input"
                  accept=".json" 
                />
              </div>
            </div>
            
            <button 
              className="add-workflow-button"
              onClick={handleAddWorkflow}
              disabled={!newWorkflow.name}
            >
              Add Workflow
            </button>
          </div>
          
          {workflows.map(workflow => (
            <div key={workflow.id} className="workflow-item">
              <div className="workflow-details">
                <h3 className="workflow-name">{workflow.name}</h3>
                <p className="workflow-description">{workflow.description}</p>
              </div>
              
              <div className="workflow-actions">
                <button className="edit-button" onClick={() => showToast('Edit functionality not implemented yet', 'info')}>Edit</button>
                <button className="delete-button" onClick={() => handleDeleteWorkflow(workflow.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="action-mappings">
          <h2>Action Mappings</h2>
          
          {Object.entries(actionMappings).map(([actionName, action]) => (
            <div key={actionName} className="action-mapping-item">
              <div className="action-details">
                <h3 className="action-name">{action.name}</h3>
                <p className="action-assignment">Assigned: {action.assigned}</p>
              </div>

              <div className="action-selector">
                <select
                  className="workflow-select"
                  onChange={(e) => handleUpdateActionMapping(actionName, e.target.value)}
                  value={workflows.find(w => w.name === action.assigned)?.id || ''}
                >
                  <option value="">Select Workflow</option>
                  {workflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="param-input"
                  placeholder="{ }"
                  value={action.paramInput || ''}
                  onChange={(e) => handleParamChange(actionName, e.target.value)}
                  rows={2}
                />
                <button className="save-param-button" onClick={() => handleSaveParameters(actionName)}>
                  Save
                </button>
              </div>
            </div>
          ))}
          
          <button 
            className="add-action-button"
            onClick={() => showToast('Adding custom actions not implemented yet', 'info')}
          >
            Add Action
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowsPage;