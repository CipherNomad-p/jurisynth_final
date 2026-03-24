import React from 'react';
import Sidebar from './Sidebar'; 
import SearchBar from '../shared/SearchBar';

function DashboardLayout({ children, userName, userInitials, showSearch = true }) {
  const userRole = localStorage.getItem('userRole') || 'user';
  const isAdvocate = userRole === 'advocate';
  const statusLabel = isAdvocate ? 'Status: Advocate Login' : 'Status: User Login';

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

