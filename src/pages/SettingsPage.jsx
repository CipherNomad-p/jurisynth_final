import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css';
import { apiFetch } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const SettingsPage = () => {

  const language = useLanguage();
  const t = language?.t || ((key) => key);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');

  const [isSimulation, setIsSimulation] = useState(true);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Flash');
  const [detailLevel, setDetailLevel] = useState('Comprehensive');

  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const handleClose = () => navigate('/dashboard');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await apiFetch('/api/users/settings', { method: 'GET' });
        const data = await res.json();

        if (res.ok && data) {
          setSelectedModel(data.modelPreference || 'Gemini 2.5 Flash');
          setDetailLevel(data.analysisDepth || 'Comprehensive');
          setIsSimulation(data.simulationMode ?? true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    setStatusMessage('');

    try {
      const payload = {
        modelPreference: selectedModel,
        analysisDepth: detailLevel,
        simulationMode: isSimulation
      };

      const res = await apiFetch('/api/users/settings', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed");

      setStatusMessage("✅ Saved successfully");
    } catch (err) {
      setStatusMessage("❌ Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedModel('Gemini 2.5 Flash');
    setDetailLevel('Comprehensive');
    setIsSimulation(true);
    setStatusMessage("⚠️ Reset (not saved)");
  };

  const renderCard = (title, desc, content) => (
    <div className="settings-card">
      <div className="settings-card-header">
        <h3>{title}</h3>
        {desc && <p className="settings-desc">{desc}</p>}
      </div>
      <div className="settings-card-body">{content}</div>
    </div>
  );

  const renderContent = () => {
    if (loadingSettings) return <p>Loading...</p>;

    switch (activeTab) {
      case 'ai':
        return renderCard(
          "AI Configuration",
          "Control how AI analyzes and processes your cases",
          <>
            <div className="form-group">
              <label>Model</label>
              <select className="standard-input" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                <option value="Gemini 1.5 Pro">High Precision</option>
                <option value="Gemini 2.5 Flash">Fast & Optimized</option>
              </select>
            </div>

            <div className="form-group">
              <label>Analysis Depth</label>
              <select className="standard-input" value={detailLevel} onChange={(e) => setDetailLevel(e.target.value)}>
                <option value="Concise">Fast Summary</option>
                <option value="Comprehensive">Deep Analysis</option>
              </select>
            </div>
          </>
        );

      case 'security':
        return renderCard(
          "Security",
          "Manage your session and authentication",
          <>
            <div className="info-box">
              <p><strong>User:</strong> {localStorage.getItem('loggedInUserName')}</p>
              <p><strong>Email:</strong> {localStorage.getItem('userEmail')}</p>
              <p><strong>Status:</strong> Active Session</p>
            </div>

            <button
              className="danger-btn"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Log Out
            </button>
          </>
        );

      default:
        return renderCard(
          "General Settings",
          "Basic system behavior configuration",
          <>
            <div className="toggle-row">
              <div>
                <label>Simulation Mode</label>
                <p className="settings-desc">Run without backend interaction</p>
              </div>

              <input
                type="checkbox"
                checked={isSimulation}
                onChange={() => setIsSimulation(!isSimulation)}
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="settings-container enhanced">

      <aside className="settings-sidebar">
        <div className="sidebar-brand">Jurisynth</div>

        <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')}>
          General
        </button>

        <button className={activeTab === 'ai' ? 'active' : ''} onClick={() => setActiveTab('ai')}>
          AI
        </button>

        <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
          Security
        </button>
      </aside>

      <main className="settings-content">
        <div className="settings-header-nav">
          <h2>Settings</h2>

          <button className="close-btn-top" onClick={handleClose}>
            ×
          </button>
        </div>

        {renderContent()}

        {/* GLOBAL ACTION BAR */}
        <div className="settings-action-bar">
          <div className="left">
            {statusMessage && <span className="status-text">{statusMessage}</span>}
          </div>

          <div className="right">
            <button className="cancel-btn-link" onClick={handleReset}>
              Reset
            </button>

            <button className="save-btn" onClick={handleSaveSettings} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SettingsPage;