import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaScaleBalanced, FaArrowRight } from 'react-icons/fa6';
import { GoogleLogin } from '@react-oauth/google';
import apiconfig from '../config/apiConfig'
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('advocate');

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'https://api.jurisynth.in/api/auth';

  const verifySession = async (token) => {
    try {
      const res = await fetch('https://api.jurisynth.in/api/protected', {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      return res.ok;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    localStorage.removeItem('clientCode'); // added by cipherNomad

    const endpoint = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
    const payload = isLogin
      ? { email, password }
      : { name, email, password, role };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (!isLogin) {
        setIsLogin(true);
        setSuccessMsg('Account created successfully! Please log in.');
        setPassword('');
      } else {
        if (data?.token) {
          localStorage.setItem('token', data.token);
        }

        // VERIFY SESSION BEFORE PROCEEDING


        localStorage.setItem('loggedInUserName', data.name);
        localStorage.setItem('userEmail', data.email || email);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('userId', data._id);
        localStorage.setItem('isAuthenticated', 'true');
        if (data.clientCode) localStorage.setItem('clientCode', data.clientCode); // added by cipherNomad

        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError(null);
    try {
      localStorage.removeItem('clientCode'); // added by cipherNomad
      const response = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google Auth Failed');
      }

      if (data?.token) {
        localStorage.setItem('token', data.token);
      }

      // VERIFY SESSION


      localStorage.setItem('loggedInUserName', data.name);
      localStorage.setItem('userEmail', data.email || '');
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data._id);
      localStorage.setItem('isAuthenticated', 'true');
      if (data.clientCode) localStorage.setItem('clientCode', data.clientCode); // added by cipherNomad
      if (data?.token) {
        console.log("TOKEN FROM BACKEND:", data.token);

        localStorage.setItem('token', data.token);

        console.log("TOKEN SAVED:", localStorage.getItem('token'));
      }
      navigate('/dashboard');

    } catch (err) {
      setError(err.message || 'Network error during Google login');
    }
  };

  return (
    <div className="auth-page-layout">
      <div className="auth-branding-panel">
        <Link to="/" className="branding-logo">
          <FaScaleBalanced style={{ color: 'var(--primary-color)', marginRight: '10px' }} />
          Jurisynth
        </Link>
        <div className="branding-content">
          <FaScaleBalanced className="branding-icon" />
          <h2>The AI advantage for modern legal teams.</h2>
          <p>
            Join thousands of legal professionals automating summaries, tracking
            contradictions, and organizing cases securely.
          </p>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>

          {error && <div className="auth-alert error">{error}</div>}
          {successMsg && <div className="auth-alert success">{successMsg}</div>}

          <div className="google-login-container">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google widget failed to load.')}
              theme="outline"
              size="large"
              text="continue_with"
            />
          </div>

          <div className="auth-divider">
            <span>OR EMAIL</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <label>I am a:</label>
                  <div className="user-type-toggle">
                    <label className={role === 'advocate' ? 'active' : ''}>
                      <input type="radio" name="role" value="advocate" checked={role === 'advocate'} onChange={(e) => setRole(e.target.value)} /> Lawyer
                    </label>
                    <label className={role === 'user' ? 'active' : ''}>
                      <input type="radio" name="role" value="user" checked={role === 'user'} onChange={(e) => setRole(e.target.value)} /> Client
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="email">Work Email</label>
              <input type="email" id="email" placeholder="name@firm.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {isLogin && (
              <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                  Forgot password?
                </Link>
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              {!isLoading && <FaArrowRight style={{ marginLeft: '8px' }} />}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMsg(null); }}>
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;

