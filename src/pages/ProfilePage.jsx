import React, { useEffect, useState } from 'react'; // added by cipherNomad
import DashboardLayout from '../components/dashboard/DashboardLayout'; // added by cipherNomad

function ProfilePage() { // added by cipherNomad
  const [profile, setProfile] = useState(null); // added by cipherNomad
  const [isLoading, setIsLoading] = useState(true); // added by cipherNomad
  const [error, setError] = useState(''); // added by cipherNomad
  const [copySuccess, setCopySuccess] = useState(''); // added by cipherNomad
  const [clients, setClients] = useState([]); // added by cipherNomad
  const [clientName, setClientName] = useState(''); // added by cipherNomad
  const [clientEmail, setClientEmail] = useState(''); // added by cipherNomad
  const [clientPassword, setClientPassword] = useState(''); // added by cipherNomad
  const [clientActionMessage, setClientActionMessage] = useState(''); // added by cipherNomad
  const [isRefreshingCode, setIsRefreshingCode] = useState(false); // added by cipherNomad

  const userName = localStorage.getItem('loggedInUserName') || 'Guest'; // added by cipherNomad
  const userInitials = userName.split(' ').map((n) => n[0]).join('').toUpperCase() || 'G'; // added by cipherNomad
  const token = localStorage.getItem('token'); // added by cipherNomad
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {}; // added by cipherNomad

  useEffect(() => { // added by cipherNomad
    const loadProfile = async () => { // added by cipherNomad
      try { // added by cipherNomad
        let response = await fetch('http://localhost:5000/api/auth/me', { // added by cipherNomad
          method: 'GET', // added by cipherNomad
          headers: { ...authHeaders }, // added by cipherNomad
          credentials: 'include' // added by cipherNomad
        }); // added by cipherNomad
        let data = await response.json().catch(() => ({})); // added by cipherNomad
        if (response.status === 404) { // added by cipherNomad
          response = await fetch('http://localhost:5000/api/protected', { // added by cipherNomad
            method: 'GET', // added by cipherNomad
            headers: { ...authHeaders }, // added by cipherNomad
            credentials: 'include' // added by cipherNomad
          }); // added by cipherNomad
          const fallback = await response.json().catch(() => ({})); // added by cipherNomad
          data = { // added by cipherNomad
            name: localStorage.getItem('loggedInUserName') || 'User', // added by cipherNomad
            email: localStorage.getItem('userEmail') || '-', // added by cipherNomad
            role: fallback?.user?.role || localStorage.getItem('userRole') || 'user', // added by cipherNomad
            clientCode: '' // added by cipherNomad
          }; // added by cipherNomad
        } // added by cipherNomad
        if (!response.ok) { // added by cipherNomad
          throw new Error(data?.message || 'Failed to load profile'); // added by cipherNomad
        } // added by cipherNomad
        setProfile(data); // added by cipherNomad
        if (data?.role === 'user' && !data?.clientCode) { // added by cipherNomad
          const ensureResponse = await fetch('http://localhost:5000/api/auth/client-code/ensure', { // added by cipherNomad
            method: 'POST', // added by cipherNomad
            headers: { ...authHeaders }, // added by cipherNomad
            credentials: 'include' // added by cipherNomad
          }); // added by cipherNomad
          const ensureData = await ensureResponse.json().catch(() => ({})); // added by cipherNomad
          if (ensureResponse.ok && ensureData?.clientCode) { // added by cipherNomad
            data.clientCode = ensureData.clientCode; // added by cipherNomad
            setProfile({ ...data }); // added by cipherNomad
            localStorage.setItem('clientCode', ensureData.clientCode); // added by cipherNomad
          } else { // added by cipherNomad
            localStorage.removeItem('clientCode'); // added by cipherNomad
          } // added by cipherNomad
        } else if (data?.clientCode) { // added by cipherNomad
          localStorage.setItem('clientCode', data.clientCode); // added by cipherNomad
        } else { // added by cipherNomad
          localStorage.removeItem('clientCode'); // added by cipherNomad
        } // added by cipherNomad
        if (data?.role === 'advocate') { // added by cipherNomad
          const clientsResponse = await fetch('http://localhost:5000/api/auth/clients', { // added by cipherNomad
            method: 'GET', // added by cipherNomad
            headers: { ...authHeaders }, // added by cipherNomad
            credentials: 'include' // added by cipherNomad
          }); // added by cipherNomad
          const clientsData = await clientsResponse.json().catch(() => []); // added by cipherNomad
          if (clientsResponse.ok) { // added by cipherNomad
            setClients(Array.isArray(clientsData) ? clientsData : []); // added by cipherNomad
          } else { // added by cipherNomad
            setClients([]); // added by cipherNomad
            setClientActionMessage(clientsData?.message || 'Unable to load client list right now'); // added by cipherNomad
          } // added by cipherNomad
        } // added by cipherNomad
      } catch (err) { // added by cipherNomad
        setError(err.message || 'Failed to load profile'); // added by cipherNomad
      } finally { // added by cipherNomad
        setIsLoading(false); // added by cipherNomad
      } // added by cipherNomad
    }; // added by cipherNomad
    loadProfile(); // added by cipherNomad
  }, [token]); // added by cipherNomad

  const handleCopyCode = async () => { // added by cipherNomad
    try { // added by cipherNomad
      if (!profile?.clientCode) return; // added by cipherNomad
      await navigator.clipboard.writeText(profile.clientCode); // added by cipherNomad
      setCopySuccess('Client code copied'); // added by cipherNomad
      setTimeout(() => setCopySuccess(''), 2000); // added by cipherNomad
    } catch (err) { // added by cipherNomad
      setCopySuccess('Copy failed'); // added by cipherNomad
    } // added by cipherNomad
  }; // added by cipherNomad

  const handleCreateClient = async () => { // added by cipherNomad
    try { // added by cipherNomad
      setClientActionMessage(''); // added by cipherNomad
      const response = await fetch('http://localhost:5000/api/auth/clients', { // added by cipherNomad
        method: 'POST', // added by cipherNomad
        credentials: 'include', // added by cipherNomad
        headers: { 'Content-Type': 'application/json', ...authHeaders }, // added by cipherNomad
        body: JSON.stringify({ // added by cipherNomad
          name: clientName, // added by cipherNomad
          email: clientEmail, // added by cipherNomad
          password: clientPassword // added by cipherNomad
        }) // added by cipherNomad
      }); // added by cipherNomad
      const data = await response.json().catch(() => ({})); // added by cipherNomad
      if (!response.ok) { // added by cipherNomad
        throw new Error(data?.message || 'Failed to create client'); // added by cipherNomad
      } // added by cipherNomad
      setClients((prev) => [data, ...prev]); // added by cipherNomad
      setClientName(''); // added by cipherNomad
      setClientEmail(''); // added by cipherNomad
      setClientPassword(''); // added by cipherNomad
      setClientActionMessage('Client created successfully'); // added by cipherNomad
    } catch (err) { // added by cipherNomad
      setClientActionMessage(err.message || 'Failed to create client'); // added by cipherNomad
    } // added by cipherNomad
  }; // added by cipherNomad

  const handleRefreshClientCode = async () => { // added by cipherNomad
    try { // added by cipherNomad
      setIsRefreshingCode(true); // added by cipherNomad
      setError(''); // added by cipherNomad
      const response = await fetch('http://localhost:5000/api/auth/client-code/ensure', { // added by cipherNomad
        method: 'POST', // added by cipherNomad
        headers: { ...authHeaders }, // added by cipherNomad
        credentials: 'include' // added by cipherNomad
      }); // added by cipherNomad
      const data = await response.json().catch(() => ({})); // added by cipherNomad
      if (!response.ok || !data?.clientCode) { // added by cipherNomad
        throw new Error(data?.message || 'Failed to refresh client code'); // added by cipherNomad
      } // added by cipherNomad
      localStorage.setItem('clientCode', data.clientCode); // added by cipherNomad
      setProfile((prev) => prev ? { ...prev, clientCode: data.clientCode } : prev); // added by cipherNomad
      setCopySuccess('Client code refreshed'); // added by cipherNomad
      setTimeout(() => setCopySuccess(''), 2000); // added by cipherNomad
    } catch (err) { // added by cipherNomad
      setError(err.message || 'Failed to refresh client code'); // added by cipherNomad
    } finally { // added by cipherNomad
      setIsRefreshingCode(false); // added by cipherNomad
    } // added by cipherNomad
  }; // added by cipherNomad

  return ( // added by cipherNomad
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
                <button type="button" className="btn btn-secondary btn-small" onClick={handleCopyCode}>
                  Copy Client Code
                </button>
                <button type="button" className="btn btn-secondary btn-small" onClick={handleRefreshClientCode} disabled={isRefreshingCode} style={{ marginLeft: '0.75rem' }}>
                  {isRefreshingCode ? 'Refreshing...' : 'Refresh Client Code'}
                </button>
                {copySuccess && <p style={{ marginTop: '0.5rem' }}>{copySuccess}</p>}
              </div>
            )}
            {profile.role === 'advocate' && (
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '0.75rem' }}>Create Client</h3>
                <input type="text" className="judgement-textarea client-access-input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" />
                <input type="email" className="judgement-textarea client-access-input" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Client email" style={{ marginTop: '0.5rem' }} />
                <input type="password" className="judgement-textarea client-access-input" value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} placeholder="Temporary password" style={{ marginTop: '0.5rem' }} />
                <button type="button" className="btn btn-primary btn-small" style={{ marginTop: '0.75rem' }} onClick={handleCreateClient}>Create Client</button>
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
  ); // added by cipherNomad
} // added by cipherNomad

export default ProfilePage; // added by cipherNomad
