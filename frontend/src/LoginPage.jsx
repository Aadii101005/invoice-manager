import React, { useState } from 'react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [shake, setShake]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('http://localhost:5000/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('auth_user', username);
        onLogin();
      } else {
        setError(data.message || 'Invalid credentials');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch {
      setError('Cannot connect to server. Make sure backend is running.');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      {/* Animated blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className={`login-box ${shake ? 'shake' : ''}`}>
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-logo">🌾</div>
          <h1 className="login-title">Real Farms</h1>
          <p className="login-subtitle">Invoice Management System</p>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <span>Secure Access</span>
        </div>

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
          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <span className="login-spinner">⏳ Verifying...</span>
            ) : '🔓 Sign In'}
          </button>
        </form>

        <p className="login-footer">
          Protected system — authorised personnel only
        </p>
      </div>
    </div>
  );
}
