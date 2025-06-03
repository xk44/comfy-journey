import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';
import parameterService from '../services/parameterService';
import workflowService from '../services/workflowService';

const ParametersPage = () => {
  const [parameters, setParameters] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowNodes, setWorkflowNodes] = useState([]);
  const [workflowNodeParameters, setWorkflowNodeParameters] = useState({});
  
  const [newParameter, setNewParameter] = useState({
    code: "",
    node_id: "",
    param_name: "",
    value_template: "",
    injection_mode: "",
    description: ""
  });
  
  const [toast, setToast] = useState(null);
  const { currentUser } = useAuth();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch parameter mappings and workflows in parallel
        const [parametersResponse, workflowsResponse] = await Promise.all([
          parameterService.getParameterMappings().catch(() => ([])),
          workflowService.getWorkflows().catch(() => ([]))
        ]);
        
        setParameters(parametersResponse);
        setWorkflows(workflowsResponse);
        
        // Set first workflow as selected if available
        if (workflowsResponse.length > 0) {
          setSelectedWorkflow(workflowsResponse[0].id);
          extractWorkflowNodes(workflowsResponse[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to load data. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const extractWorkflowNodes = (workflow) => {
    if (!workflow || !workflow.data || !workflow.data.nodes) {
      setWorkflowNodes([]);
      setWorkflowNodeParameters({});
      return;
    }
    
    const nodes = [];
    const nodeParams = {};
    
    // Extract nodes and their parameters from the workflow
    Object.entries(workflow.data.nodes).forEach(([nodeId, node]) => {
      nodes.push({
        id: nodeId,
        title: node.title || `Node ${nodeId}`,
        type: node.type || 'Unknown'
      });
      
      // Extract parameters for each node
      if (node.properties && Object.keys(node.properties).length > 0) {
        nodeParams[nodeId] = Object.keys(node.properties).map(paramName => ({
          name: paramName,
          type: typeof node.properties[paramName]
        }));
      }
    });
    
    setWorkflowNodes(nodes);
    setWorkflowNodeParameters(nodeParams);
  };
  
  const handleWorkflowChange = (e) => {
    const workflowId = e.target.value;
    setSelectedWorkflow(workflowId);
    
    const selectedWorkflow = workflows.find(w => w.id === workflowId);
    if (selectedWorkflow) {
      extractWorkflowNodes(selectedWorkflow);
      
      // Reset the node_id and param_name in the form
      setNewParameter(prev => ({
        ...prev,
        node_id: "",
        param_name: ""
      }));
    }
  };
  
  const handleNodeChange = (e) => {
    const nodeId = e.target.value;
    setNewParameter(prev => ({
      ...prev,
      node_id: nodeId,
      param_name: "" // Reset parameter when node changes
    }));
  };
  
  const handleParameterChange = (e) => {
    const { name, value } = e.target;
    setNewParameter({
      ...newParameter,
      [name]: value
    });
  };
  
  const handleAddParameter = async () => {
    if (!newParameter.code || !newParameter.node_id || !newParameter.param_name) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    
    // Make sure code starts with --
    const code = newParameter.code.startsWith('--') 
      ? newParameter.code 
      : `--${newParameter.code}`;
    
    try {
      const paramData = {
        ...newParameter,
        code,
        workflow_id: selectedWorkflow
      };
      
      const response = await parameterService.createParameterMapping(paramData);
      
      // Add the new parameter to the list
      setParameters([...parameters, response]);
      
      // Reset the form
      setNewParameter({
        code: "",
        node_id: "",
        param_name: "",
        value_template: "",
        injection_mode: "",
        description: ""
      });
      
      showToast("Parameter added successfully", "success");
    } catch (error) {
      console.error('Error adding parameter:', error);
      showToast("Failed to add parameter. Please try again.", "error");
    }
  };
  
  const handleDeleteParameter = async (id) => {
    if (window.confirm("Are you sure you want to delete this parameter?")) {
      try {
        await parameterService.deleteParameterMapping(id);
        setParameters(parameters.filter(p => p.id !== id));
        showToast("Parameter deleted", "success");
      } catch (error) {
        console.error('Error deleting parameter:', error);
        showToast("Failed to delete parameter. Please try again.", "error");
      }
    }
  };
  
  const handleEditParameter = (parameter) => {
    // Set the form values for editing
    setNewParameter({
      code: parameter.code,
      node_id: parameter.node_id,
      param_name: parameter.param_name,
      value_template: parameter.value_template || "",
      injection_mode: parameter.injection_mode || "",
      description: parameter.description || ""
    });
    
    // Find and set the correct workflow
    const workflowWithNode = workflows.find(w => 
      w.data?.nodes && w.data.nodes[parameter.node_id]
    );
    
    if (workflowWithNode) {
      setSelectedWorkflow(workflowWithNode.id);
      extractWorkflowNodes(workflowWithNode);
    }
    
    showToast("Parameter loaded for editing. Update the form and click 'Add Parameter' to save changes.", "info");
  };
  
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };
  
  const clearToast = () => {
    setToast(null);
  };

  // Test the parameter with a sample prompt
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState(null);
  
  const handleTestParameter = () => {
    if (!testPrompt) {
      showToast("Please enter a test prompt", "error");
      return;
    }
    
    const result = parameterService.parseParameterCodes(testPrompt, parameters);
    setTestResult(result);
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
        <p>Create parameter codes that map to ComfyUI workflow node parameters</p>
      </div>
      
      <div className="parameter-container">
        <div className="parameter-form-panel">
          <h2>Add Parameter Code</h2>
          
          <div className="form-group">
            <label htmlFor="code">Parameter Code</label>
            <div className="input-with-help">
              <input 
                type="text" 
                id="code" 
                name="code"
                value={newParameter.code}
                onChange={handleParameterChange}
                placeholder="e.g., --ar" 
              />
              <span className="help-text">The code users will type in prompts (e.g., --ar)</span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="workflow">ComfyUI Workflow</label>
            <select
              id="workflow"
              value={selectedWorkflow || ''}
              onChange={handleWorkflowChange}
              disabled={workflows.length === 0}
            >
              {workflows.length === 0 && (
                <option value="">No workflows available</option>
              )}
              {workflows.map(workflow => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name || `Workflow ${workflow.id}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="node_id">Node</label>
            <select
              id="node_id"
              name="node_id"
              value={newParameter.node_id}
              onChange={handleNodeChange}
              disabled={workflowNodes.length === 0}
            >
              <option value="">Select a node</option>
              {workflowNodes.map(node => (
                <option key={node.id} value={node.id}>
                  {node.title} ({node.type})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="param_name">Node Parameter</label>
            <select
              id="param_name"
              name="param_name"
              value={newParameter.param_name}
              onChange={handleParameterChange}
              disabled={!newParameter.node_id || !workflowNodeParameters[newParameter.node_id]}
            >
              <option value="">Select a parameter</option>
              {newParameter.node_id && workflowNodeParameters[newParameter.node_id]?.map(param => (
                <option key={param.name} value={param.name}>
                  {param.name} ({param.type})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="value_template">Value Template</label>
            <div className="input-with-help">
              <input
                type="text"
                id="value_template"
                name="value_template"
                value={newParameter.value_template}
                onChange={handleParameterChange}
                placeholder="e.g., width:height or {value}"
              />
              <span className="help-text">Format for the parameter value (e.g., width:height for --ar 16:9)</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="injection_mode">Injection Mode</label>
            <select
              id="injection_mode"
              name="injection_mode"
              value={newParameter.injection_mode}
              onChange={handleParameterChange}
            >
              <option value="">None (set parameter)</option>
              <option value="prepend">Prepend text</option>
              <option value="append">Append text</option>
            </select>
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
          </div>
          
          <button 
            className="add-parameter-button" 
            onClick={handleAddParameter}
            disabled={!newParameter.code || !newParameter.node_id || !newParameter.param_name}
          >
            Add Parameter
          </button>
        </div>
        
        <div className="parameter-test-panel">
          <h2>Test Parameter Codes</h2>
          
          <div className="form-group">
            <label htmlFor="test-prompt">Test Prompt</label>
            <textarea
              id="test-prompt"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="e.g., A beautiful landscape --ar 16:9 --style photorealistic"
              rows={3}
            />
          </div>
          
          <button 
            className="test-parameter-button"
            onClick={handleTestParameter}
            disabled={!testPrompt}
          >
            Test Parameters
          </button>
          
          {testResult && (
            <div className="test-results">
              <h3>Test Results:</h3>
              <div className="result-item">
                <strong>Clean Prompt:</strong>
                <pre>{testResult.cleanPrompt}</pre>
              </div>
              <div className="result-item">
                <strong>Extracted Parameters:</strong>
                <pre>{JSON.stringify(testResult.parameters, null, 2)}</pre>
              </div>
              {testResult.injections && (
                <div className="result-item">
                  <strong>Text Injections:</strong>
                  <pre>{JSON.stringify(testResult.injections, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="existing-parameters">
        <h2>Existing Parameter Codes</h2>
        
        {parameters.length === 0 ? (
          <div className="empty-state">
            <p>No parameter codes defined yet. Add your first one above.</p>
          </div>
        ) : (
          <table className="parameters-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Node</th>
                <th>Parameter</th>
                <th>Template</th>
                <th>Injection</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parameters.map(param => (
                <tr key={param.id}>
                  <td><code>{param.code}</code></td>
                  <td>{param.node_id}</td>
                  <td>{param.param_name}</td>
                  <td>{param.value_template || '{value}'}</td>
                  <td>{param.injection_mode || '-'}</td>
                  <td>{param.description}</td>
                  <td className="parameter-actions">
                    <button 
                      className="edit-button" 
                      onClick={() => handleEditParameter(param)}
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
        )}
      </div>
    </div>
  );
};

export default ParametersPage;