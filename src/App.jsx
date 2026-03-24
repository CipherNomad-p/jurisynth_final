import React from 'react';
import './styles.css'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import { LanguageProvider } from './context/LanguageContext';

import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import Dashboard from './components/dashboard/Dashboard';
import CaseViewPage from './pages/CaseViewPage';
import AllCasesPage from './pages/AllCasesPage';
import GlobalSearchPage from './pages/GlobalSearchPage';
import SettingsPage from './pages/SettingsPage'; 
import CreateCasePage from './pages/CreateCasePage';
import CrimeInfoPage from './pages/CrimeInfoPage';
import RecycleBinPage from './pages/RecycleBinPage';
import TranscribeAudio from './pages/TranscribeAudio';

function App() {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/case/:caseId" element={<CaseViewPage />} />
            <Route path="/all-cases" element={<AllCasesPage />} /> 
            <Route path="/search" element={<GlobalSearchPage />} /> 
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/crime-info" element={<CrimeInfoPage />} />
            <Route path="/recycle-bin" element={<RecycleBinPage />} />
            <Route path="/createcase" element={<CreateCasePage />} />
            <Route path="/transcribe" element={<TranscribeAudio />} />
            <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
