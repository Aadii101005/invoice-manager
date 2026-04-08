import React, { useState } from 'react';

// Credentials from Vite env variables (set in Vercel dashboard too)
const VALID_USER = import.meta.env.VITE_AUTH_USER || 'admin';
const VALID_PASS = import.meta.env.VITE_AUTH_PASS || 'RealFarms@2026';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  const triggerError = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Small artificial delay for UX
    setTimeout(() => {
      if (username === VALID_USER && password === VALID_PASS) {
        sessionStorage.setItem('auth_user', username);
        sessionStorage.setItem('auth_token', btoa(`${username}:${Date.now()}`));
        onLogin();
      } else {
        triggerError('Invalid username or password. Please try again.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-bg">
      {/* Animated blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className={`login-box ${shake ? 'shake' : ''}`}>
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">🌾</div>
          <h1 className="login-title">Real Farms</h1>
          <p className="login-subtitle">Invoice Management System</p>
        </div>

        {/* Divider */}
        <div className="login-divider"><span>Secure Access</span></div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">

          {/* Username */}
          <div className="login-field">
            <label htmlFor="username">Username</label>
            <div className="login-input-wrap">
              <span className="login-icon">👤</span>
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-input-wrap">
              <span className="login-icon">🔒</span>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn-toggle-pass"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <div className="login-error">⚠️ {error}</div>}

          {/* Submit */}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '⏳ Verifying...' : '🔓 Sign In'}
          </button>
        </form>

        <p className="login-footer">Protected system — authorised personnel only</p>
      </div>
    </div>
  );
}
