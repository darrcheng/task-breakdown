import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './app.css'
import './pwa/register'
import './firebase/config'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
