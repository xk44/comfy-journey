import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Components
import Sidebar from './components/Sidebar';

// Pages
import CreatePage from './pages/CreatePage';
import ExplorePage from './pages/ExplorePage';
import EditorPage from './pages/EditorPage';
import ParametersPage from './pages/ParametersPage';
import WorkflowsPage from './pages/WorkflowsPage';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Placeholder components for routes we haven't implemented yet
const GalleryPage = () => (
  <div className="page-content">
    <h1>Gallery</h1>
    <p>This is the Gallery page placeholder.</p>
  </div>
);

const AdvancedEditorPage = () => (
  <div className="page-content">
    <h1>Advanced Editor</h1>
    <p>This is the Advanced Editor page placeholder.</p>
  </div>
);

const SettingsPage = () => (
  <div className="page-content">
    <h1>Settings</h1>
    <p>This is the Settings page placeholder.</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="comfyui-app">
          <div className="app-container">
            <Sidebar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<CreatePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/advanced-editor" element={<AdvancedEditorPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/parameters" element={<ParametersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;