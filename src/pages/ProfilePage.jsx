import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [clients, setClients] = useState([]);
  const [caseClients, setCaseClients] = useState([]); // ✅ NEW
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientActionMessage, setClientActionMessage] = useState('');
  const [isRefreshingCode, setIsRefreshingCode] = useState(false);

  const userName = localStorage.getItem('loggedInUserName') || 'Guest';
  const userInitials = userName.split(' ').map((n) => n[0]).join('').toUpperCase() || 'G';
  const token = localStorage.getItem('token');

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!token) {
          throw new Error("No token found. User not authenticated.");
        }

        let response = await fetch('https://api.jurisynth.in/api/auth/me', {
          method: 'GET',
          headers: { ...authHeaders }
        });

        let data = await response.json().catch(() => ({}));

        if (response.status === 404) {
          response = await fetch('https://api.jurisynth.in/api/protected', {
            method: 'GET',
            headers: { ...authHeaders }
          });

          const fallback = await response.json().catch(() => ({}));

          data = {
            name: localStorage.getItem('loggedInUserName') || 'User',
            email: localStorage.getItem('userEmail') || '-',
            role: fallback?.user?.role || localStorage.getItem('userRole') || 'user',
            clientCode: ''
          };
        }

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to load profile');
        }

        setProfile(data);

        // CLIENT CODE LOGIC
        if (data?.role === 'user' && !data?.clientCode) {
          const ensureResponse = await fetch('https://api.jurisynth.in/api/auth/client-code/ensure', {
            method: 'POST',
            headers: { ...authHeaders }
          });

          const ensureData = await ensureResponse.json().catch(() => ({}));

          if (ensureResponse.ok && ensureData?.clientCode) {
            data.clientCode = ensureData.clientCode;
            setProfile({ ...data });
            localStorage.setItem('clientCode', ensureData.clientCode);
          } else {
            localStorage.removeItem('clientCode');
          }
        } else if (data?.clientCode) {
          localStorage.setItem('clientCode', data.clientCode);
        } else {
          localStorage.removeItem('clientCode');
        }

        // CREATED CLIENTS
        if (data?.role === 'advocate') {
          const clientsResponse = await fetch('https://api.jurisynth.in/api/auth/clients', {
            method: 'GET',
            headers: { ...authHeaders }
          });

          const clientsData = await clientsResponse.json().catch(() => []);

          if (clientsResponse.ok) {
            setClients(Array.isArray(clientsData) ? clientsData : []);
          } else {
            setClients([]);
            setClientActionMessage(clientsData?.message || 'Unable to load client list right now');
          }
        }

        // ✅ NEW: FETCH CASE CLIENTS
        if (data?.role === 'advocate') {
          const casesRes = await fetch('https://api.jurisynth.in/api/cases', {
            method: 'GET',
            headers: { ...authHeaders }
          });

          const casesData = await casesRes.json().catch(() => []);

          if (casesRes.ok && Array.isArray(casesData)) {
            const uniqueClients = {};

            casesData.forEach((c) => {
              const client = c.client || c.clientDetails;

              if (client && (client.email || client.name)) {
                const key = client.email || client.name;

                if (!uniqueClients[key]) {
                  uniqueClients[key] = client;
                }
              }
            });

            setCaseClients(Object.values(uniqueClients));
          }
        }

      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const handleCopyCode = async () => {
    try {
      if (!profile?.clientCode) return;
      await navigator.clipboard.writeText(profile.clientCode);
      setCopySuccess('Client code copied');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch {
      setCopySuccess('Copy failed');
    }
  };

  const handleCreateClient = async () => {
    try {
      setClientActionMessage('');

      const response = await fetch('https://api.jurisynth.in/api/auth/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          password: clientPassword
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to create client');
      }

      setClients((prev) => [data, ...prev]);
      setClientName('');
      setClientEmail('');
      setClientPassword('');
      setClientActionMessage('Client created successfully');

    } catch (err) {
      setClientActionMessage(err.message || 'Failed to create client');
    }
  };

  const handleRefreshClientCode = async () => {
    try {
      setIsRefreshingCode(true);
      setError('');

      const response = await fetch('https://api.jurisynth.in/api/auth/client-code/ensure', {
        method: 'POST',
        headers: { ...authHeaders }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.clientCode) {
        throw new Error(data?.message || 'Failed to refresh client code');
      }

      localStorage.setItem('clientCode', data.clientCode);
      setProfile((prev) => prev ? { ...prev, clientCode: data.clientCode } : prev);

      setCopySuccess('Client code refreshed');
      setTimeout(() => setCopySuccess(''), 2000);

    } catch (err) {
      setError(err.message || 'Failed to refresh client code');
    } finally {
      setIsRefreshingCode(false);
    }
  };

  return (
    <DashboardLayout userName={userName} userInitials={userInitials}>
      <div className="dashboard-header">
        <h2>Profile</h2>
      </div>

      <div className="case-card" style={{ padding: '1.5rem' }}>
        {isLoading && <p>Loading profile...</p>}
        {!isLoading && error && <p style={{ color: '#b42318' }}>{error}</p>}

        {!isLoading && !error && profile && (
          <>
            <p><strong>Name:</strong> {profile.name || '-'}</p>
            <p><strong>Email:</strong> {profile.email || '-'}</p>
            <p><strong>Role:</strong> {profile.role || '-'}</p>

            {profile.role === 'advocate' && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ marginTop: '1rem' }}>Clients From Cases</h3>

                {caseClients.length === 0 && <p>No clients linked to cases yet.</p>}

                {caseClients.map((client, i) => (
                  <div key={i} className="linked-client-chip" style={{ marginBottom: '0.5rem' }}>
                    <span>{client.name || 'Unknown'}</span>
                    <small>{client.email || 'No email'}</small>
                  </div>
                ))}
              </div>
            )}

            {/* EXISTING UI BELOW — untouched */}
            {profile.role === 'advocate' && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Create Client</h3>

                <input type="text" className="judgement-textarea client-access-input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" />
                <input type="email" className="judgement-textarea client-access-input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Client email" style={{ marginTop: '0.5rem' }} />
                <input type="password" className="judgement-textarea client-access-input" value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} placeholder="Temporary password" style={{ marginTop: '0.5rem' }} />

                <button type="button" className="btn btn-primary btn-small" style={{ marginTop: '0.75rem' }} onClick={handleCreateClient}>
                  Create Client
                </button>

                {clientActionMessage && <p style={{ marginTop: '0.5rem' }}>{clientActionMessage}</p>}

                <h3 style={{ marginTop: '1rem', marginBottom: '0.75rem' }}>My Clients</h3>

                {clients.length === 0 && <p>No clients created yet.</p>}

                {clients.map((client) => (
                  <div key={client._id || client.email} className="linked-client-chip" style={{ marginBottom: '0.5rem' }}>
                    <span>{client.name}</span>
                    <small>{client.email} ({client.clientCode || 'No code'})</small>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ProfilePage;