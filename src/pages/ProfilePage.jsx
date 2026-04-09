import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [clients, setClients] = useState([]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPassword, setClientPassword] = useState('');
  const [clientActionMessage, setClientActionMessage] = useState('');
  const [isRefreshingCode, setIsRefreshingCode] = useState(false);

  const userName = localStorage.getItem('loggedInUserName') || 'Guest';
  const userInitials = userName.split(' ').map((n) => n[0]).join('').toUpperCase() || 'G';
  const token = localStorage.getItem('token');

  // ✅ guard
  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // ✅ guard
        if (!token) {
          throw new Error("No token found. User not authenticated.");
        }

        let response = await fetch('http://65.0.240.171:5000/api/auth/me', {
          method: 'GET',
          headers: { ...authHeaders }
        });

        let data = await response.json().catch(() => ({}));

        if (response.status === 404) {
          response = await fetch('http://65.0.240.171:5000/api/protected', {
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
          const ensureResponse = await fetch('http://65.0.240.171:5000/api/auth/client-code/ensure', {
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

        // CLIENT LIST (ADVOCATE)
        if (data?.role === 'advocate') {
          const clientsResponse = await fetch('http://65.0.240.171:5000/api/auth/clients', {
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
    } catch (err) {
      setCopySuccess('Copy failed');
    }
  };

  const handleCreateClient = async () => {
    try {
      setClientActionMessage('');

      const response = await fetch('http://65.0.240.171:5000/api/auth/clients', {
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

      const response = await fetch('http://65.0.240.171:5000/api/auth/client-code/ensure', {
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

            {profile.role === 'user' && (
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Client Code:</strong> {profile.clientCode || 'Not generated'}</p>

                <button className="btn btn-secondary btn-small" onClick={handleCopyCode}>
                  Copy Client Code
                </button>

                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleRefreshClientCode}
                  disabled={isRefreshingCode}
                  style={{ marginLeft: '0.75rem' }}
                >
                  {isRefreshingCode ? 'Refreshing...' : 'Refresh Client Code'}
                </button>

                {copySuccess && <p style={{ marginTop: '0.5rem' }}>{copySuccess}</p>}
              </div>
            )}

            {profile.role === 'advocate' && (
              <div style={{ marginTop: '1rem' }}>
                <h3>Create Client</h3>

                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" />
                <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Client email" />
                <input value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} placeholder="Password" />

                <button onClick={handleCreateClient}>Create Client</button>

                {clientActionMessage && <p>{clientActionMessage}</p>}

                <h3>My Clients</h3>

                {clients.map((c) => (
                  <div key={c._id}>
                    {c.name} ({c.email})
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