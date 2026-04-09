import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import {
  FaArrowLeft,
  FaRobot,
  FaTimes,
  FaCheck,
  FaUpload,
  FaSpinner,
  FaFolderOpen,
  FaBalanceScale,
  FaGavel,
  FaArchive,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { translateCase } from '../services/translationService';
import DocumentList from '../components/shared/DocumentList';
import UploadBox from '../components/shared/UploadBox';

const workflowSteps = [
  { key: 'created', label: 'Case Created', icon: FaCheck },
  { key: 'awaiting_documents', label: 'Awaiting Documents', icon: FaFolderOpen },
  { key: 'documents_uploaded', label: 'Files Uploaded', icon: FaUpload },
  { key: 'under_review', label: 'Under Review', icon: FaBalanceScale },
  { key: 'analysis_ready', label: 'Analysis Ready', icon: FaRobot },
  { key: 'judgement_added', label: 'Hearing', icon: FaGavel },
  { key: 'closed', label: 'Case Closed', icon: FaArchive },
];

const RECYCLE_BIN_STORAGE_KEY = 'jurisynthRecycleBin';
const CASE_CLIENT_LINKS_STORAGE_KEY = 'jurisynthCaseClientLinks';

function CaseViewPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();

  const { t, lang } = useLanguage() || {};

  const steps = workflowSteps.map(step => ({ ...step, label: t(step.label) }));

  const [caseDetails, setCaseDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedEvidenceFile, setSelectedEvidenceFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [evidenceError, setEvidenceError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [evidenceSuccess, setEvidenceSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [judgementText, setJudgementText] = useState('');
  const [judgementError, setJudgementError] = useState('');
  const [judgementSuccess, setJudgementSuccess] = useState('');
  const [isSubmittingJudgement, setIsSubmittingJudgement] = useState(false);
  const [isCreatingNewHearing, setIsCreatingNewHearing] = useState(false);
  const [closeCaseError, setCloseCaseError] = useState('');
  const [closeCaseSuccess, setCloseCaseSuccess] = useState('');
  const [isClosingCase, setIsClosingCase] = useState(false);
  const [sessionRole, setSessionRole] = useState(localStorage.getItem('userRole') || 'user');
  const [clientCode, setClientCode] = useState(''); // added by cipherNomad
  const [verifiedClient, setVerifiedClient] = useState(null); // added by cipherNomad
  const [isVerifyingClient, setIsVerifyingClient] = useState(false); // added by cipherNomad
  const [clientAccessError, setClientAccessError] = useState('');
  const [clientAccessSuccess, setClientAccessSuccess] = useState('');
  const [isAssigningClient, setIsAssigningClient] = useState(false);

  // 🔥 NEW TRANSLATION STATES
  const [translatedDesc, setTranslatedDesc] = useState(null);
  const [translatedFacts, setTranslatedFacts] = useState(null);
  const [translatedSummary, setTranslatedSummary] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const evidenceInputRef = useRef(null);

  const getDocumentName = (doc) => doc?.fileName || doc?.filename || '';
  const canSummarizeDocument = (doc) => /\.(pdf|docx|txt)$/i.test(getDocumentName(doc));

  const persistDeletedFile = useCallback((source, fileName, fileData = {}) => {
    try {
      const storedItems = JSON.parse(localStorage.getItem(RECYCLE_BIN_STORAGE_KEY) || '[]');
      const deletedAt = new Date().toISOString();
      const nextItems = [
        ...storedItems.filter(
          (item) =>
            !(
              item.caseId === caseId &&
              item.source === source &&
              (item.fileName || item.filename) === fileName
            )
        ),
        {
          caseId,
          caseTitle: caseDetails?.title || '',
          caseNumber: caseDetails?.caseNumber || '',
          source,
          filename: fileData.filename || fileData.fileName || fileName,
          fileName: fileData.fileName || fileData.filename || fileName,
          path: fileData.path || '',
          fileUrl: fileData.fileUrl || '',
          deletedAt
        }
      ];

      localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(nextItems));
      return deletedAt;
    } catch (error) {
      console.error('Failed to persist recycle bin item:', error);
      return new Date().toISOString();
    }
  }, [caseDetails?.caseNumber, caseDetails?.title, caseId]);

  const persistClientCaseLink = useCallback((identifier) => {
    try {
      const storedLinks = JSON.parse(localStorage.getItem(CASE_CLIENT_LINKS_STORAGE_KEY) || '[]');
      const normalizedIdentifier = identifier.trim().toLowerCase();
      const nextLinks = [
        ...storedLinks.filter(
          (item) => !(item.caseId === caseId && item.clientIdentifier === normalizedIdentifier)
        ),
        {
          caseId,
          caseTitle: caseDetails?.title || '',
          caseNumber: caseDetails?.caseNumber || '',
          clientIdentifier: normalizedIdentifier
        }
      ];
      localStorage.setItem(CASE_CLIENT_LINKS_STORAGE_KEY, JSON.stringify(nextLinks));
    } catch (error) {
      console.error('Failed to persist client case link:', error);
    }
  }, [caseDetails?.caseNumber, caseDetails?.title, caseId]);

  const userName = localStorage.getItem('loggedInUserName') || 'Guest';
  const storedUserRole = localStorage.getItem('userRole') || 'user';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'G';
  const effectiveUserRole = sessionRole || caseDetails?.currentUserRole || storedUserRole;
  const isAdvocate = effectiveUserRole === 'advocate';
  const canEditJudgement = isAdvocate;

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
      const response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}`, {
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

  useEffect(() => {
    const syncSessionRole = async () => {
      try {
        const response = await fetch('http://65.0.240.171:5000/api/protected', {
          method: 'GET',
          credentials: 'include'
        });

        const data = await response.json().catch(() => ({}));
        const backendRole = data?.user?.role;

        if (!response.ok || !backendRole) {
          return;
        }

        setSessionRole(backendRole);

        if (storedUserRole !== backendRole) {
          localStorage.setItem('userRole', backendRole);
          localStorage.removeItem('loggedInUserName');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
          localStorage.removeItem('isAuthenticated');
          navigate('/auth');
        }
      } catch (error) {
        console.error('Failed to sync session role:', error);
      }
    };

    syncSessionRole();
  }, [navigate, storedUserRole]);

  useEffect(() => {
    if (!caseDetails) return;

    const existingHearings = caseDetails.hearings || [];

    if (isCreatingNewHearing) {
      setJudgementText('');
      return;
    }

    const latestHearing = existingHearings[existingHearings.length - 1];
    if (latestHearing?.notes) {
      setJudgementText(latestHearing.notes);
    } else if (caseDetails?.judgement) {
      setJudgementText(caseDetails.judgement);
    }
  }, [caseDetails, isCreatingNewHearing]);

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
    setSelectedFiles(Array.from(e.target.files || []));
  };

  const handleEvidenceFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedEvidenceFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || t('Failed to upload document.'));
      }

      const data = await response.json();
      setSelectedFiles([]);
      setCaseDetails(data);
      setUploadSuccess(t('Document uploaded successfully.'));

    } catch (err) {
      console.error(err);
      setUploadError(err.message || t('Failed to upload document.'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentPriorityChange = async (documentItem, priority) => {
    try {
      const targetName = documentItem.name || documentItem.fileName || documentItem.filename;
      const nextDocuments = (caseDetails.documents || []).map((item) => {
        const currentName = item.name || item.fileName || item.filename;
        return currentName === targetName ? { ...item, priority } : item;
      });

      const response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents: nextDocuments })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || 'Failed to update document priority.');
      }

      setCaseDetails(data);
    } catch (error) {
      console.error(error);
      setUploadError(error.message || 'Failed to update document priority.');
    }
  };

  const handleGenerateAI = async () => {
    setIsAnalyzing(true);
    setSummaryError('');
    try {
      const response = await fetch(`http://65.0.240.171:5000/api/summary/${caseId}`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || t('Failed to generate AI summary.'));
      }

      fetchCaseData();

    } catch (err) {
      console.error(err);
      setSummaryError(err.message || t('Failed to generate AI summary.'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEvidenceUploadSubmit = async () => {
    if (!selectedEvidenceFile) return;
    setIsUploadingEvidence(true);
    setEvidenceError('');
    setEvidenceSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedEvidenceFile);

      const uploadResponse = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json().catch(() => ({}));
        throw new Error(data?.message || t('Failed to upload evidence.'));
      }

      const uploadedCase = await uploadResponse.json();
      const uploadedDocuments = [...(uploadedCase?.documents || [])];
      const latestUploadedDocIndex = uploadedDocuments.findIndex(
        (doc) => (doc.fileName || doc.filename) === selectedEvidenceFile.name
      );
      const resolvedIndex = latestUploadedDocIndex === -1
        ? uploadedDocuments.length - 1
        : latestUploadedDocIndex;
      const uploadedFile = uploadedDocuments[resolvedIndex];

      if (!uploadedFile) {
        throw new Error(t('Uploaded evidence file could not be resolved.'));
      }

      uploadedDocuments.splice(resolvedIndex, 1);

      const updateResponse = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents: uploadedDocuments,
          evidence: [...(uploadedCase?.evidence || []), uploadedFile],
          timeline: [
            ...(uploadedCase?.timeline || []),
            {
              type: 'proof_added',
              message: `Proof added: ${uploadedFile.fileName || uploadedFile.filename || selectedEvidenceFile.name}`,
              createdAt: new Date().toISOString()
            }
          ],
          status: 'processing'
        })
      });

      if (!updateResponse.ok) {
        const data = await updateResponse.json().catch(() => ({}));
        throw new Error(data?.message || t('Failed to finalize evidence upload.'));
      }

      const data = await updateResponse.json();
      setSelectedEvidenceFile(null);
      setCaseDetails(data);
      setEvidenceSuccess(t('Evidence uploaded successfully.'));
    } catch (err) {
      console.error(err);
      setEvidenceError(err.message || t('Failed to upload evidence.'));
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const handleDeleteFile = async (source, fileName) => {
    setDeleteError('');
    try {
      const existingFiles = [...(caseDetails?.[source] || [])];
      const fileIndex = existingFiles.findIndex(
        (file) => (file.fileName || file.filename) === fileName
      );
      const targetFile = fileIndex >= 0 ? existingFiles[fileIndex] : null;

      let response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}/files/delete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ source, fileName })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (fileIndex === -1) {
          throw new Error(data?.message || t('File not found.'));
        }

        const [removedFile] = existingFiles.splice(fileIndex, 1);
        const deletedAt = persistDeletedFile(source, fileName, removedFile);
        const recycleBin = [
          ...(caseDetails?.recycleBin || []),
          {
            filename: removedFile.filename || removedFile.fileName || fileName,
            fileName: removedFile.fileName || removedFile.filename || fileName,
            path: removedFile.path || '',
            fileUrl: removedFile.fileUrl || '',
            source,
            deletedAt
          }
        ];

        const timeline = [
          ...(caseDetails?.timeline || []),
          {
            type: 'file_deleted',
            message: `${source === 'documents' ? 'Document' : 'Evidence'} deleted: ${fileName}`,
            createdAt: new Date().toISOString()
          }
        ];

        response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            [source]: existingFiles,
            recycleBin,
            timeline
          })
        });

        const fallbackData = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(fallbackData?.message || data?.message || t('Failed to delete file.'));
        }

        setCaseDetails(fallbackData);
        if (source === 'documents') {
          setUploadSuccess(t('Document moved to recycle bin.'));
        } else {
          setEvidenceSuccess(t('Evidence moved to recycle bin.'));
        }
        return;
      }

      if (targetFile) {
        persistDeletedFile(source, fileName, targetFile);
      }
      setCaseDetails(data);
      if (source === 'documents') {
        setUploadSuccess(t('Document moved to recycle bin.'));
      } else {
        setEvidenceSuccess(t('Evidence moved to recycle bin.'));
      }
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || t('Failed to delete file.'));
    }
  };

  const handleSubmitJudgement = async () => {
    if (!judgementText.trim()) {
      setJudgementError(t('Judgement text is required.'));
      return;
    }

    setIsSubmittingJudgement(true);
    setJudgementError('');
    setJudgementSuccess('');

    try {
      const response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}/judgement`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ judgement: judgementText.trim() })
      });

      const rawText = await response.text().catch(() => '');
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        data = { message: rawText };
      }

      if (!response.ok) {
        throw new Error(data?.message || t('Failed to save judgement.'));
      }

      setCaseDetails(data);
      setIsCreatingNewHearing(false);
      setJudgementSuccess(t('Judgement saved successfully.'));
    } catch (err) {
      console.error(err);
      setJudgementError(err.message || t('Failed to save judgement.'));
    } finally {
      setIsSubmittingJudgement(false);
    }
  };

  const handleCloseCase = async () => {
    setCloseCaseError('');
    setCloseCaseSuccess('');

    try {
      setIsClosingCase(true);
      const response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}/close`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || t('Failed to close case.'));
      }

      setCaseDetails(data);
      setCloseCaseSuccess(t('Case closed successfully.'));
    } catch (err) {
      console.error(err);
      setCloseCaseError(err.message || t('Failed to close case.'));
    } finally {
      setIsClosingCase(false);
    }
  };

  const handleAssignClient = async () => {
    if (!verifiedClient?._id) { // added by cipherNomad
      setClientAccessError(t('Verify client code before linking.')); // added by cipherNomad
      return;
    }

    setIsAssigningClient(true);
    setClientAccessError('');
    setClientAccessSuccess('');

    try {
      let response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}/clients`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ // added by cipherNomad
          clientId: verifiedClient._id, // added by cipherNomad
          clientCode: verifiedClient.clientCode, // added by cipherNomad
          clientIdentifier: verifiedClient.email || verifiedClient.name // added by cipherNomad
        }) // added by cipherNomad
      });

      const data = await response.json().catch(async () => {
        const rawText = await response.text().catch(() => '');
        return { message: rawText };
      });

      if (!response.ok) { // added by cipherNomad
        throw new Error(data?.message || t('Failed to link client to case.')); // added by cipherNomad
      }

      setCaseDetails(data);
      setClientCode(''); // added by cipherNomad
      setVerifiedClient(null); // added by cipherNomad
      persistClientCaseLink((verifiedClient.email || verifiedClient.name || '').trim()); // added by cipherNomad
      setClientAccessSuccess(t('Client linked to this case successfully.'));
    } catch (err) {
      console.error(err);
      setClientAccessError(err.message || t('Failed to link client to case.'));
    } finally {
      setIsAssigningClient(false);
    }
  };

  const handleVerifyClientCode = async () => { // added by cipherNomad
    if (!clientCode.trim()) { // added by cipherNomad
      setClientAccessError(t('Client code, email, or name is required.')); // added by cipherNomad
      return; // added by cipherNomad
    } // added by cipherNomad
    setIsVerifyingClient(true); // added by cipherNomad
    setClientAccessError(''); // added by cipherNomad
    setClientAccessSuccess(''); // added by cipherNomad
    setVerifiedClient(null); // added by cipherNomad
    try { // added by cipherNomad
      const response = await fetch(`http://65.0.240.171:5000/api/auth/clients/verify?identifier=${encodeURIComponent(clientCode.trim())}`, { // added by cipherNomad
        method: 'GET', // added by cipherNomad
        credentials: 'include' // added by cipherNomad
      }); // added by cipherNomad
      const data = await response.json().catch(() => ({})); // added by cipherNomad
      if (!response.ok) { // added by cipherNomad
        throw new Error(data?.message || t('Client not found for this code, email, or name.')); // added by cipherNomad
      } // added by cipherNomad
      setVerifiedClient(data); // added by cipherNomad
      setClientAccessSuccess(t('Client verified successfully.')); // added by cipherNomad
    } catch (err) { // added by cipherNomad
      setClientAccessError(err.message || t('Client verification failed.')); // added by cipherNomad
    } finally { // added by cipherNomad
      setIsVerifyingClient(false); // added by cipherNomad
    } // added by cipherNomad
  }; // added by cipherNomad

  const getLatestTimelineEvent = (type) =>
    caseDetails?.timeline?.some((entry) => entry.type === type);

  const getHearingCount = () =>
    (caseDetails?.timeline || []).filter((entry) => entry?.type === 'judgement_added').length;

  const formatTimelineMessage = (entry) => {
    if (!entry) return t('Case updated');

    switch (entry.type) {
      case 'document_uploaded':
        return entry.message || t('Document uploaded');
      case 'evidence_uploaded':
        return entry.message || t('Evidence uploaded');
      case 'proof_added':
        return entry.message || t('Proof added');
      case 'ai_generated':
        return t('AI summary generated');
      case 'judgement_added':
        return `${t('Hearing')} ${Math.max(1, getHearingCount())}`;
      case 'case_closed':
        return t('Case closed');
      default:
        return entry.message || t('Case updated');
    }
  };

  const getCaseProgress = () => {
    const hasDocuments = (caseDetails?.documents?.length || 0) > 0;
    const hasEvidence = (caseDetails?.evidence?.length || 0) > 0;
    const hasSupportingFiles = hasDocuments || hasEvidence;
    const hasAiSummary = Boolean(caseDetails?.aiSummary?.trim());
    const hasKeyPoints = (caseDetails?.keyPoints?.length || 0) > 0;
    const hearingCount = getHearingCount();
    const hasJudgement = hearingCount > 0;
    const isClosed = caseDetails?.status === 'closed' || caseDetails?.stage === 'closed';
    const hasReadyStatus = caseDetails?.status === 'ready' || caseDetails?.stage === 'ready';
    const hasAiGenerated = getLatestTimelineEvent('ai_generated');
    const hasProof = getLatestTimelineEvent('proof_added');

    if (isAnalyzing) {
      return {
        key: 'under_review',
        label: t('Analyzing'),
        description: t('AI is currently scanning the latest case material.'),
        className: 'status-review',
        tone: 'review'
      };
    }

    if (isClosed) {
      return {
        key: 'closed',
        label: t('Closed'),
        description: t('This case has been marked closed.'),
        className: 'status-closed',
        tone: 'closed'
      };
    }

    if (hasJudgement) {
      return {
        key: 'judgement_added',
        label: `${t('Hearing')} ${hearingCount}`,
        description: `${t('Hearing')} ${hearingCount} ${t('has been recorded for this case.')}`,
        className: 'status-judgement',
        tone: 'judgement'
      };
    }

    if (hasReadyStatus || hasAiSummary || hasKeyPoints || hasAiGenerated) {
      return {
        key: 'analysis_ready',
        label: t('Analysis Ready'),
        description: t('AI summary and legal points are available for review.'),
        className: 'status-ready',
        tone: 'ready'
      };
    }

    if (hasSupportingFiles && hasProof) {
      return {
        key: 'under_review',
        label: t('Under Review'),
        description: t('Documents and proof notes are in review before final analysis.'),
        className: 'status-review',
        tone: 'review'
      };
    }

    if (hasSupportingFiles) {
      return {
        key: 'documents_uploaded',
        label: t('Files Uploaded'),
        description: t('Documents or evidence files are available and waiting for analysis.'),
        className: 'status-uploaded',
        tone: 'uploaded'
      };
    }

    return {
      key: 'awaiting_documents',
      label: t('Awaiting Documents'),
      description: t('Upload supporting files to move this case into review.'),
      className: 'status-awaiting',
      tone: 'awaiting'
    };
  };

  const status = getCaseProgress();
  const getWorkflowStepState = (stepKey) => { // added by cipherNomad
    const hasDocuments = (caseDetails?.documents?.length || 0) > 0; // added by cipherNomad
    const hasEvidence = (caseDetails?.evidence?.length || 0) > 0; // added by cipherNomad
    const hasSupportingFiles = hasDocuments || hasEvidence; // added by cipherNomad
    const hasAiSummary = Boolean(caseDetails?.aiSummary?.trim()); // added by cipherNomad
    const hasKeyPoints = (caseDetails?.keyPoints?.length || 0) > 0; // added by cipherNomad
    const hearingCount = getHearingCount(); // added by cipherNomad
    const hasJudgement = hearingCount > 0; // added by cipherNomad
    const isClosed = caseDetails?.status === 'closed' || caseDetails?.stage === 'closed'; // added by cipherNomad
    const hasAiGenerated = getLatestTimelineEvent('ai_generated'); // added by cipherNomad
    const hasProof = getLatestTimelineEvent('proof_added'); // added by cipherNomad
    const hasReadyStatus = caseDetails?.status === 'ready' || caseDetails?.stage === 'ready'; // added by cipherNomad

    const completionMap = { // added by cipherNomad
      created: true, // added by cipherNomad
      awaiting_documents: hasSupportingFiles, // added by cipherNomad
      documents_uploaded: hasSupportingFiles, // added by cipherNomad
      under_review: hasSupportingFiles && hasProof, // added by cipherNomad
      analysis_ready: hasReadyStatus || hasAiSummary || hasKeyPoints || hasAiGenerated, // added by cipherNomad
      judgement_added: hasJudgement, // added by cipherNomad
      closed: isClosed // added by cipherNomad
    }; // added by cipherNomad

    if (completionMap[stepKey]) return 'done'; // added by cipherNomad
    if (stepKey === status.key) return 'active'; // added by cipherNomad

    if (stepKey === 'awaiting_documents' && !hasSupportingFiles) return 'attention'; // added by cipherNomad
    if (stepKey === 'documents_uploaded' && !hasSupportingFiles) return 'attention'; // added by cipherNomad
    if (stepKey === 'under_review' && hasSupportingFiles && !hasProof) return 'attention'; // added by cipherNomad
    if (stepKey === 'analysis_ready' && hasSupportingFiles && !hasAiSummary && !hasKeyPoints && !hasAiGenerated && !hasReadyStatus) return 'attention'; // added by cipherNomad

    return 'upcoming'; // added by cipherNomad
  }; // added by cipherNomad
  const visibleJudgement = caseDetails?.judgement?.trim() || '';
  const hearings = caseDetails?.hearings || [];
  const canAddHearing = canEditJudgement;
  const currentHearingNumber = hearings.length > 0 ? hearings.length : Math.max(1, getHearingCount());
  const activeHearingNumber = isCreatingNewHearing ? currentHearingNumber + 1 : currentHearingNumber;
  const hearingLabel = `${t('Hearing')} ${activeHearingNumber}`;
  const hasSummarizableDocuments = [
    ...(caseDetails?.documents || []),
    ...(caseDetails?.evidence || [])
  ].some(canSummarizeDocument);

  if (isLoading || !caseDetails) return (
    <DashboardLayout userName={userName} userInitials={userInitials}>
      <div>{t('Loading...')}</div>
    </DashboardLayout>
  );

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
                <span className={`status-badge ${status.className}`}>{status.label}</span>
              </div>
              <span className="case-number-badge">
                {t('Case')} #{caseDetails.caseNumber}
              </span>
            </div>

            {((caseDetails.documents?.length || 0) > 0 || (caseDetails.evidence?.length || 0) > 0) && (
              <button
                className={`generate-ai-btn ${isAnalyzing ? 'pulse' : ''}`}
                onClick={handleGenerateAI}
                disabled={isAnalyzing || !hasSummarizableDocuments}
                title={hasSummarizableDocuments ? '' : t('AI summary currently supports PDF, DOCX, and TXT files only.')}
              >
                <FaRobot /> {isAnalyzing ? t('Analyzing...') : t('Generate AI Insights')}
              </button>
            )}
          </div>
        </div>

        <div className="case-view-grid">
          <div className="main-content-area">
            <div className={`case-card case-status-panel case-status-panel-${status.tone}`}>
              <div className="status-panel-head">
                <div>
                  <p className="status-panel-label">{t('Current Status')}</p>
                  <h3>{status.label}</h3>
                </div>
                <span className={`status-badge ${status.className}`}>{status.label}</span>
              </div>
              {closeCaseSuccess && (
                <div className="upload-success-banner status-panel-feedback">{closeCaseSuccess}</div>
              )}
              {closeCaseError && (
                <div className="summary-error-banner status-panel-feedback">{closeCaseError}</div>
              )}
              <p className="status-panel-description">{status.description}</p>
              {isAdvocate && status.key !== 'closed' && (
                <div className="status-panel-actions">
                  <button
                    type="button"
                    className="close-case-btn"
                    onClick={handleCloseCase}
                    disabled={isClosingCase}
                  >
                    <FaArchive /> {isClosingCase ? t('Closing...') : t('Close Case')}
                  </button>
                </div>
              )}
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
                  {!(translatedFacts || caseDetails.keyPoints || []).length && (
                    <li>{t('No AI-generated key facts yet.')}</li>
                  )}
                </ul>
              )}
            </div>

            <div className="case-card">
              <h3>{t('AI Legal Analysis')}</h3>
              {summaryError && (
                <div className="summary-error-banner">{summaryError}</div>
              )}
              <p className="analysis-text">
                {isAnalyzing
                  ? (
                    <span className="analysis-inline-status">
                      <FaSpinner className="spin-icon" />
                      {t('Analyzing...')}
                    </span>
                  )
                  : isTranslating
                  ? t('Translating...')
                  : translatedSummary || caseDetails.aiSummary || t('Pending analysis...')}
              </p>
            </div>

            {(canEditJudgement || hearings.length > 0 || visibleJudgement) && (
              <div className="case-card">
                <div className="judgement-card-head">
                  <h3>{t('Hearing Notes')}</h3>
                  {(hearings.length > 0 || visibleJudgement) && (
                    <span className="status-badge status-judgement">{hearingLabel}</span>
                  )}
                </div>

                {judgementSuccess && (
                  <div className="upload-success-banner">{judgementSuccess}</div>
                )}
                {judgementError && (
                  <div className="summary-error-banner">{judgementError}</div>
                )}

                {(hearings.length > 0 ? hearings : visibleJudgement ? [{
                  number: currentHearingNumber,
                  notes: visibleJudgement,
                  createdByName: caseDetails?.judgementByName,
                  createdAt: caseDetails?.judgementAt
                }] : []).map((hearingItem) => (
                  <div key={`hearing-${hearingItem.number}`} className="judgement-summary-box">
                    <p className="judgement-meta">
                      <strong>{t('Hearing')} {hearingItem.number}</strong>
                    </p>
                    <p className="judgement-summary-text">{hearingItem.notes}</p>
                    <p className="judgement-meta">
                      {hearingItem?.createdByName
                        ? `${t('Recorded by')}: ${hearingItem.createdByName}`
                        : t('Hearing notes available for review.')}
                      {hearingItem?.createdAt
                        ? ` • ${new Date(hearingItem.createdAt).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                ))}

                {canEditJudgement && (
                  <div className="judgement-editor">
                    {canAddHearing && !isCreatingNewHearing && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => {
                          setIsCreatingNewHearing(true);
                          setJudgementText('');
                          setJudgementError('');
                          setJudgementSuccess('');
                        }}
                        style={{ marginBottom: '12px' }}
                      >
                        + {t('Add Hearing')}
                      </button>
                    )}
                    <label htmlFor="judgementText" className="judgement-label">
                      {hearingLabel}
                    </label>
                    <textarea
                      id="judgementText"
                      className="judgement-textarea"
                      rows="5"
                      value={judgementText}
                      onChange={(e) => setJudgementText(e.target.value)}
                      placeholder={t('Enter hearing notes for this case...')}
                    />
                    <button
                      type="button"
                      className="generate-ai-btn judgement-submit-btn"
                      onClick={handleSubmitJudgement}
                      disabled={isSubmittingJudgement}
                    >
                      <FaGavel /> {isSubmittingJudgement ? t('Saving...') : hearings.length > 0 || isCreatingNewHearing ? `${t('Save')} ${hearingLabel}` : hearingLabel}
                    </button>
                    {isCreatingNewHearing && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => {
                          setIsCreatingNewHearing(false);
                          const existingHearings = caseDetails?.hearings || [];
                          const latestHearing = existingHearings[existingHearings.length - 1];
                          setJudgementText(latestHearing?.notes || caseDetails?.judgement || '');
                        }}
                        style={{ marginTop: '10px' }}
                      >
                        {t('Cancel')}
                      </button>
                    )}
                  </div>
                )}

                {!canEditJudgement && visibleJudgement && (
                  <div className="judgement-summary-box">
                    <p className="judgement-meta">{t('Read-only for your role.')}</p>
                  </div>
                )}
              </div>
            )}

            {isAdvocate && (
              <div className="case-card">
                <h3>{t('Client Access')}</h3>
                {clientAccessSuccess && (
                  <div className="upload-success-banner">{clientAccessSuccess}</div>
                )}
                {clientAccessError && (
                  <div className="summary-error-banner">{clientAccessError}</div>
                )}

                <div className="client-access-card">
                  <div className="client-access-form">
                    <input
                      type="text"
                      className="judgement-textarea client-access-input"
                      value={clientCode} // added by cipherNomad
                      onChange={(e) => setClientCode(e.target.value)} // added by cipherNomad
                      placeholder={t('Enter client code, email, or name to verify and link')} // added by cipherNomad
                    />
                    <button // added by cipherNomad
                      type="button" // added by cipherNomad
                      className="generate-ai-btn judgement-submit-btn" // added by cipherNomad
                      onClick={handleVerifyClientCode} // added by cipherNomad
                      disabled={isVerifyingClient} // added by cipherNomad
                    > {/* added by cipherNomad */}
                      <FaCheck /> {isVerifyingClient ? t('Verifying...') : t('Verify Code')} {/* added by cipherNomad */}
                    </button> {/* added by cipherNomad */}
                    <button
                      type="button"
                      className="generate-ai-btn judgement-submit-btn"
                      onClick={handleAssignClient}
                      disabled={isAssigningClient || !verifiedClient} // added by cipherNomad
                    >
                      <FaCheck /> {isAssigningClient ? t('Linking...') : t('Link Client')}
                    </button>
                  </div>
                  {verifiedClient && ( // added by cipherNomad
                    <div className="linked-client-chip"> {/* added by cipherNomad */}
                      <span>{verifiedClient.name || t('Client')}</span> {/* added by cipherNomad */}
                      <small>{verifiedClient.email} ({verifiedClient.clientCode})</small> {/* added by cipherNomad */}
                    </div>
                  )} {/* added by cipherNomad */}

                  <div className="linked-clients-list">
                    {(caseDetails.clients || []).length > 0 ? (
                      caseDetails.clients.map((client, index) => (
                        <div key={`${client.email}-${index}`} className="linked-client-chip">
                          <span>{client.name || t('Client')}</span>
                          <small>{client.email}</small>
                        </div>
                      ))
                    ) : (
                      <p className="case-activity-empty">{t('No clients linked yet.')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="case-card">
              <h3>{t('Case Description')}</h3>
              <p>
                {isTranslating
                  ? t('Translating...')
                  : translatedDesc || caseDetails.description || t('No description provided.')}
              </p>
            </div>

          </div>

          <div className="sidebar-area">
            <div className="case-card">
              <h3>{t('Documents')}</h3>
              {deleteError && (
                <div className="summary-error-banner">{deleteError}</div>
              )}
              {uploadSuccess && (
                <div className="upload-success-banner">{uploadSuccess}</div>
              )}
              {uploadError && (
                <div className="summary-error-banner">{uploadError}</div>
              )}

              <DocumentList
                documents={caseDetails.documents || []}
                emptyText={t('No documents uploaded')}
                canEditPriority={isAdvocate}
                onPriorityChange={handleDocumentPriorityChange}
                onDelete={(doc) => handleDeleteFile('documents', doc.name || doc.fileName || doc.filename)}
              />

              <hr className="divider" />

              <UploadBox
                selectedFiles={selectedFiles}
                onFileChange={handleFileChange}
                onSubmit={handleUploadSubmit}
                onCancel={() => setSelectedFiles([])}
                isUploading={isUploading}
                buttonLabel={t('Upload Documents')}
              />

            </div>

            <div className="case-card">
              <h3>{t('Evidence')}</h3>
              {deleteError && (
                <div className="summary-error-banner">{deleteError}</div>
              )}
              {evidenceSuccess && (
                <div className="upload-success-banner">{evidenceSuccess}</div>
              )}
              {evidenceError && (
                <div className="summary-error-banner">{evidenceError}</div>
              )}

              <DocumentList
                documents={caseDetails.evidence || []}
                emptyText={t('No evidence uploaded yet.')}
                onDelete={(doc) => handleDeleteFile('evidence', doc.name || doc.fileName || doc.filename)}
              />

              <hr className="divider" />

              {!selectedEvidenceFile ? (
                <button className="select-file-btn select-evidence-btn" onClick={() => evidenceInputRef.current.click()}>
                  <FaUpload /> {t('Add Evidence')}
                </button>
              ) : (
                <div className="upload-confirmation-ui">
                  <p className="file-preview">ðŸ“„ {selectedEvidenceFile.name}</p>
                  <div className="confirmation-actions">
                    <button className="confirm-btn" onClick={handleEvidenceUploadSubmit} disabled={isUploadingEvidence}>
                      <FaCheck /> {isUploadingEvidence ? t('Uploading...') : t('Confirm')}
                    </button>
                    <button className="cancel-btn" onClick={() => setSelectedEvidenceFile(null)}>
                      <FaTimes />
                    </button>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={evidenceInputRef}
                style={{ display: 'none' }}
                onChange={handleEvidenceFileChange}
                accept="*/*"
              />
            </div>

            <div className="case-card">
              <h3>{t('Case Timeline')}</h3>
              <div className="case-activity-list">
                {(caseDetails.timeline?.length ? [...caseDetails.timeline].reverse() : []).slice(0, 6).map((item, index) => (
                  <div key={`${item.type}-${index}`} className="case-activity-item">
                    <div className="case-activity-dot" />
                    <div>
                      <p className="case-activity-message">{formatTimelineMessage(item)}</p>
                      <span className="case-activity-time">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : t('Recently')}
                      </span>
                    </div>
                  </div>
                ))}
                {!(caseDetails.timeline?.length) && (
                  <p className="case-activity-empty">{t('No activity recorded yet.')}</p>
                )}
              </div>
            </div>

            <div className="case-card">
              <h3>{t('Case Workflow')}</h3>
                <div className="case-progress-list">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const stateClass = getWorkflowStepState(step.key); // added by cipherNomad

                    return (
                      <div key={step.key} className={`case-progress-item ${stateClass}`}>
                        <div className="case-progress-marker">
                          {stateClass === 'done' ? <FaCheck /> : stateClass === 'attention' ? <FaExclamationTriangle /> : <StepIcon />} {/* added by cipherNomad */}
                        </div>
                        <span className="case-progress-text">{step.label}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default CaseViewPage;
