import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles.css'; 
import { updateUserSettings } from '../services/api';
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

  const handleClose = () => {
    navigate('/dashboard');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
        const payload = {
            modelPreference: selectedModel,
            analysisDepth: detailLevel,
            simulationMode: isSimulation
        };
        
        await updateUserSettings(payload);
        alert(t("Settings saved successfully!"));
    } catch (err) {
        console.error("Settings Sync Error:", err);
        alert(`${t("Error")}: ${err.message}`);
    } finally {
        setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <div className="settings-section">
            <h3>{t("AI Orchestration")}</h3>

            <div className="form-group">
              <label>{t("Model Selection")}</label>
              <select 
                className="standard-input" 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="Gemini 1.5 Pro">
                  {t("Gemini 1.5 Pro (High Precision)")}
                </option>
                <option value="Gemini 2.5 Flash">
                  {t("Gemini 2.5 Flash (Speed Optimized)")}
                </option>
              </select>
            </div>

            <div className="form-group">
                <label>{t("Analysis Depth")}</label>
                <select 
                    className="standard-input"
                    value={detailLevel}
                    onChange={(e) => setDetailLevel(e.target.value)}
                >
                    <option value="Concise">
                      {t("Concise (Fast Summary)")}
                    </option>
                    <option value="Comprehensive">
                      {t("Comprehensive (Deep Legal Analysis)")}
                    </option>
                </select>
            </div>

            <div className="settings-footer-actions">
                <button className="cancel-btn-link" onClick={handleClose}>
                  {t("Cancel")}
                </button>

                <button className="save-btn" onClick={handleSaveSettings} disabled={loading}>
                  {loading ? t("Saving...") : t("Save AI Configuration")}
                </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <h3>{t("Security & Auth")}</h3>

            <div className="form-group">
              <label>{t("Authentication Token")}</label>
              <code className="token-display">
                {localStorage.getItem('token') 
                  ? t("Active Session (JWT Detected)") 
                  : t("No Token Found")}
              </code>
            </div>

            <button 
              className="danger-btn" 
              onClick={() => {
                localStorage.removeItem('token');
                window.location.reload();
              }}
            >
              {t("Log Out & Revoke Token")}
            </button>
          </div>
        );

      default:
        return (
          <div className="settings-section">
            <h3>{t("General Settings")}</h3>

            <div className="form-group checkbox-group">
              <label>{t("Simulation Mode")}</label>
              <input 
                type="checkbox" 
                checked={isSimulation} 
                onChange={() => setIsSimulation(!isSimulation)} 
              />
              <span className="hint">
                {t("Run UI tests without contacting the live backend.")}
              </span>
            </div>

            <div className="settings-footer-actions">
                <button className="cancel-btn-link" onClick={handleClose}>
                  {t("Cancel")}
                </button>

                <button className="save-btn" onClick={handleSaveSettings} disabled={loading}>
                  {loading ? t("Saving...") : t("Save General Settings")}
                </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="settings-container">

      <aside className="settings-sidebar">
        <div className="sidebar-brand">Jurisynth</div>

        <button 
          className={activeTab === 'general' ? 'active' : ''} 
          onClick={() => setActiveTab('general')}
        >
          {t("General")}
        </button>

        <button 
          className={activeTab === 'ai' ? 'active' : ''} 
          onClick={() => setActiveTab('ai')}
        >
          {t("AI & Search")}
        </button>

        <button 
          className={activeTab === 'security' ? 'active' : ''} 
          onClick={() => setActiveTab('security')}
        >
          {t("Security")}
        </button>
      </aside>

      <main className="settings-content">
        <div className="settings-header-nav">
            <h2>{t("Settings")}</h2>

            <button 
              className="close-btn-top" 
              onClick={handleClose} 
              title={t("Back to Dashboard")}
            >
              &times;
            </button>
        </div>

        {renderContent()}
      </main>

    </div>
  );
};

export default SettingsPage;