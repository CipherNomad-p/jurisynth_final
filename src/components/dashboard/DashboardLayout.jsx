import React, { useEffect, useMemo, useRef, useState } from 'react'; // added by cipherNomad
import Sidebar from './Sidebar'; 
import SearchBar from '../shared/SearchBar';
import { FaBell } from 'react-icons/fa'; // added by cipherNomad
import { fetchMyClients, fetchNotifications, markNotificationRead, sendClientNotification } from '../../services/notificationService'; // added by cipherNomad

function DashboardLayout({ children, userName, userInitials, showSearch = true }) {
  const userRole = localStorage.getItem('userRole') || 'user';
  const isAdvocate = userRole === 'advocate';
  const statusLabel = isAdvocate ? 'Status: Advocate Login' : 'Status: User Login';
  const [notifications, setNotifications] = useState([]); // added by cipherNomad
  const [isOpen, setIsOpen] = useState(false); // added by cipherNomad
  const [activeNotificationTab, setActiveNotificationTab] = useState('inbox');
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState('');
  const [requestType, setRequestType] = useState('document_requested');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => { // added by cipherNomad
    const load = async () => { // added by cipherNomad
      try { // added by cipherNomad
        const data = await fetchNotifications(); // added by cipherNomad
        setNotifications(data); // added by cipherNomad
      } catch (error) { // added by cipherNomad
        console.error(error); // added by cipherNomad
      } // added by cipherNomad
    }; // added by cipherNomad
    load(); // added by cipherNomad
    const timer = setInterval(load, 15000); // added by cipherNomad
    return () => clearInterval(timer); // added by cipherNomad
  }, []); // added by cipherNomad

  useEffect(() => {
    if (!isOpen || !isAdvocate) return;
    const loadClients = async () => {
      try {
        const clientData = await fetchMyClients();
        setClients(clientData);
      } catch (error) {
        console.error(error);
      }
    };
    loadClients();
  }, [isOpen, isAdvocate]);

  useEffect(() => {
    if (!isOpen) return;
    const onDocumentClick = (event) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length; // added by cipherNomad

  const handleMarkRead = async (id) => { // added by cipherNomad
    try { // added by cipherNomad
      await markNotificationRead(id); // added by cipherNomad
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n)); // added by cipherNomad
    } catch (error) { // added by cipherNomad
      console.error(error); // added by cipherNomad
    } // added by cipherNomad
  }; // added by cipherNomad

  const requestTypeOptions = useMemo(() => ([
    { value: 'document_requested', label: 'Document Request' },
    { value: 'hearing_update', label: 'Hearing Update' },
    { value: 'case_update', label: 'Case Update' },
    { value: 'payment_reminder', label: 'Payment Reminder' },
    { value: 'generic', label: 'General Notification' }
  ]), []);

  const handleSendClientNotification = async () => {
    if (!clientId) {
      setRequestStatus('Please select a client');
      return;
    }
    setIsSendingRequest(true);
    setRequestStatus('');
    try {
      await sendClientNotification({
        recipientId: clientId,
        type: requestType,
        message: requestMessage
      });
      setRequestMessage('');
      setRequestStatus('Notification sent to client');
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      setRequestStatus(error.message || 'Failed to send notification');
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar userName={userName} userInitials={userInitials} />
      
      <main className="dashboard-main-content">
        <div className="dashboard-layout-topbar">
          {showSearch ? (
            <SearchBar className="dashboard-global-search" />
          ) : (
            <div className="dashboard-topbar-spacer" />
          )}
          {isOpen && <div className="dashboard-notification-scrim" onClick={() => setIsOpen(false)} />}
          <div className="dashboard-notification-area" ref={dropdownRef}> {/* added by cipherNomad */}
            <div className="dashboard-bell-wrapper" onClick={() => setIsOpen(!isOpen)}> {/* added by cipherNomad */}
              <FaBell className="dashboard-bell-icon" /> {/* added by cipherNomad */}
              {unreadCount > 0 && ( /* added by cipherNomad */
                <span className="dashboard-bell-badge">{unreadCount}</span> /* added by cipherNomad */
              )} {/* added by cipherNomad */}
            </div> {/* added by cipherNomad */}
            {isOpen && ( /* added by cipherNomad */
              <div className="dashboard-notification-dropdown"> {/* added by cipherNomad */}
                <div className="dashboard-notification-header">
                  <h4>Notifications</h4>
                  <div className="dashboard-notification-tabs">
                    <button
                      type="button"
                      className={`dashboard-notification-tab ${activeNotificationTab === 'inbox' ? 'active' : ''}`}
                      onClick={() => setActiveNotificationTab('inbox')}
                    >
                      Inbox
                    </button>
                    {isAdvocate && (
                      <button
                        type="button"
                        className={`dashboard-notification-tab ${activeNotificationTab === 'send' ? 'active' : ''}`}
                        onClick={() => setActiveNotificationTab('send')}
                      >
                        Send to Client
                      </button>
                    )}
                  </div>
                </div>

                {activeNotificationTab === 'inbox' && (
                  <>
                    {notifications.length === 0 && ( /* added by cipherNomad */
                      <div className="dashboard-notification-empty">No notifications</div> /* added by cipherNomad */
                    )} {/* added by cipherNomad */}
                    {notifications.map((item) => ( /* added by cipherNomad */
                      <div
                        key={item._id} // added by cipherNomad
                        className={`dashboard-notification-item ${item.isRead ? '' : 'unread'}`} // added by cipherNomad
                        onClick={() => handleMarkRead(item._id)} // added by cipherNomad
                      >
                        <div className="dashboard-notification-message">{item.message}</div> {/* added by cipherNomad */}
                        <div className="dashboard-notification-meta">{item.type}</div> {/* added by cipherNomad */}
                      </div>
                    ))} {/* added by cipherNomad */}
                  </>
                )}

                {isAdvocate && activeNotificationTab === 'send' && (
                  <div className="dashboard-notification-send-panel">
                    <label htmlFor="notification-client-select">Client</label>
                    <select
                      id="notification-client-select"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                    >
                      <option value="">Select a client</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.name} ({client.clientCode || client.email})
                        </option>
                      ))}
                    </select>

                    <label htmlFor="notification-type-select">Notification Type</label>
                    <select
                      id="notification-type-select"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                    >
                      {requestTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>

                    <label htmlFor="notification-message-input">Message (optional)</label>
                    <textarea
                      id="notification-message-input"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Add custom instruction for the client"
                      rows={3}
                    />

                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={handleSendClientNotification}
                      disabled={isSendingRequest}
                    >
                      {isSendingRequest ? 'Sending...' : 'Send Notification'}
                    </button>
                    {requestStatus && <p className="dashboard-notification-send-status">{requestStatus}</p>}
                  </div>
                )}
              </div>
            )} {/* added by cipherNomad */}
          </div> {/* added by cipherNomad */}
          <span className={`login-status-badge ${isAdvocate ? 'login-status-advocate' : 'login-status-user'}`}>
            {statusLabel}
          </span>
        </div>
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;

