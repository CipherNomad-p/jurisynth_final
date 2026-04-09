import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';

const RECYCLE_BIN_STORAGE_KEY = 'jurisynthRecycleBin';

function RecycleBinPage() {
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const userName = localStorage.getItem('loggedInUserName') || 'Guest';
  const userInitials = userName.split(' ').map((n) => n[0]).join('').toUpperCase() || 'G';

  const fetchCases = async () => {
    try {
      const response = await fetch('http://65.0.240.171:5000/api/cases', {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to load recycle bin.');
      }

      setCases(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load recycle bin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const readStoredDeletedFiles = () => {
    try {
      const storedItems = JSON.parse(localStorage.getItem(RECYCLE_BIN_STORAGE_KEY) || '[]');
      return Array.isArray(storedItems) ? storedItems : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const writeStoredDeletedFiles = (items) => {
    localStorage.setItem(RECYCLE_BIN_STORAGE_KEY, JSON.stringify(items));
  };

  const handleRestore = async (caseId, fileName, source) => {
    try {
      let response = await fetch(`http://65.0.240.171:5000/api/cases/${caseId}/files/restore`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName, source })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const storedItems = readStoredDeletedFiles();
        const storedFile = storedItems.find(
          (item) =>
            item.caseId === caseId &&
            item.source === source &&
            (item.fileName || item.filename) === fileName
        );
        const caseItem = cases.find((item) => item._id === caseId);

        if (!storedFile || !caseItem) {
          throw new Error(data?.message || 'Failed to restore file.');
        }

        const updatedSourceFiles = [
          ...(caseItem[source] || []),
          {
            filename: storedFile.filename || storedFile.fileName || fileName,
            fileName: storedFile.fileName || storedFile.filename || fileName,
            path: storedFile.path || '',
            fileUrl: storedFile.fileUrl || '',
            uploadedAt: new Date().toISOString()
          }
        ];

        const updatedRecycleBin = (caseItem.recycleBin || []).filter(
          (item) => !(
            item.source === source &&
            (item.fileName || item.filename) === fileName
          )
        );

        const updatedTimeline = [
          ...(caseItem.timeline || []),
          {
            type: 'file_restored',
            message: `${source === 'documents' ? 'Document' : 'Evidence'} restored: ${fileName}`,
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
            [source]: updatedSourceFiles,
            recycleBin: updatedRecycleBin,
            timeline: updatedTimeline
          })
        });

        const fallbackData = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(fallbackData?.message || data?.message || 'Failed to restore file.');
        }
      }

      const storedItems = readStoredDeletedFiles();
      writeStoredDeletedFiles(
        storedItems.filter(
          (item) =>
            !(
              item.caseId === caseId &&
              item.source === source &&
              (item.fileName || item.filename) === fileName
            )
        )
      );
      await fetchCases();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to restore file.');
    }
  };

  const backendDeletedFiles = cases.flatMap((caseItem) =>
    (caseItem.recycleBin || []).map((file, index) => ({
      caseId: caseItem._id,
      caseTitle: caseItem.title,
      caseNumber: caseItem.caseNumber,
      index,
      ...file
    }))
  );
  const storedDeletedFiles = readStoredDeletedFiles();
  const deletedFiles = [...backendDeletedFiles];

  storedDeletedFiles.forEach((file, index) => {
    const exists = deletedFiles.some(
      (item) =>
        item.caseId === file.caseId &&
        item.source === file.source &&
        (item.fileName || item.filename) === (file.fileName || file.filename)
    );

    if (!exists) {
      deletedFiles.push({
        ...file,
        index: `stored-${index}`
      });
    }
  });

  return (
    <DashboardLayout userName={userName} userInitials={userInitials}>
      <div className="dashboard-section">
        <div className="dashboard-header">
          <h1>Recycle Bin</h1>
        </div>

        {isLoading && <p>Loading deleted files...</p>}
        {error && <div className="summary-error-banner">{error}</div>}

        {!isLoading && deletedFiles.length === 0 && (
          <div className="case-card">
            <p>No deleted files found.</p>
          </div>
        )}

        {!isLoading && deletedFiles.length > 0 && (
          <div className="case-card">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Case</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>File</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Source</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Deleted</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedFiles.map((file) => (
                    <tr key={`${file.caseId}-${file.fileName || file.filename}-${file.index}`} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px' }}>
                        {file.caseTitle} #{file.caseNumber}
                      </td>
                      <td style={{ padding: '12px' }}>{file.fileName || file.filename}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>{file.source}</td>
                      <td style={{ padding: '12px' }}>
                        {file.deletedAt ? new Date(file.deletedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => handleRestore(file.caseId, file.fileName || file.filename, file.source)}
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default RecycleBinPage;
