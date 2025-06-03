import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import workflowService from '../services/workflowService';

const NodeParameterSelector = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState([]);
  const [workflowNodeParameters, setWorkflowNodeParameters] = useState({});
  const [nodeId, setNodeId] = useState('');
  const [paramName, setParamName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const wfs = await workflowService.getWorkflows();
        setWorkflows(wfs);
        if (wfs.length > 0) {
          setSelectedWorkflow(wfs[0].id);
          extractNodes(wfs[0]);
        }
      } catch (err) {
        console.error('Failed to load workflows', err);
      }
    };
    fetchData();
  }, []);

  const extractNodes = (workflow) => {
    if (!workflow || !workflow.data || !workflow.data.nodes) {
      setWorkflowNodes([]);
      setWorkflowNodeParameters({});
      return;
    }
    const nodes = [];
    const nodeParams = {};
    Object.entries(workflow.data.nodes).forEach(([id, node]) => {
      nodes.push({ id, title: node.title || `Node ${id}`, type: node.type || 'Unknown' });
      if (node.properties && Object.keys(node.properties).length > 0) {
        nodeParams[id] = Object.keys(node.properties).map((p) => ({ name: p, type: typeof node.properties[p] }));
      }
    });
    setWorkflowNodes(nodes);
    setWorkflowNodeParameters(nodeParams);
  };

  const handleWorkflowChange = (e) => {
    const id = e.target.value;
    setSelectedWorkflow(id);
    const wf = workflows.find((w) => w.id === id);
    if (wf) {
      extractNodes(wf);
      setNodeId('');
      setParamName('');
    }
  };

  const handleCreate = () => {
    if (selectedWorkflow && nodeId && paramName) {
      navigate(`/parameters?workflow=${selectedWorkflow}&node=${nodeId}&param=${paramName}`);
    }
  };

  return (
    <div className="node-parameter-selector">
      <h3>Select Node Parameter</h3>
      <div className="selector-field">
        <label>Workflow</label>
        <select value={selectedWorkflow} onChange={handleWorkflowChange}>
          {workflows.map((wf) => (
            <option key={wf.id} value={wf.id}>
              {wf.name || `Workflow ${wf.id}`}
            </option>
          ))}
        </select>
      </div>
      <div className="selector-field">
        <label>Node</label>
        <select value={nodeId} onChange={(e) => { setNodeId(e.target.value); setParamName(''); }}>
          <option value="">Select a node</option>
          {workflowNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.title} ({node.type})
            </option>
          ))}
        </select>
      </div>
      <div className="selector-field">
        <label>Parameter</label>
        <select value={paramName} onChange={(e) => setParamName(e.target.value)} disabled={!nodeId}>
          <option value="">Select a parameter</option>
          {nodeId && workflowNodeParameters[nodeId]?.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleCreate} disabled={!selectedWorkflow || !nodeId || !paramName}>
        Create Shortcode
      </button>
    </div>
  );
};

export default NodeParameterSelector;
