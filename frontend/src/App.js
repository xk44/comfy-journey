import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Sidebar from './components/Sidebar';

// Pages
import CreatePage from './pages/CreatePage';
import ExplorePage from './pages/ExplorePage';
import GalleryPage from './pages/GalleryPage';
import EditorPage from './pages/EditorPage';
import AdvancedEditorPage from './pages/AdvancedEditorPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ParametersPage from './pages/ParametersPage';
import SettingsPage from './pages/SettingsPage';

// Context
import { AuthProvider } from './contexts/AuthContext';

function App() {
  // For demo purposes, we'll set an image to use in the editor
  const [selectedImage, setSelectedImage] = useState({
    id: 'demo-image',
    url: 'https://source.unsplash.com/random/800x800/?landscape',
    prompt: 'A beautiful landscape with mountains and a lake'
  });

  return (
    <AuthProvider>
      <Router>
        <div className="comfyui-app">
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<CreatePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/editor" element={
                  selectedImage ? 
                    <EditorPage image={selectedImage} /> : 
                    <Navigate to="/" replace />
                } />
                <Route path="/advanced-editor" element={<AdvancedEditorPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/parameters" element={<ParametersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;