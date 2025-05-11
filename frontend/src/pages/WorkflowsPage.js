import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import workflowService from '../services/workflowService';

const WorkflowsPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [actions, setActions] = useState([
    { id: "action1", name: "Text to Image", workflow: null },
    { id: "action2", name: "Image to Image", workflow: null },
    { id: "action3", name: "Inpainting", workflow: null },
    { id: "action4", name: "Outpainting", workflow: null },
    { id: "action5", name: "Upscale", workflow: null }
  ]);
  const [customActions, setCustomActions] = useState([]);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    file: null
  });
  const [newAction, setNewAction] = useState({
    name: "",
    workflow: null
  });
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [showAddAction, setShowAddAction] = useState(false);
  const [toast, setToast] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Mock data for demonstration
    setWorkflows([
      { id: "workflow1", name: "Stable Diffusion 1.5", description: "Standard text to image workflow" },
      { id: "workflow2", name: "SDXL Inpainting", description: "Inpainting with SDXL model" },
      { id: "workflow3", name: "Realistic Upscaler", description: "High quality image upscaling" }
    ]);

    // Load custom actions from preferences
    const loadCustomActions = async () => {
      if (currentUser) {
        try {
          const loadedActions = await workflowService.getCustomActions();
          if (loadedActions && loadedActions.length > 0) {
            setCustomActions(loadedActions);
          }
        } catch (error) {
          console.error("Error loading custom actions:", error);
        }
      }
    };

    loadCustomActions();
  }, [currentUser]);

  const assignWorkflow = (actionId, workflowId) => {
    setActions(actions.map(action => 
      action.id === actionId ? { ...action, workflow: workflowId } : action
    ));
    showToast("Workflow assigned successfully", "success");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewWorkflow({
        ...newWorkflow,
        file
      });
    }
  };

  const handleAddWorkflow = () => {
    if (!newWorkflow.name || !newWorkflow.description) {
      showToast("Please fill in all fields", "error");
      return;
    }
    
    const workflow = {
      id: `workflow${workflows.length + 1}`,
      name: newWorkflow.name,
      description: newWorkflow.description
    };
    
    setWorkflows([...workflows, workflow]);
    setNewWorkflow({
      name: "",
      description: "",
      file: null
    });
    
    showToast("Workflow added successfully", "success");
  };

  const handleUpdateWorkflow = () => {
    if (!editingWorkflow) return;
    
    setWorkflows(workflows.map(workflow => 
      workflow.id === editingWorkflow.id ? editingWorkflow : workflow
    ));
    
    setEditingWorkflow(null);
    showToast("Workflow updated successfully", "success");
  };

  const handleDeleteWorkflow = (id) => {
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      setWorkflows(workflows.filter(workflow => workflow.id !== id));
      
      // Remove workflow from actions
      setActions(actions.map(action => 
        action.workflow === id ? { ...action, workflow: null } : action
      ));

      // Remove workflow from custom actions
      setCustomActions(customActions.filter(action => action.workflow !== id));
      
      showToast("Workflow deleted successfully", "success");
    }
  };

  const handleAddCustomAction = () => {
    if (!newAction.name || !newAction.workflow) {
      showToast("Please fill in all fields", "error");
      return;
    }

    const action = {
      id: `custom${Date.now()}`,
      name: newAction.name,
      workflow: newAction.workflow
    };

    const updatedActions = [...customActions, action];
    setCustomActions(updatedActions);
    
    // Save to user preferences
    if (currentUser) {
      workflowService.saveCustomActions(updatedActions)
        .then(() => {
          showToast("Custom action added successfully", "success");
        })
        .catch(error => {
          console.error("Error saving custom action:", error);
          showToast("Failed to save custom action", "error");
        });
    } else {
      showToast("Custom action added (login to save permanently)", "info");
    }

    setNewAction({
      name: "",
      workflow: null
    });
    setShowAddAction(false);
  };

  const handleDeleteCustomAction = (id) => {
    if (window.confirm("Are you sure you want to delete this custom action?")) {
      const updatedActions = customActions.filter(action => action.id !== id);
      setCustomActions(updatedActions);
      
      // Save to user preferences
      if (currentUser) {
        workflowService.saveCustomActions(updatedActions)
          .then(() => {
            showToast("Custom action deleted successfully", "success");
          })
          .catch(error => {
            console.error("Error deleting custom action:", error);
            showToast("Failed to delete custom action", "error");
          });
      } else {
        showToast("Custom action deleted (login to save permanently)", "info");
      }
    }
  };

  const showToast = (message, type = "info") => {
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
      
      <div className="page-header">
        <h1>Workflow Manager</h1>
        <p>Map ComfyUI workflows to frontend actions</p>
      </div>

      <div className="workflows-container">
        <div className="available-workflows">
          <h2>Available Workflows</h2>
          
          <div className="add-workflow-form">
            <h3>{editingWorkflow ? "Edit Workflow" : "Add New Workflow"}</h3>
            <div className="form-group">
              <label>Name:</label>
              <input 
                type="text" 
                value={editingWorkflow ? editingWorkflow.name : newWorkflow.name}
                onChange={(e) => 
                  editingWorkflow 
                    ? setEditingWorkflow({...editingWorkflow, name: e.target.value})
                    : setNewWorkflow({...newWorkflow, name: e.target.value})
                }
                placeholder="Workflow name"
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input 
                type="text" 
                value={editingWorkflow ? editingWorkflow.description : newWorkflow.description}
                onChange={(e) => 
                  editingWorkflow 
                    ? setEditingWorkflow({...editingWorkflow, description: e.target.value})
                    : setNewWorkflow({...newWorkflow, description: e.target.value})
                }
                placeholder="Workflow description"
              />
            </div>
            {!editingWorkflow && (
              <div className="form-group">
                <label>Workflow File:</label>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".json"
                />
              </div>
            )}
            <div className="form-actions">
              {editingWorkflow ? (
                <>
                  <button 
                    className="save-button"
                    onClick={handleUpdateWorkflow}
                  >
                    Update Workflow
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setEditingWorkflow(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  className="add-button"
                  onClick={handleAddWorkflow}
                >
                  Add Workflow
                </button>
              )}
            </div>
          </div>
          
          <div className="workflows-list">
            {workflows.map(workflow => (
              <div key={workflow.id} className="workflow-card">
                <h3>{workflow.name}</h3>
                <p>{workflow.description}</p>
                <div className="workflow-actions">
                  <button 
                    className="edit-button" 
                    onClick={() => setEditingWorkflow(workflow)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-mappings">
          <h2>Action Mappings</h2>
          <div className="section-header">
            <h3>Default Actions</h3>
            <p>System default actions that appear in the "Create" page</p>
          </div>
          <div className="mappings-list">
            {actions.map(action => (
              <div key={action.id} className="mapping-item">
                <div className="mapping-info">
                  <h3>{action.name}</h3>
                  <p>Assigned: {action.workflow ? 
                    workflows.find(w => w.id === action.workflow)?.name : 
                    "None"}
                  </p>
                </div>
                <div className="mapping-action">
                  <select 
                    value={action.workflow || ""} 
                    onChange={(e) => assignWorkflow(action.id, e.target.value)}
                  >
                    <option value="">Select Workflow</option>
                    {workflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="custom-actions-section">
            <div className="section-header">
              <h3>Custom Actions</h3>
              <p>Your custom actions will appear in the "Create" page after selecting an image</p>
              <button 
                className="add-action-button"
                onClick={() => setShowAddAction(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Action
              </button>
            </div>

            {showAddAction && (
              <div className="add-action-form">
                <div className="form-group">
                  <label>Action Name:</label>
                  <input 
                    type="text" 
                    value={newAction.name}
                    onChange={(e) => setNewAction({...newAction, name: e.target.value})}
                    placeholder="e.g., Super Resolution"
                  />
                </div>
                <div className="form-group">
                  <label>Assigned Workflow:</label>
                  <select 
                    value={newAction.workflow || ""} 
                    onChange={(e) => setNewAction({...newAction, workflow: e.target.value})}
                  >
                    <option value="">Select Workflow</option>
                    {workflows.map(workflow => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button 
                    className="save-button"
                    onClick={handleAddCustomAction}
                    disabled={!newAction.name || !newAction.workflow}
                  >
                    Add Action
                  </button>
                  <button 
                    className="cancel-button"
                    onClick={() => setShowAddAction(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="custom-actions-list">
              {customActions.length > 0 ? (
                customActions.map(action => (
                  <div key={action.id} className="custom-action-item">
                    <div className="action-info">
                      <h4>{action.name}</h4>
                      <p>Workflow: {workflows.find(w => w.id === action.workflow)?.name || "Unknown"}</p>
                    </div>
                    <div className="action-controls">
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteCustomAction(action.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No custom actions added yet. Click "Add Action" to create your first custom action.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="comfyui-integration-section">
        <h2>Advanced ComfyUI Integration</h2>
        <p>View and edit ComfyUI workflows directly</p>
        
        <button 
          className="open-comfyui-button"
          onClick={() => {
            // Open the ComfyUI editor
            document.querySelector('.comfyui-editor-wrapper')?.classList.add('open');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open ComfyUI Editor
        </button>
      </div>
    </div>
  );
};

export default WorkflowsPage;