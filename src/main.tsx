import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import './pwa/register'
import './firebase/config'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
