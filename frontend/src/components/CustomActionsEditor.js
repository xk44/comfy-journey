import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import workflowService from '../services/workflowService';

const CustomActionsEditor = ({ workflows, onSaveSuccess }) => {
  const [customActions, setCustomActions] = useState([]);
  const [newAction, setNewAction] = useState({
    name: '',
    icon: 'wand',
    workflow_id: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const { currentUser } = useAuth();
  
  const iconOptions = [
    { value: 'wand', label: 'Magic Wand' },
    { value: 'resize', label: 'Resize' },
    { value: 'upscale', label: 'Upscale' },
    { value: 'style', label: 'Style' },
    { value: 'fix', label: 'Fix Details' },
    { value: 'animate', label: 'Animate' }
  ];

  // Load existing custom actions
  useEffect(() => {
    const fetchCustomActions = async () => {
      try {
        setLoading(true);
        if (currentUser) {
          const actions = await workflowService.getCustomActions();
          setCustomActions(actions || []);
        } else {
          // Demo actions for non-logged in users
          setCustomActions([
            {
              id: 'demo1',
              name: 'Upscale 2x',
              icon: 'upscale',
              workflow_id: 'workflow3',
              description: 'Upscale image to twice the size'
            },
            {
              id: 'demo2',
              name: 'Fix Faces',
              icon: 'fix',
              workflow_id: 'workflow2',
              description: 'Improve face details'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching custom actions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomActions();
  }, [currentUser]);

  // Handle input change for new action
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingIndex >= 0) {
      // Update existing action
      const updatedActions = [...customActions];
      updatedActions[editingIndex] = {
        ...updatedActions[editingIndex],
        [name]: value
      };
      setCustomActions(updatedActions);
    } else {
      // Update new action
      setNewAction({
        ...newAction,
        [name]: value
      });
    }
  };

  // Add a new action
  const handleAddAction = () => {
    if (!newAction.name || !newAction.workflow_id) {
      return;
    }
    
    const action = {
      id: `action${Date.now()}`,
      ...newAction
    };
    
    setCustomActions([...customActions, action]);
    setNewAction({
      name: '',
      icon: 'wand',
      workflow_id: '',
      description: ''
    });
  };

  // Edit an existing action
  const handleEditAction = (index) => {
    setEditingIndex(index);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIndex(-1);
  };

  // Delete an action
  const handleDeleteAction = (index) => {
    if (window.confirm('Are you sure you want to delete this action?')) {
      const updatedActions = [...customActions];
      updatedActions.splice(index, 1);
      setCustomActions(updatedActions);
    }
  };

  // Save all actions
  const handleSaveActions = async () => {
    try {
      setSaving(true);
      if (currentUser) {
        await workflowService.saveCustomActions(customActions);
      } else {
        // Mock save for demo
        localStorage.setItem('customActions', JSON.stringify(customActions));
      }
      if (onSaveSuccess) {
        onSaveSuccess('Custom actions saved successfully!');
      }
    } catch (error) {
      console.error('Error saving custom actions:', error);
      if (onSaveSuccess) {
        onSaveSuccess('Failed to save custom actions', 'error');
      }
    } finally {
      setSaving(false);
      setEditingIndex(-1);
    }
  };

  // Get icon element
  const getIconElement = (iconName) => {
    switch (iconName) {
      case 'wand':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        );
      case 'resize':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        );
      case 'upscale':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'style':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        );
      case 'fix':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
          </svg>
        );
      case 'animate':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 0h-17.25m20.25 0h.375a1.125 1.125 0 01-1.125 1.125M3.375 4.5h17.25c.621 0 1.125.504 1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m13.5 0v1.5c0 .621-.504 1.125-1.125 1.125h-1.5c-.621 0-1.125-.504-1.125-1.125V5.625m0 0h1.5C19.496 5.625 20 5.004 20 4.375v-1.5c0-.621-.504-1.125-1.125-1.125h-1.5c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5M9 5.625c0 .621-.504 1.125-1.125 1.125h-1.5C5.754 6.75 5.25 6.246 5.25 5.625v-1.5c0-.621.504-1.125 1.125-1.125h1.5C8.496 3 9 3.504 9 4.125v1.5m-2.25 0v-1.5m0 0c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5m-2.25 0v1.5m1.125 5.625h1.5c.621 0 1.125.504 1.125 1.125v1.5m0 0v1.5c0 .621-.504 1.125-1.125 1.125h-1.5c-.621 0-1.125-.504-1.125-1.125v-1.5m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125H9.75c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125m3.75 0V12h-1.5m1.5 0c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5m0 0v1.5c0 .621-.504 1.125-1.125 1.125h-1.5C18.746 16.125 18.25 15.621 18.25 15v-1.5m0 0v-1.5m0 0H16.5m0 1.5c0 .621-.504 1.125-1.125 1.125h-1.5c-.621 0-1.125-.504-1.125-1.125V12c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        );
    }
  };

  return (
    <div className="custom-actions-editor">
      <h2>Custom Action Buttons</h2>
      <p className="section-description">
        Create custom action buttons that will appear when viewing generated images. 
        Each button will run a specific workflow when clicked.
      </p>
      
      {loading ? (
        <div className="loading">Loading custom actions...</div>
      ) : (
        <div className="actions-container">
          <div className="actions-list">
            <div className="actions-header">
              <span className="col-icon">Icon</span>
              <span className="col-name">Name</span>
              <span className="col-workflow">Workflow</span>
              <span className="col-actions">Actions</span>
            </div>
            
            {customActions.map((action, index) => (
              <div key={action.id} className="action-item">
                <div className="col-icon">
                  {getIconElement(action.icon)}
                </div>
                
                {editingIndex === index ? (
                  <>
                    <div className="col-name">
                      <input 
                        type="text" 
                        name="name" 
                        value={action.name} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    
                    <div className="col-workflow">
                      <select 
                        name="workflow_id"
                        value={action.workflow_id}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Workflow</option>
                        {workflows.map(workflow => (
                          <option key={workflow.id} value={workflow.id}>
                            {workflow.action_name}
                          </option>
                        ))}
                      </select>
                      
                      <select 
                        name="icon"
                        value={action.icon}
                        onChange={handleInputChange}
                        className="icon-select"
                      >
                        {iconOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      <input 
                        type="text" 
                        name="description" 
                        value={action.description || ''} 
                        onChange={handleInputChange}
                        placeholder="Description (optional)"
                        className="description-input"
                      />
                    </div>
                    
                    <div className="col-actions">
                      <button 
                        className="save-button"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-name">
                      {action.name}
                      {action.description && (
                        <span className="action-description">{action.description}</span>
                      )}
                    </div>
                    
                    <div className="col-workflow">
                      {workflows.find(w => w.id === action.workflow_id)?.action_name || 'Unknown workflow'}
                    </div>
                    
                    <div className="col-actions">
                      <button 
                        className="edit-button"
                        onClick={() => handleEditAction(index)}
                      >
                        Edit
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteAction(index)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {customActions.length === 0 && (
              <div className="no-actions">
                No custom actions defined yet. Add one below.
              </div>
            )}
          </div>
          
          <div className="add-action-form">
            <h3>Add New Action</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={newAction.name} 
                  onChange={handleInputChange} 
                  placeholder="Button name"
                />
              </div>
              
              <div className="form-group">
                <label>Workflow</label>
                <select 
                  name="workflow_id"
                  value={newAction.workflow_id}
                  onChange={handleInputChange}
                >
                  <option value="">Select Workflow</option>
                  {workflows.map(workflow => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.action_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Icon</label>
                <select 
                  name="icon"
                  value={newAction.icon}
                  onChange={handleInputChange}
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Description (optional)</label>
                <input 
                  type="text" 
                  name="description" 
                  value={newAction.description} 
                  onChange={handleInputChange} 
                  placeholder="Brief description"
                />
              </div>
            </div>
            
            <button 
              className="add-button"
              onClick={handleAddAction}
              disabled={!newAction.name || !newAction.workflow_id}
            >
              Add Action
            </button>
          </div>
          
          <div className="actions-footer">
            <button 
              className="save-all-button"
              onClick={handleSaveActions}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save All Actions'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomActionsEditor;
