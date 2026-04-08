import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import LoginPage from './LoginPage.jsx'

function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!sessionStorage.getItem('auth_token')
  );

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }
  return <App onLogout={() => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setIsAuthenticated(false);
  }} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
