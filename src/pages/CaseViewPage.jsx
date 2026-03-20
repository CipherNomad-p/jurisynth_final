import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { FaArrowLeft, FaRobot, FaTimes, FaCheck, FaUpload, FaEye, FaFileAlt } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { translateCase } from '../services/translationService';

const stepsRaw = [
  "Case Created",
  "Registered",
  "Docs Uploaded",
  "Proof Added",
  "Judgement",
  "Case Closed",
];

function CaseViewPage() {
  const { caseId } = useParams();

  const { t, lang } = useLanguage() || {};

  const steps = stepsRaw.map(step => t(step));

  const [caseDetails, setCaseDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [animatedStep, setAnimatedStep] = useState(0);

  // 🔥 NEW TRANSLATION STATES
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [translatedFacts, setTranslatedFacts] = useState(null);
  const [translatedSummary, setTranslatedSummary] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const fileInputRef = useRef(null);

  const userName = localStorage.getItem('loggedInUserName') || 'Guest';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'G';

  // 🔥 LANGUAGE MAP
  const mapLang = (lang) => {
    const map = {
      en: 'eng_Latn',
      hi: 'hin_Deva',
      mr: 'mar_Deva',
      fr: 'fra_Latn',
      es: 'spa_Latn',
      de: 'deu_Latn',
      zh: 'zho_Hans',
      ja: 'jpn_Jpan',
      ko: 'kor_Hang',
      ar: 'arb_Arab'
    };
    return map[lang] || 'eng_Latn';
  };

  const fetchCaseData = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/cases/${caseId}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      setCaseDetails(data);

    } catch (err) {
      console.error(t("Fetch error:"), err);
    } finally {
      setIsLoading(false);
    }
  }, [caseId, t]);

  useEffect(() => {
    fetchCaseData();
  }, [fetchCaseData]);

  // 🔥 AUTO TRANSLATION EFFECT
  useEffect(() => {
    if (!caseDetails) return;

    const targetLang = mapLang(lang);

    if (targetLang === 'eng_Latn') {
      setTranslatedDesc(null);
      setTranslatedFacts(null);
      setTranslatedSummary(null);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);

    Promise.all([
      translateCase([caseDetails.description || ''], targetLang),
      translateCase(caseDetails.keyPoints || [], targetLang),
      translateCase([caseDetails.aiSummary || ''], targetLang)
    ])
      .then(([descRes, factsRes, summaryRes]) => {
        if (cancelled) return;

        setTranslatedDesc(descRes?.translations?.[0]);
        setTranslatedFacts(factsRes?.translations);
        setTranslatedSummary(summaryRes?.translations?.[0]);
      })
      .catch(err => console.error("Translation error:", err))
      .finally(() => {
        if (!cancelled) setIsTranslating(false);
      });

    return () => { cancelled = true; };

  }, [lang, caseDetails]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await fetch(`http://localhost:5000/api/cases/${caseId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      setSelectedFile(null);
      fetchCaseData();

    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateAI = async () => {
    setIsAnalyzing(true);
    try {
      await fetch(`http://localhost:5000/api/summary/${caseId}`, {
        method: 'POST',
        credentials: 'include'
      });

      fetchCaseData();

    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatus = () => {
    if (isAnalyzing) return { label: t('Processing...'), class: 'status-processing' };
    if (caseDetails?.status === 'ready') return { label: t('Analysis Ready'), class: 'status-ready' };
    if (caseDetails?.documents?.length > 0) return { label: t('Pending Analysis'), class: 'status-pending' };
    return { label: t('Awaiting Documents'), class: 'status-new' };
  };

  let targetStep = 0;
  if (caseDetails) targetStep = 1;
  if (caseDetails?.documents?.length > 0) targetStep = 2;
  if (caseDetails?.proofs?.length > 0) targetStep = 3;
  if (caseDetails?.judgement) targetStep = 4;
  if (caseDetails?.status === "closed") targetStep = 5;

  useEffect(() => {
    if (!caseDetails) return;

    let i = 0;

    const interval = setInterval(() => {
      i++;
      setAnimatedStep(i);

      if (i >= targetStep) clearInterval(interval);
    }, 400);

    return () => clearInterval(interval);
  }, [caseDetails, targetStep]);

  if (isLoading || !caseDetails) return (
    <DashboardLayout userName={userName} userInitials={userInitials}>
      <div>{t('Loading...')}</div>
    </DashboardLayout>
  );

  const status = getStatus();

  return (
    <DashboardLayout userName={userName} userInitials={userInitials}>
      <div className="case-view-container">

        <div className="case-view-header">
          <Link to="/dashboard" className="back-link">
            <FaArrowLeft /> {t('Back to Dashboard')}
          </Link>

          <div className="header-split">
            <div className="header-title">
              <div className="title-row">
                <h1>{caseDetails.title}</h1>
                <span className={`status-badge ${status.class}`}>{status.label}</span>
              </div>
              <span className="case-number-badge">
                {t('Case')} #{caseDetails.caseNumber}
              </span>
            </div>

            {caseDetails.documents?.length > 0 && (
              <button 
                className={`generate-ai-btn ${isAnalyzing ? 'pulse' : ''}`} 
                onClick={handleGenerateAI} 
                disabled={isAnalyzing}
              >
                <FaRobot /> {isAnalyzing ? t('Analyzing...') : t('Generate AI Insights')}
              </button>
            )}
          </div>
        </div>

        <div className="case-view-grid">
          <div className="main-content-area">

            <div className="case-card">
              <h3>{t('Case Timeline')}</h3>
              {steps.map((step, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "25px" }}>
                  <div style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: index <= animatedStep ? "#00d4ff" : "#374151",
                    boxShadow: index === animatedStep ? "0 0 18px #00d4ff" : "none",
                    marginRight: "15px",
                    transition: "all 0.4s ease"
                  }} />
                  <span style={{
                    fontSize: "15px",
                    color: index <= animatedStep ? "#fff" : "#9ca3af",
                    fontWeight: index <= animatedStep ? "600" : "400"
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <div className="case-card">
              <h3>{t('Case Description')}</h3>
              <p>
                {isTranslating
                  ? t('Translating...')
                  : translatedDesc || caseDetails.description || t('No description provided.')}
              </p>
            </div>

            <div className="case-card">
              <h3>{t('Key Facts (AI Generated)')}</h3>
              {isAnalyzing ? (
                <div className="skeleton-loader">{t('AI is scanning documents...')}</div>
              ) : (
                <ul className="points-list">
                  {(translatedFacts || caseDetails.keyPoints || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="case-card">
              <h3>{t('AI Legal Analysis')}</h3>
              <p className="analysis-text">
                {isAnalyzing
                  ? t('Analyzing...')
                  : isTranslating
                  ? t('Translating...')
                  : translatedSummary || caseDetails.aiSummary || t('Pending analysis...')}
              </p>
            </div>

          </div>

          <div className="sidebar-area">
            <div className="case-card">
              <h3>{t('Documents & Evidence')}</h3>

              <div className="uploaded-docs-list">
                {caseDetails.documents?.map((doc, idx) => (
                  <div key={idx} className="doc-list-item">
                    <div className="doc-info">
                      <FaFileAlt className="doc-icon" />
                      <span>{doc.fileName || doc.filename}</span>
                    </div>
                    <a 
                      href={`http://localhost:5000/${(doc.filePath || doc.path)?.replace(/\\/g, '/')}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-btn"
                    >
                      <FaEye /> {t('View')}
                    </a>
                  </div>
                ))}
              </div>

              <hr className="divider" />

              {!selectedFile ? (
                <button className="select-file-btn" onClick={() => fileInputRef.current.click()}>
                  <FaUpload /> {t('Add Document')}
                </button>
              ) : (
                <div className="upload-confirmation-ui">
                  <p className="file-preview">📄 {selectedFile.name}</p>
                  <div className="confirmation-actions">
                    <button className="confirm-btn" onClick={handleUploadSubmit} disabled={isUploading}>
                      <FaCheck /> {isUploading ? t('Uploading...') : t('Confirm')}
                    </button>
                    <button className="cancel-btn" onClick={() => setSelectedFile(null)}>
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileChange} 
                accept=".pdf,.docx,.txt" 
              />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default CaseViewPage;