import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import EditorPage from './pages/EditorPage';
import AdvancedEditorPage from './pages/AdvancedEditorPage';
import GalleryPage from './pages/GalleryPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ParametersPage from './pages/ParametersPage';
import SettingsPage from './pages/SettingsPage';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './contexts/AuthContext';
import ComfyUIEditor from './components/ComfyUIEditor';

function App() {
  return (
      <AuthProvider>
        <div className="app">
          <Router>
            <Sidebar />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/editor" element={<EditorPage />} />
                <Route path="/advanced-editor" element={<AdvancedEditorPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/parameters" element={<ParametersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </Router>
          
          {/* ComfyUI Editor */}
          <div className="comfyui-editor-wrapper">
            <ComfyUIEditor />
          </div>
        </div>
      </AuthProvider>
  );
}

export default App;
