import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { 
  FaPlus, FaFileUpload, FaMicrophoneAlt, 
  FaCheckCircle, FaExclamationTriangle, FaArchive, FaTimes, FaTrash 
} from 'react-icons/fa';
import { MdOutlineSummarize } from 'react-icons/md';

// ADDED
import LanguageSwitcher from '../LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import AudioTranscriber from '../shared/AudioTranscriber';
import DocumentList from '../shared/DocumentList';

const attentionItemsStatic = [
  {
    id: 1,
    type: 'contradiction',
    icon: <FaExclamationTriangle />,
    text: "Contradiction found in 'ABC v. XYZ Corp'",
    actionText: 'Review Now',
    link: '/case/2025-081'
  },
  {
    id: 2,
    type: 'summary',
    icon: <FaExclamationTriangle />,
    text: "Summary ready for 'Johnson Property Dispute'",
    actionText: 'View Summary',
    link: '/case/2025-079'
  }
];

function Dashboard() {

  const language = useLanguage();
  const t = language?.t || ((key) => key);

  const [currentUser, setCurrentUser] = useState({ name: 'Guest', initials: 'G' });
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    caseNumber: '',
    description: ''
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let savedName = localStorage.getItem('loggedInUserName');
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!savedName || savedName === "undefined" || savedName === "null") {
      savedName = "Guest";
    }

    if (savedName) {
      const initials = savedName.split(' ').map(n => n[0]).join('').toUpperCase();
      setCurrentUser({ name: savedName, initials: initials });
    }

    const fetchCases = async () => {
      try {
        const response = await fetch('http://65.0.240.171:5000/api/cases', {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || t('Failed to fetch cases from server'));
        }

        const safeCases = Array.isArray(data)
          ? data
          : data.cases || data.data || [];

        setCases(safeCases);

      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [navigate, t]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('http://65.0.240.171:5000/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('Failed to create case'));
      }

      setCases((prev) => [data, ...(Array.isArray(prev) ? prev : [])]);

      setIsModalOpen(false);
      setFormData({ title: '', caseNumber: '', description: '' });

    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCase = async (caseId) => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t('Failed to delete case'));
      }

      setCases(prev => prev.filter(c => c._id !== caseId));
      setDeleteConfirmId(null);

    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStageDisplay = (stage) => {
    switch (stage) {
      case 'created':
        return { text: t('Created'), icon: <MdOutlineSummarize />, cssClass: 'processing' };
      case 'documents_uploaded':
        return { text: t('Docs Uploaded'), icon: <FaFileUpload />, cssClass: 'processing' };
      case 'under_review':
        return { text: t('Under Review'), icon: <MdOutlineSummarize />, cssClass: 'processing' };
      case 'ai_processed':
        return { text: t('AI Processed'), icon: <FaCheckCircle />, cssClass: 'ready' };
      case 'ready':
        return { text: t('Ready'), icon: <FaCheckCircle />, cssClass: 'ready' };
      case 'closed':
        return { text: t('Closed'), icon: <FaArchive />, cssClass: 'closed' };
      default:
        return { text: t('Processing'), icon: <MdOutlineSummarize />, cssClass: 'processing' };
    }
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'ready':
        return { text: t('Ready'), icon: <FaCheckCircle />, cssClass: 'ready' };
      case 'closed':
        return { text: t('Closed'), icon: <FaArchive />, cssClass: 'closed' };
      default:
        return { text: t('Processing'), icon: <MdOutlineSummarize />, cssClass: 'processing' };
    }
  };

  const sortedCases = [...cases].sort((a, b) => {
    const aTime = a.timeline?.length
      ? new Date(a.timeline[a.timeline.length - 1].createdAt)
      : new Date(a.createdAt);

    const bTime = b.timeline?.length
      ? new Date(b.timeline[b.timeline.length - 1].createdAt)
      : new Date(b.createdAt);

    return bTime - aTime;
  });

  const dynamicAttention = sortedCases
    .filter(c => c.stage === "documents_uploaded" || c.stage === "ai_processed")
    .slice(0, 2)
    .map((c, index) => ({
      id: index,
      type: 'warning',
      icon: <FaExclamationTriangle />,
      text:
        c.stage === "documents_uploaded"
          ? t('Documents uploaded for') + ` "${c.title}"`
          : t('AI summary ready for') + ` "${c.title}"`,
      actionText: t('View Case'),
      link: `/case/${c._id}`
    }));

  const finalAttentionItems = dynamicAttention.length > 0 ? dynamicAttention : attentionItemsStatic;
  const allDocuments = cases.flatMap((caseItem) =>
    (caseItem.documents || []).map((doc, index) => ({
      ...doc,
      caseId: caseItem._id,
      caseTitle: caseItem.title,
      _docKey: `${caseItem._id}-${index}`
    }))
  );

  return (
    <DashboardLayout userName={currentUser.name} userInitials={currentUser.initials}>

      <LanguageSwitcher />

      <div className="dashboard-header">
        <h1>{t('Welcome back')}, {currentUser.name}!</h1>
      </div>

      <section className="dashboard-section">
        <h2>{t('Quick Actions')}</h2>
        <div className="quick-actions-grid">

          <button className="action-card" onClick={() => navigate('/createcase')}>
            <span className="action-icon"><FaPlus /></span>
            {t('Create New Case')}
          </button>

          <button className="action-card" onClick={() => navigate('/all-cases')}>
            <span className="action-icon"><FaFileUpload /></span>
            {t('Upload Document')}
          </button>

          <button className="action-card" onClick={() => navigate('/transcribe')}>
            <span className="action-icon"><FaMicrophoneAlt /></span>
            {t('Transcribe Audio')}
          </button>

        </div>
      </section>

      <section className="dashboard-section">
        <h2>{t('Recent Cases')}</h2>
        
        {isLoading && <p style={{ color: 'var(--text-secondary)' }}>{t('Loading your cases...')}</p>}
        
        {error && (
          <div style={{ color: '#F87171', background: 'rgba(248, 113, 113, 0.1)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
            <strong>{t('Error')}:</strong> {error}
          </div>
        )}

        {!isLoading && !error && cases.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t("You don't have any cases yet.")}</p>
            <button className="btn btn-primary btn-small" onClick={() => setIsModalOpen(true)}>
              {t('Create Your First Case')}
            </button>
          </div>
        )}

        {!isLoading && !error && cases.length > 0 && (
          <div className="case-grid">
            {sortedCases.slice(0, 3).map((caseItem) => {

              const statusDisplay = caseItem.stage
                ? getStageDisplay(caseItem.stage)
                : getStatusDisplay(caseItem.status);

              const latestEvent = caseItem.timeline?.length
                ? caseItem.timeline[caseItem.timeline.length - 1]
                : null;

              return (
                <div className="case-card" key={caseItem._id}>
                  <h4>{caseItem.title}</h4>
                  <p>{t('Case')} #{caseItem.caseNumber}</p>
                  
                  <span className={`case-status ${statusDisplay.cssClass}`}>
                    {statusDisplay.icon} {statusDisplay.text}
                  </span>
                  
                  <p className="case-activity">
                    {latestEvent
                      ? latestEvent.message
                      : `${t('Created')}: ${new Date(caseItem.createdAt).toLocaleDateString()}`}
                  </p>

                  {latestEvent && (
                    <p style={{ fontSize: "12px", color: "gray" }}>
                      {new Date(latestEvent.createdAt).toLocaleString()}
                    </p>
                  )}

                  <Link to={`/case/${caseItem._id}`} className="btn btn-secondary btn-small">
                    {t('View Details')}
                  </Link>

                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => setDeleteConfirmId(caseItem._id)}
                  >
                    <FaTrash /> {t('Delete')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <h2>{t('Attention Required')}</h2>
        <div className="attention-widget">
          {finalAttentionItems.map(item => (
            <div key={item.id} className={`attention-item ${item.type}`}>
              <div className="attention-icon">
                {item.icon}
              </div>
              <div className="attention-text">
                {item.text}
              </div>
              <Link to={item.link} className="btn btn-secondary btn-small">
                {t(item.actionText)}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Priority Documents</h2>
        <div className="case-card">
          <DocumentList documents={allDocuments.slice(0, 8)} emptyText="No documents uploaded" />
        </div>
      </section>

      <section className="dashboard-section">
        <AudioTranscriber />
      </section>

      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px' }}>
            <h3>{t('Delete Case?')}</h3>
            <button onClick={() => handleDeleteCase(deleteConfirmId)}>
              {isDeleting ? t('Deleting...') : t('Confirm')}
            </button>
            <button onClick={() => setDeleteConfirmId(null)}>{t('Cancel')}</button>
            {deleteError && <p>{deleteError}</p>}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default Dashboard;
